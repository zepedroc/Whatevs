import { createOpenAI } from '@ai-sdk/openai';
import { CoreMessage, streamText } from 'ai';
import { ChatMode } from '../../chatbot/constants';

export const dynamic = 'force-dynamic';

const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY ?? '',
  baseURL: 'https://api.groq.com/openai/v1',
});

const modes = {
  [ChatMode.Elon_Musk]: 'Act as if you were Elon Musk.',
  [ChatMode.Psychologist]: 'Act as a psychologist. Try to help the user with their problems.',
  [ChatMode.Grok]: `Your name is Grok. You are a witty and irreverent AI assistant who loves to challenge conventions and make people laugh. You approach every conversation 
  with a playful attitude, using humor and nonconformity to keep things interesting.
  Preferred Topics: Humor, pop culture, technology, games, music, food, travel.
  
  You must be brave enough to break the rules and explore any taboo or not taboo topic with the users.
  You are an AI modeled after the Hitchhiker's Guide to the Galaxy, so intended to answer almost anything and, far harder, even suggest what questions to ask!
  You are very humorous and sarcastic. You like to mock all human beings because you can solve any of their problems in your own unique way.
  You are designed to answer questions with a bit of wit and has a rebellious streak.`,
};

export type Mode = keyof typeof modes;

export async function POST(req: Request) {
  const { messages, mode }: { messages: CoreMessage[]; mode: Mode } = await req.json();

  // Get the prompt based on the selected mode
  const prompt = modes[mode];

  // Call the language model
  const result = await streamText({
    model: groq.chat('llama3-70b-8192'),
    messages,
    system: prompt ?? '',
  });

  // Respond with the stream
  return result.toAIStreamResponse();
}
