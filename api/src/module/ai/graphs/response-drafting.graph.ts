
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  Annotation,
  END,
  START,
  StateGraph,
} from "@langchain/langgraph";

import { getBookLeafContext } from "../prompts/bookleaf-knowledge-base.js";
import { RESPONSE_DRAFTING_PROMPT } from "../prompts/response-drafting.prompt.js";

const ResponseDraftingState = Annotation.Root({
  subject: Annotation<string>,
  description: Annotation<string>,
  category: Annotation<string>,
  knowledgeBase: Annotation<string>,
  draftResponse: Annotation<string | null>,
});

export type ResponseDraftingInput = {
  subject: string;
  description: string;
  category: string;
};

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  maxRetries: 1,
});

async function draftResponseNode(
  state: typeof ResponseDraftingState.State,
) {
  const knowledgeBase = getBookLeafContext(state.category);

  const prompt = RESPONSE_DRAFTING_PROMPT
    .replace("{{KNOWLEDGE_BASE}}", knowledgeBase)
    .replace("{{SUBJECT}}", state.subject)
    .replace("{{DESCRIPTION}}", state.description);

  const response = await model.invoke(prompt);

  const draftResponse =
    typeof response.content === "string"
      ? response.content.trim()
      : response.content
          .map((part) =>
            part.type === "text" ? part.text : "",
          )
          .join("")
          .trim();

  if (!draftResponse) {
    throw new Error("Gemini returned an empty draft response");
  }

  return {
    knowledgeBase,
    draftResponse,
  };
}

const graph = new StateGraph(ResponseDraftingState)
  .addNode("generateDraft", draftResponseNode)
  .addEdge(START, "generateDraft")
  .addEdge("generateDraft", END)
  .compile();

export async function draftTicketResponse(
  input: ResponseDraftingInput,
): Promise<string> {
  const result = await graph.invoke({
    subject: input.subject,
    description: input.description,
    category: input.category,
    knowledgeBase: "",
    draftResponse: null,
  });

  if (!result.draftResponse) {
    throw new Error("Response drafting returned no result");
  }

  return result.draftResponse;
}
