
import "dotenv/config";
import { draftTicketResponse } from "./graphs/response-drafting.graph.js";

async function main() {
  const draft = await draftTicketResponse({
    subject: "Royalty payment not received",
    description:
      "My royalty payment has not arrived. Can you explain the payment schedule and what I should check?",
    category: "ROYALTY_PAYMENTS",
  });

  console.log("\nGenerated author response:\n");
  console.log(draft);
}

main().catch((error) => {
  console.error("Draft generation failed:", error);
  process.exitCode = 1;
});
