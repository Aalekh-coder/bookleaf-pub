import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateTicketDto } from './dto/create-ticket.dto/create-ticket.dto.js';
import {
  Prisma,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  UserRole,
} from '@prisma/client';
import { QueryMyTicketsDto } from './dto/query-my-tickets.dto/query-my-tickets.dto.js';
import { QueryAdminTicketsDto } from './dto/query-admin-tickets.dto/query-admin-tickets.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto/update-ticket.dto.js';
import { AiService } from '../ai/ai.service.js';
import { UpdateTicketClassificationDto } from './dto/update-ticket-classification.dto.ts/update-ticket-classification.dto.js';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async create(createTicketDto: CreateTicketDto, authorId: string) {
    const author = await this.prisma.user.findFirst({
      where: {
        id: authorId,
        role: 'AUTHOR',
        isActive: true,
      },
      select: { id: true },
    });

    if (!author) {
      throw new NotFoundException('Active author not found');
    }

    // If a book was selected, verify that it belongs to this author.
    if (createTicketDto.bookId) {
      const book = await this.prisma.book.findFirst({
        where: {
          id: createTicketDto.bookId,
          authorId,
        },
        select: { id: true },
      });

      if (!book) {
        throw new NotFoundException('Book not found or does not belong to you');
      }
    }

    try {
      const ticket = await this.prisma.supportTicket.create({
        data: {
          subject: createTicketDto.subject.trim(),
          description: createTicketDto.description.trim(),

          bookId: createTicketDto.bookId ?? null,

          authorId,
          status: TicketStatus.OPEN,
          category: createTicketDto.category ?? TicketCategory.GENERAL_INQUIRY,
          priority: TicketPriority.MEDIUM,
          categoryOverridden: createTicketDto.category !== undefined,

          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: TicketStatus.OPEN,
              changedById: authorId,
              note: 'Ticket created',
            },
          },
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              isbn: true,
            },
          },
          statusHistory: true,
        },
      });

      const aiClassification = this.aiService
        .classifyAndSave(ticket.id)
        .catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Unknown error';

          console.error(
            `AI classification failed for ticket ${ticket.id}: ${message}`,
          );
        });

      const responseDraft = this.aiService
        .classifyAndDraft(ticket.id)
        .catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Unknown error';

          console.error(
            `AI processing failed for ticket ${ticket.id}: ${message}`,
          );
        });

      return {
        message: 'Support ticket created successfully',
        data: ticket,
        aiClassification,
        responseDraft,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Could not create the ticket because a related record is invalid',
        );
      }

      throw error;
    }
  }

  async getMyTickets(authorId: string, query: QueryMyTicketsDto) {
    const author = await this.prisma.user.findFirst({
      where: {
        id: authorId,
        role: 'AUTHOR',
        isActive: true,
      },
      select: { id: true },
    });

    if (!author) {
      throw new ForbiddenException(
        'Only active authors can view their tickets',
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const fromDate = query.fromDate ? new Date(query.fromDate) : undefined;
    const toDate = query.toDate ? new Date(query.toDate) : undefined;

    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException(
        'fromDate must be earlier than or equal to toDate',
      );
    }

    const where: Prisma.SupportTicketWhereInput = {
      authorId,
      ...(query.status && { status: query.status }),
      ...(query.category && { category: query.category }),
      ...(query.priority && { priority: query.priority }),
      ...((fromDate || toDate) && {
        createdAt: {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        },
      }),
      ...(query.search?.trim() && {
        OR: [
          { subject: { contains: query.search.trim(), mode: 'insensitive' } },
          {
            description: { contains: query.search.trim(), mode: 'insensitive' },
          },
          {
            ticketNumber: {
              contains: query.search.trim(),
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const [tickets, total] = await this.prisma.$transaction([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          book: {
            select: {
              id: true,
              title: true,
              isbn: true,
            },
          },
          messages: {
            where: { visibility: 'PUBLIC' },
            orderBy: { createdAt: 'asc' },
            include: {
              sender: {
                select: { id: true, name: true, role: true },
              },
            },
          },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      message: 'Your support tickets retrieved successfully',
      data: tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async ticketById(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        aiAnalyses: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    const { aiAnalyses, ...ticketDetails } = ticket;

    return {
      message: 'Support ticket retrieved successfully',
      data: {
        ...ticketDetails,
        ticketAIAnalysis: aiAnalyses[0] ?? null,
      },
    };
  }

  async ticketByIdForAuthor(id: string, authorId: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: {
        id,
        authorId,
      },
      include: {
        messages: {
          where: {
            visibility: 'PUBLIC',
          },
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            senderId: true,
            body: true,
            createdAt: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    return {
      message: 'Support ticket conversation retrieved successfully',
      data: ticket,
    };
  }

  async getAllTicketsForAdmin(adminId: string, query: QueryAdminTicketsDto) {
    const admin = await this.prisma.user.findFirst({
      where: {
        id: adminId,
        role: 'ADMIN',
        isActive: true,
      },
      select: { id: true },
    });

    if (!admin) {
      throw new ForbiddenException(
        'Only active admins can access the ticket queue',
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const fromDate = query.fromDate ? new Date(query.fromDate) : undefined;
    const toDate = query.toDate ? new Date(query.toDate) : undefined;

    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException(
        'fromDate must be earlier than or equal to toDate',
      );
    }

    const search = query.search?.trim();

    const where: Prisma.SupportTicketWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.category && { category: query.category }),
      ...(query.priority && { priority: query.priority }),
      ...(query.assigneeId && { assigneeId: query.assigneeId }),
      ...((fromDate || toDate) && {
        createdAt: {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        },
      }),
      ...(search && {
        OR: [
          { subject: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { ticketNumber: { contains: search, mode: 'insensitive' } },
          {
            author: {
              is: {
                email: { contains: search, mode: 'insensitive' },
              },
            },
          },
          {
            author: {
              is: {
                name: { contains: search, mode: 'insensitive' },
              },
            },
          },
        ],
      }),
    };

    const [tickets, total] = await this.prisma.$transaction([
      this.prisma.supportTicket.findMany({
        where,
        // PostgreSQL enum order follows the enum declaration:
        // CRITICAL, HIGH, MEDIUM, LOW; oldest tickets appear first within priority.
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
              isbn: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      message: 'Admin ticket queue retrieved successfully',
      data: tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateTicket(ticketId: string, adminId: string, dto: UpdateTicketDto) {
    if (!ticketId || typeof ticketId !== 'string' || !ticketId.trim()) {
      throw new BadRequestException('A valid ticket ID is required');
    }

    const admin = await this.prisma.user.findFirst({
      where: {
        id: adminId,
        role: UserRole.ADMIN,
        isActive: true,
      },
      select: { id: true },
    });

    if (!admin) {
      throw new ForbiddenException('Only active admins can update tickets');
    }

    const existingTicket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existingTicket) {
      throw new NotFoundException('Support ticket not found');
    }

    if (
      dto.status === undefined &&
      dto.category === undefined &&
      dto.priority === undefined &&
      dto.assigneeId === undefined
    ) {
      throw new BadRequestException(
        'Provide at least one field to update: status, category, priority, or assigneeId',
      );
    }

    if (dto.assigneeId) {
      const assignee = await this.prisma.user.findFirst({
        where: {
          id: dto.assigneeId,
          role: UserRole.ADMIN,
          isActive: true,
        },
        select: { id: true },
      });

      if (!assignee) {
        throw new BadRequestException('Assignee must be an active admin user');
      }
    }

    const statusChanged =
      dto.status !== undefined && dto.status !== existingTicket.status;

    const now = new Date();

    const updateData = {
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.category !== undefined && { category: dto.category }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),

      ...(dto.status === TicketStatus.RESOLVED && {
        resolvedAt: now,
        closedAt: null,
      }),

      ...(dto.status === TicketStatus.CLOSED && {
        closedAt: now,
      }),

      ...((dto.status === TicketStatus.OPEN ||
        dto.status === TicketStatus.IN_PROGRESS) && {
        resolvedAt: null,
        closedAt: null,
      }),
    };

    const updatedTicket = await this.prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.update({
        where: { id: ticketId },
        data: updateData,
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
          book: {
            select: { id: true, title: true, isbn: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (statusChanged && dto.status !== undefined) {
        await tx.ticketStatusHistory.create({
          data: {
            ticketId,
            fromStatus: existingTicket.status,
            toStatus: dto.status,
            changedById: adminId,
            note: dto.note?.trim() || 'Ticket status updated by admin',
          },
        });
      }

      return ticket;
    });

    return {
      message: 'Support ticket updated successfully',
      data: updatedTicket,
    };
  }

  async sendReply(
    ticketId: string,
    adminId: string,
    body: string,
    analysisId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.findUnique({
        where: { id: ticketId },
        select: { id: true, status: true },
      });

      if (!ticket) {
        throw new NotFoundException('Support ticket not found');
      }

      if (ticket.status === 'CLOSED') {
        throw new ConflictException('Cannot reply to a closed ticket');
      }

      if (analysisId) {
        const analysis = await tx.ticketAIAnalysis.findFirst({
          where: {
            id: analysisId,
            ticketId,
          },
          select: {
            id: true,
            sentAt: true,
          },
        });

        if (!analysis) {
          throw new NotFoundException('AI analysis not found for this ticket');
        }

        const claimed = await tx.ticketAIAnalysis.updateMany({
          where: {
            id: analysisId,
            ticketId,
            sentAt: null,
          },
          data: {
            sentAt: new Date(),
          },
        });

        if (claimed.count !== 1) {
          throw new ConflictException('This AI draft has already been sent');
        }
      }

      const message = await tx.ticketMessage.create({
        data: {
          ticketId,
          senderId: adminId,
          body,
          visibility: 'PUBLIC',
        },
      });

      return {
        message: 'Reply sent successfully',
        data: message,
      };
    });
  }

  async updateClassification(
    ticketId: string,
    dto: UpdateTicketClassificationDto,
    adminId: string,
  ) {
    if (dto.category === undefined && dto.priority === undefined) {
      throw new BadRequestException('Provide a category, a priority, or both');
    }

    const existingTicket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });

    if (!existingTicket) {
      throw new NotFoundException('Support ticket not found');
    }

    const data = {
      ...(dto.category !== undefined && {
        category: dto.category,
        categoryOverridden: true,
      }),
      ...(dto.priority !== undefined && {
        priority: dto.priority,
        priorityOverridden: true,
      }),
    };

    const ticket = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data,
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        category: true,
        priority: true,
        categoryOverridden: true,
        priorityOverridden: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Ticket classification updated successfully',
      data: ticket,
    };
  }
}
