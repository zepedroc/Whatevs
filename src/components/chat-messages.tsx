'use client';

import { useEffect, useRef } from 'react';

import Image from 'next/image';

import { Attachment, Message } from 'ai';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ChatMessagesProps {
  messages: Message[];
  containerClassName?: string;
}

export function ChatMessages({ messages, containerClassName = 'space-y-4' }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) return null;

  const formatMessage = (content: string) => {
    // Check if it's a location finder response (contains "New location:" and JSON)
    if (content.includes('New location:')) {
      const lines = content.split('\n');
      // Return only the first line (the user-friendly message)
      return lines[0];
    }
    return content;
  };

  return (
    <div className={containerClassName}>
      {messages.map((m, index) =>
        m.role === 'user' ? (
          <UserMessage
            key={`user-message-${index}`}
            content={m.content}
            index={index}
            attachments={m.experimental_attachments}
          />
        ) : (
          <AssistantMessage key={`chat-message-${index}`} content={formatMessage(m.content)} index={index} />
        ),
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

interface MessageProps {
  content: string;
  index: number;
  attachments?: Attachment[];
}

export function UserMessage({ content, index, attachments }: MessageProps) {
  const messageNumber = Math.ceil(index / 2) + 1;

  return (
    <div key={`user-message-${messageNumber}`} className="flex justify-end">
      <div className="max-w-[70%] flex flex-col items-end">
        {attachments?.length ? (
          <div className="flex flex-row gap-2 mb-2">
            {attachments.map((attachment) =>
              attachment.contentType?.startsWith('image') ? (
                <Image
                  className="rounded-md w-40"
                  key={attachment.name}
                  src={attachment.url || ''}
                  alt={attachment.name || ''}
                  width={100}
                  height={100}
                />
              ) : null,
            )}
          </div>
        ) : null}
        <div className="rounded-lg bg-gray-900 p-3 text-white w-full">
          <p>{content}</p>
        </div>
      </div>
    </div>
  );
}

export function AssistantMessage({ content, index }: MessageProps) {
  const messageNumber = Math.ceil(index / 2);
  const hasReasoning = content.includes('<think>');
  const isStreaming = content.includes('<think>') && !content.includes('</think>');

  if (!hasReasoning) {
    return (
      <div key={`chat-message-${messageNumber}`} className="flex">
        <div className="max-w-[70%] rounded-lg bg-gray-200 p-3 text-gray-800">
          <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
        </div>
      </div>
    );
  }

  // For streaming responses, show only the content before <think>
  if (isStreaming) {
    const beforeThink = content.split('<think>')[0];

    return (
      <div key={`chat-message-${messageNumber}`} className="flex">
        <div className="max-w-[70%] rounded-lg bg-gray-200 p-3 text-gray-800">
          <Markdown remarkPlugins={[remarkGfm]}>{beforeThink}</Markdown>

          <Accordion type="single" collapsible className="mt-2">
            <AccordionItem value="reasoning" className="border-gray-300">
              <AccordionTrigger className="text-sm text-gray-600 hover:text-gray-900" disabled>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                  Thinking...
                </div>
              </AccordionTrigger>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    );
  }

  // For completed responses, show all parts with expandable reasoning
  const beforeThink = content.split('<think>')[0];
  const thinkContent = content.split('<think>')[1]?.split('</think>')[0];
  const afterThink = content.split('</think>')[1];

  return (
    <div key={`chat-message-${messageNumber}`} className="flex">
      <div className="max-w-[70%] rounded-lg bg-gray-200 p-3 text-gray-800">
        {beforeThink && <Markdown remarkPlugins={[remarkGfm]}>{beforeThink}</Markdown>}

        <Accordion type="single" collapsible className="mt-2">
          <AccordionItem value="reasoning" className="border-gray-300">
            <AccordionTrigger className="text-sm text-gray-600 hover:text-gray-900">View Reasoning Steps</AccordionTrigger>
            <AccordionContent>
              <div className="bg-gray-100 rounded p-2 text-sm">
                <Markdown remarkPlugins={[remarkGfm]}>{thinkContent}</Markdown>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {afterThink && (
          <div className="mt-2">
            <Markdown remarkPlugins={[remarkGfm]}>{afterThink}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
