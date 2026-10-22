import { Injectable } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

@Injectable()
export class AiService {
  async generateDraftResponse(
    subject: string,
    description: string,
    knowledgeBase: string,
  ): Promise<string> {
    const model = new ChatGoogleGenerativeAI({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      temperature: 0.2,
      maxRetries: 2,
      apiKey: process.env.GEMINI_API_KEY || "AQ.Ab8RN6LvradRG26BpCA_PE8olneIwV-umzmQZQL8EYpsP0rVzQ",
    });

    const response = await model.invoke([
      [
        'system',
        `You are a support assistant for BookLeaf Publishing.
Create a professional, empathetic draft response to the author's support query.

Use only the supplied BookLeaf Knowledge Base for company policies.
Do not invent payment schedules, royalty amounts, timelines, or commitments.
If the knowledge base does not answer the question, acknowledge the issue
and say the support team needs to verify the details.
Return only the proposed response. Do not claim that any action has already
been taken. The response is a draft for an admin to review.`,
      ],
      [
        'human',
        `BOOKLEAF KNOWLEDGE BASE:
${knowledgeBase}

AUTHOR'S SUBJECT:
${subject}

AUTHOR'S QUERY:
${description}

Write a suitable draft response.`,
      ],
    ]);

    if (typeof response.content === 'string') {
      return response.content;
    }

    return response.content
      .map((part) => {
        if ('text' in part && typeof part.text === 'string') {
          return part.text;
        }
        return '';
      })
      .join('\n')
      .trim();
  }
}
