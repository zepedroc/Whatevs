import { UIMessage, convertToModelMessages, streamText } from 'ai';

import { createOpenAI } from '@ai-sdk/openai';

import { ChatMode, modes } from '@/constants/chatbot-constants';

export const dynamic = 'force-dynamic';

const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY ?? '',
  baseURL: 'https://api.groq.com/openai/v1',
});

export type Mode = keyof typeof modes;

export async function POST(req: Request) {
  const { messages, mode }: { messages: UIMessage[]; mode: Mode } = await req.json();

  // Get the prompt based on the selected mode
  const prompt = modes[mode];

  // Select the appropriate model based on mode
  const model =
    mode === ChatMode.DeepSeekReasoning
      ? groq.chat('deepseek-r1-distill-llama-70b')
      : groq.chat('meta-llama/llama-4-maverick-17b-128e-instruct');

  // Call the language model
  const result = streamText({
    model,
    messages: convertToModelMessages(messages),
    system: prompt ?? '',
  });

  // Respond with the stream
  return result.toUIMessageStreamResponse();
}
