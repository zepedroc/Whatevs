'use client';

import { JSX, SVGProps } from 'react';
import { useChat } from 'ai/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
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

function SendIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}
