
import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service.js";
import { classifyTicket } from "./graphs/ticket-classification.graph.js";
import { draftTicketResponse } from "./graphs/response-drafting.graph.js";



@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async classifyAndSave(ticketId: string) {
    // 1. Fetch the ticket from PostgreSQL.
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }

    const model =
      this.configService.get<string>("GEMINI_MODEL") ??
      "gemini-3.5-flash-lite";

    // 2. Ask Gemini to classify the ticket.
    let classification: Awaited<ReturnType<typeof classifyTicket>>;

    try {
      classification = await classifyTicket({
        subject: ticket.subject,
        description: ticket.description,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown Gemini classification error";

      this.logger.error(
        `Classification failed for ticket ${ticketId}: ${message}`,
      );

      // Record the AI failure separately from ticket updates.
      try {
        await this.prisma.ticketAIAnalysis.create({
          data: {
            ticketId: ticket.id,
            model,
            promptVersion: "ticket-classification-v1",
            category: ticket.category,
            priority: ticket.priority,
            processingStatus: "FAILED",
            errorMessage: message.slice(0, 2000),
          },
        });
      } catch (dbError) {
        this.logger.error(
          `Could not save AI failure record for ticket ${ticketId}`,
          dbError instanceof Error ? dbError.stack : undefined,
        );
      }

      throw new ServiceUnavailableException(
        "AI classification is temporarily unavailable. Please retry.",
      );
    }

    // 3. Save the successful AI analysis.
    const analysis = await this.prisma.ticketAIAnalysis.create({
      data: {
        ticketId: ticket.id,
        model,
        promptVersion: "ticket-classification-v1",
        category: classification.category,
        priority: classification.priority,
        confidence: classification.confidence,
        processingStatus: "COMPLETED",
      },
    });

    // 4. Update the ticket without overwriting admin overrides.
    const updatedTicket = await this.prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        ...(!ticket.categoryOverridden && {
          category: classification.category,
        }),
        ...(!ticket.priorityOverridden && {
          priority: classification.priority,
        }),
      },
    });

    return {
      ticket: updatedTicket,
      analysis,
      classification,
    };
  }


   async classifyAndDraft(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }

    const model =
      this.configService.get<string>("GEMINI_MODEL") ??
      "gemini-3.5-flash-lite";

    // 1. Classify the ticket using Gemini.
    let classification: Awaited<ReturnType<typeof classifyTicket>>;

    try {
      classification = await classifyTicket({
        subject: ticket.subject,
        description: ticket.description,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown AI error";

      this.logger.error(
        `Ticket classification failed for ${ticketId}: ${message}`,
      );

      throw new ServiceUnavailableException(
        "AI classification is temporarily unavailable.",
      );
    }

    // 2. Respect any category or priority selected by an admin.
    const effectiveCategory = ticket.categoryOverridden
      ? ticket.category
      : classification.category;

    const effectivePriority = ticket.priorityOverridden
      ? ticket.priority
      : classification.priority;

    // 3. Generate a draft using the relevant BookLeaf policy.
    let draftResponse: string;

    try {
      draftResponse = await draftTicketResponse({
        subject: ticket.subject,
        description: ticket.description,
        category: effectiveCategory,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown AI error";

      this.logger.error(
        `Draft generation failed for ${ticketId}: ${message}`,
      );

      // Keep the classification even if drafting fails.
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          ...(!ticket.categoryOverridden && {
            category: classification.category,
          }),
          ...(!ticket.priorityOverridden && {
            priority: classification.priority,
          }),
        },
      });

      await this.prisma.ticketAIAnalysis.create({
        data: {
          ticketId,
          model,
          promptVersion: "ticket-classification-v1",
          category: classification.category,
          priority: classification.priority,
          confidence: classification.confidence,
          processingStatus: "FAILED",
          errorMessage: message.slice(0, 2000),
        },
      });

      throw new ServiceUnavailableException(
        "AI response drafting is temporarily unavailable.",
      );
    }

    // 4. Persist the ticket changes and AI analysis together.
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedTicket = await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          ...(!ticket.categoryOverridden && {
            category: classification.category,
          }),
          ...(!ticket.priorityOverridden && {
            priority: classification.priority,
          }),
        },
      });

      const analysis = await tx.ticketAIAnalysis.create({
        data: {
          ticketId,
          model,
          promptVersion: "classification-and-draft-v1",
          category: classification.category,
          priority: classification.priority,
          confidence: classification.confidence,
          draftResponse,
          processingStatus: "COMPLETED",
        },
      });

      return { ticket: updatedTicket, analysis };
    });

    return result;
  }

  async getLatestDraft(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });

    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }

    return this.prisma.ticketAIAnalysis.findFirst({
      where: {
        ticketId,
        draftResponse: { not: null },
        processingStatus: "COMPLETED",
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
