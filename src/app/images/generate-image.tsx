'use client';

import { useState } from 'react';
import Image from 'next/image';

import { getImage } from '../../server-actions/images';

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

      <form onSubmit={handleSubmit}>
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Name something..."
          onChange={handleInputChange}
        />
      </form>
      {currentImage && <Image src={currentImage} alt="Generated Image" width={200} height={200} />}
    </div>
  );
};

export default GenerateImage;
