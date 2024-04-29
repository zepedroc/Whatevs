'use server';

export async function getImage(prompt: string) {
  const image = await fetch(`https://image.pollinations.ai/prompt/${prompt}`);
  const buffer = await image.arrayBuffer();

  const img = globalThis.Buffer.from(buffer).toString('base64');

  return img;
}
