
import "dotenv/config";
import { classifyTicket } from "./graphs/ticket-classification.graph.js";

async function main() {
  console.log("[1] Test script started");

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  console.log("[2] Gemini API key loaded");
  console.log("[3] Model:", process.env.GEMINI_MODEL);
  console.log("[4] Starting classification...");

  const timeout = setTimeout(() => {
    console.error(
      "[TIMEOUT] Classification did not finish within 30 seconds.",
    );
    process.exit(1);
  }, 30_000);

  try {
    const result = await classifyTicket({
      subject: "Royalty payment missing for six months",
      description:
        "My book is published, but I have not received royalties for six months. Please investigate.",
    });

    console.log("[5] Classification completed");
    console.dir(result, { depth: null });
  } finally {
    clearTimeout(timeout);
  }
}

main().catch((error: unknown) => {
  console.error("[TEST FAILED]", error);
  process.exitCode = 1;
});
