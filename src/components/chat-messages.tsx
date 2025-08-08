'use client';

import { useEffect, useRef } from 'react';

import Image from 'next/image';

import { UIMessage } from 'ai';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { markdownComponents } from '@/lib/markdown-components';

interface ChatMessagesProps {
  messages: UIMessage[];
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
      {messages.map((m, index) => {
        return m.role === 'user' ? (
          <UserMessage
            key={`user-message-${index}`}
            content={m.parts.find((part) => part.type === 'text')?.text || ''}
            index={index}
            attachments={m.parts
              .filter((part) => part.type === 'file')
              .map((part: FilePart) => ({
                name: part.filename,
                url: part.url,
                contentType: part.mediaType || part.mimeType || part.contentType,
              }))}
          />
        ) : (
          <AssistantMessage
            key={`chat-message-${index}`}
            content={formatMessage(m.parts.find((part) => part.type === 'text')?.text || '')}
            index={index}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

interface FilePart {
  type: 'file';
  filename?: string;
  url?: string;
  mediaType?: string;
  mimeType?: string;
  contentType?: string;
}

interface FileAttachment {
  name?: string;
  url?: string;
  contentType?: string;
}

interface MessageProps {
  content: string;
  index: number;
  attachments?: FileAttachment[];
}

function UserMessage({ content, index, attachments }: MessageProps) {
  const messageNumber = Math.ceil(index / 2) + 1;

  // Validate URL to prevent XSS attacks
  const isValidImageUrl = (url: string): boolean => {
    if (typeof url !== 'string' || url.length === 0) return false;
    // Allow expected safe schemes for attachments and previews
    return url.startsWith('https://') || url.startsWith('http://') || url.startsWith('blob:') || url.startsWith('data:');
  };

  return (
    <div key={`user-message-${messageNumber}`} className="flex justify-end">
      <div className="max-w-[70%] flex flex-col items-end">
        {attachments?.length ? (
          <div className="flex flex-row gap-2 mb-2">
            {attachments.map((attachment, attachmentIndex) =>
              attachment.contentType?.startsWith('image') && attachment.url && isValidImageUrl(attachment.url) ? (
                <Image
                  className="rounded-md w-40"
                  key={attachment.name || attachmentIndex}
                  src={attachment.url}
                  alt={attachment.name || ''}
                  width={100}
                  height={100}
                />
              ) : null,
            )}
          </div>
        ) : null}
        <div className="rounded-lg bg-gray-100 p-3 text-gray-800 w-full text-sm">
          <p>{content}</p>
        </div>
      </div>
    </div>
  );
}

function AssistantMessage({ content, index }: MessageProps) {
  const messageNumber = Math.ceil(index / 2);
  const hasReasoning = content.includes('<think>');
  const isStreaming = content.includes('<think>') && !content.includes('</think>');

  if (!hasReasoning) {
    return (
      <div key={`chat-message-${messageNumber}`} className="flex">
        <div className="max-w-[70%] rounded-lg p-3 text-gray-900 text-sm">
          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {content}
          </Markdown>
        </div>
      </div>
    );
  }

  // For streaming responses, show only the content before <think>
  if (isStreaming) {
    const beforeThink = content.split('<think>')[0];

    return (
      <div key={`chat-message-${messageNumber}`} className="flex">
        <div className="max-w-[70%] rounded-lg p-3 text-gray-900 text-sm">
          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {beforeThink}
          </Markdown>

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
      <div className="max-w-[70%] rounded-lg p-3 text-gray-900 text-sm">
        {beforeThink && (
          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {beforeThink}
          </Markdown>
        )}

        <Accordion type="single" collapsible className="mt-2">
          <AccordionItem value="reasoning" className="border-gray-300">
            <AccordionTrigger className="text-sm text-gray-600 hover:text-gray-900">View Reasoning Steps</AccordionTrigger>
            <AccordionContent>
              <div className="bg-gray-100 rounded p-2 text-sm">
                <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {thinkContent}
                </Markdown>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {afterThink && (
          <div className="mt-2">
            <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {afterThink}
            </Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
