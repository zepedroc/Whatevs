'use client';

import { useState } from 'react';

import Image from 'next/image';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { ImageIcon } from '@/icons/icons';

async function getImage(prompt: string) {
  const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_INFERENCE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({ inputs: prompt }),
  });

  const result = await response.blob();
  return result;
}

export default function ImagesPage() {
  const t = useTranslations('Images');
  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setImages([]); // Clear old images

    // Generate 2 images concurrently
    const imagePromises = [getImage(input), getImage(input)];
    const imageBlobs = await Promise.all(imagePromises);

    // Convert blobs to base64
    const base64Promises = imageBlobs.map((blob) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(blob);
      });
    });

    const base64Images = await Promise.all(base64Promises);
    setImages(base64Images);
    setIsLoading(false);
  };

  return (
    <main className="flex flex-col items-center justify-center px-4 md:px-6 py-12 md:py-24">
      <div className="max-w-3xl text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">{t('title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl">{t('description')}</p>
        <div className="flex items-center justify-center w-full space-x-2">
          <form onSubmit={handleSubmit} className="flex w-full space-x-2">
            <Input
              className="flex-1"
              placeholder={t('inputPlaceholder')}
              type="text"
              onChange={handleInputChange}
              value={input}
            />
            <Button size="default" type="submit" className="cursor-pointer">
              {t('generateButton')}
            </Button>
          </form>
        </div>
      </div>
      <div className="mt-12 w-full max-w-4xl">
        <div className="grid gap-6 md:grid-cols-2">
          {isLoading && (
            <>
              <div className="bg-white dark:bg-gray-950 rounded-lg overflow-hidden shadow-lg">
                <div className="aspect-4/3 bg-gray-100 dark:bg-gray-800 animate-pulse">
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
              </div>
              <div className="bg-white dark:bg-gray-950 rounded-lg overflow-hidden shadow-lg">
                <div className="aspect-4/3 bg-gray-100 dark:bg-gray-800 animate-pulse">
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
              </div>
            </>
          )}
          {images.map((image, index) => (
            <div key={index} className="bg-white dark:bg-gray-950 rounded-lg overflow-hidden shadow-lg">
              <Image
                src={image}
                alt={`${t('generatedImageAlt')} ${index + 1}`}
                height={400}
                width={400}
                className="w-full h-auto"
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
