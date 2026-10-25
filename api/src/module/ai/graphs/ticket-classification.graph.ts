
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  Annotation,
  END,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { z } from "zod";
import { TICKET_CLASSIFICATION_PROMPT } from "../prompts/ticket-classification.prompt.js";


const classificationSchema = z.object({
  category: z.enum([
    "ROYALTY_PAYMENTS",
    "ISBN_METADATA",
    "PRINTING_QUALITY",
    "DISTRIBUTION_AVAILABILITY",
    "BOOK_STATUS_PRODUCTION",
    "GENERAL_INQUIRY",
  ]),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export type TicketClassification = z.infer<
  typeof classificationSchema
>;

const ClassificationState = Annotation.Root({
  subject: Annotation<string>,
  description: Annotation<string>,
  result: Annotation<TicketClassification | null>,
});

export type ClassificationInput = {
  subject: string;
  description: string;
};

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
  temperature: 0,
});

const structuredModel = model.withStructuredOutput(
  classificationSchema,
);

async function classifyNode(
  state: typeof ClassificationState.State,
) {

    console.log("[Graph 1] Classification node started");

  console.log("[Graph 2] Calling Gemini structured output...");

  const result = await structuredModel.invoke([
    {
      role: "system",
      content: TICKET_CLASSIFICATION_PROMPT,
    },
    {
      role: "user",
      content: JSON.stringify({
        subject: state.subject,
        description: state.description,
      }),
    },
  ]);

   console.log("[Graph 3] Gemini returned a response");
  console.dir(result, { depth: null });

  return { result };
}

const graph = new StateGraph(ClassificationState)
  .addNode("classify", classifyNode)
  .addEdge(START, "classify")
  .addEdge("classify", END)
  .compile();

export async function classifyTicket(
  input: ClassificationInput,
): Promise<TicketClassification> {
  const state = await graph.invoke({
    subject: input.subject,
    description: input.description,
    result: null,
  });

  if (!state.result) {
    throw new Error("Ticket classification returned no result");
  }

  return state.result;
}
