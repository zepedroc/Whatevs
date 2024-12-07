'use client';

import { useState } from 'react';
import Image from 'next/image';

import { ImageIcon } from '../../icons/icons';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

async function getImage(prompt: string) {
  const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
    headers: {
      Authorization: 'Bearer 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',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({ inputs: prompt }),
  });

  const result = await response.blob();
  return result;
}

const GenerateImage = () => {
  const [input, setInput] = useState('');
  const [currentImage, setCurrentImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: any) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);

    const img = await getImage(input);

    // Convert blob to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setCurrentImage(base64String);
      setIsLoading(false);
    };
    reader.readAsDataURL(img);
  };

  return (
    <main className="flex flex-col items-center justify-center px-4 md:px-6 py-12 md:py-24">
      <div className="max-w-3xl text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Generate AI-Created Images</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl">
          Unleash your creativity with our AI image generation tool. Enter a prompt below to get started.
        </p>
        <div className="flex items-center justify-center w-full space-x-2">
          <form onSubmit={handleSubmit} className="flex w-full space-x-2">
            <Input className="flex-1" placeholder="Enter a prompt" type="text" onChange={handleInputChange} value={input} />
            <Button size="default" type="submit">
              Generate Image
            </Button>
          </form>
        </div>
      </div>
      <div className="mt-12 w-full max-w-2xl">
        <div className="grid gap-6">
          <div className="bg-white dark:bg-gray-950 rounded-lg overflow-hidden shadow-lg">
            {isLoading && (
              <>
                <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 animate-pulse">
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-12 h-12 text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
                      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
                    </div>
                    <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
                  </div>
                </div>
              </>
            )}
            {currentImage && !isLoading && <Image src={currentImage} alt="Generated Image" height={400} width={800} />}
          </div>
        </div>
      </div>
    </main>
  );
};

export default GenerateImage;
