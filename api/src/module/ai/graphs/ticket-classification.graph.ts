import { Injectable } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { z } from 'zod';

const CategorySchema = z.enum([
  'ROYALTY_PAYMENTS',
  'ISBN_METADATA',
  'PRINTING_QUALITY',
  'DISTRIBUTION_AVAILABILITY',
  'BOOK_STATUS_PRODUCTION',
  'GENERAL_INQUIRY',
]);

const PrioritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

const ClassificationSchema = z.object({
  category: CategorySchema,
  priority: PrioritySchema,
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

const TicketClassificationState = Annotation.Root({
  subject: Annotation<string>,
  description: Annotation<string>,
  category: Annotation<z.infer<typeof CategorySchema> | undefined>,
  priority: Annotation<z.infer<typeof PrioritySchema> | undefined>,
  confidence: Annotation<number | undefined>,
  reasoning: Annotation<string | undefined>,
});

@Injectable()
export class TicketClassificationGraph {
  private readonly model = new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    temperature: 0,
    maxRetries: 2,
    apiKey: process.env.GEMINI_API_KEY,
  });

  private readonly classifier =
    this.model.withStructuredOutput(ClassificationSchema);

  private readonly graph = new StateGraph(TicketClassificationState)
    .addNode('classify', async (state) => {
      const result = await this.classifier.invoke([
        [
          'system',
          `You classify support tickets for BookLeaf Publishing.

Choose exactly one category:
- ROYALTY_PAYMENTS: royalty amounts, statements, or payments.
- ISBN_METADATA: ISBN, title metadata, author details, or book listing metadata.
- PRINTING_QUALITY: print defects, binding, paper, or physical quality.
- DISTRIBUTION_AVAILABILITY: bookstore listings, distribution, or availability.
- BOOK_STATUS_PRODUCTION: production progress, publishing stages, or book status.
- GENERAL_INQUIRY: anything that does not fit the categories above.

Choose exactly one priority:
- CRITICAL: urgent, severe, time-sensitive business impact or a serious issue requiring immediate attention.
- HIGH: significant unresolved impact, repeated problems, or a prolonged payment/production issue.
- MEDIUM: normal support issue needing investigation.
- LOW: routine request, informational question, or non-urgent profile update.

Use the ticket text as evidence. Do not invent facts.
Confidence must be between 0 and 1.
Return a short explanation for your classification.`,
        ],
        [
          'human',
          `Subject: ${state.subject}\n\nDescription: ${state.description}`,
        ],
      ]);

      return {
        category: result.category,
        priority: result.priority,
        confidence: result.confidence,
        reasoning: result.reasoning,
      };
    })
    .addEdge(START, 'classify')
    .addEdge('classify', END)
    .compile();

  async classify(subject: string, description: string) {
    return this.graph.invoke({
      subject,
      description,
    });
  }
}
