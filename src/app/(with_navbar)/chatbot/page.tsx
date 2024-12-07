'use client';

import { Suspense } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from 'ai/react';
import { useSearchParams } from 'next/navigation';

import { SendIcon } from '../../icons/icons';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function ChatContent() {
  const searchParams = useSearchParams();
  const { messages, input, handleInputChange, handleSubmit } = useChat({ body: { mode: searchParams.get('mode') } });

  const getChatMessage = (content: string) => {
    return (
      <div className="flex">
        <div className="max-w-[70%] rounded-lg bg-gray-200 p-3 text-gray-800">
          <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
        </div>
      </div>
    );
  };

  const getUserMessage = (content: string) => {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] rounded-lg bg-gray-900 p-3 text-white">
          <p>{content}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-85vh">
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {messages.length > 0
            ? messages.map((m) => <>{m.role === 'user' ? getUserMessage(m.content) : getChatMessage(m.content)}</>)
            : null}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="fixed bottom-0 w-screen">
        <div className="flex items-center justify-between bg-gray-200 px-4 py-3">
          <Input
            className="flex-1 rounded-md border-none bg-transparent px-4 py-2 focus:outline-none"
            placeholder="Type your message..."
            type="text"
            value={input}
            onChange={handleInputChange}
          />
          <Button className="ml-4" type="submit">
            <SendIcon className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function Chat() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}
