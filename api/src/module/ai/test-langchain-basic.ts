import 'dotenv/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

async function main() {
  console.log('[1] Creating LangChain model...');

  const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-3.5-flash-lite',
    maxRetries: 0,
  });

  console.log('[2] Sending plain-text request...');

  const response = await model.invoke(
    'Reply with exactly: LangChain Gemini works',
  );

  console.log('[3] Response received:');
  console.log(response.content);
}

main().catch((error) => {
  console.error('[FAILED]', error);
  process.exitCode = 1;
});
