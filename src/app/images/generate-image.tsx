'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Aperture } from 'lucide-react';

import { getImage } from '../../server-actions/images';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

    setIsLoading(false);

    setCurrentImage('data:image/png;base64,' + img);
  };

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4 mt-8">Generate Image</h1>

      <form onSubmit={handleSubmit} className="flex items-center mb-4">
        <Input type="text" value={input} placeholder="Name something..." onChange={handleInputChange} className="mr-2" />
        <Button type="submit">Generate</Button>
      </form>
      {isLoading && (
        <div className="animate-loading">
          <Aperture className="m-7 h-8 w-8" />
        </div>
      )}
      {currentImage && !isLoading && (
        <Image src={currentImage} alt="Generated Image" width={400} height={400} className="rounded-lg" />
      )}
    </div>
  );
};

export default GenerateImage;
