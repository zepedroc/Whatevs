'use client';

import { useState } from 'react';
import Image from 'next/image';

import { getImage } from '../../server-actions/images';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LightModeToggle } from '@/components/light-mode-toggle';

const GenerateImage = () => {
  const [input, setInput] = useState('');
  const [currentImage, setCurrentImage] = useState('');

  const handleInputChange = (e: any) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const img = await getImage(input);

    setCurrentImage('data:image/png;base64,' + img);
  };

  return (
    <div>
      <h1>Generate Image:</h1>
      <LightModeToggle />

      <form onSubmit={handleSubmit}>
        <Input type="text" value={input} placeholder="Name something..." onChange={handleInputChange} />
        <Button type="submit">Generate</Button>
      </form>
      {currentImage && <Image src={currentImage} alt="Generated Image" width={200} height={200} />}
    </div>
  );
};

export default GenerateImage;
