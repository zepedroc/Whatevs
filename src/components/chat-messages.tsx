import { useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from 'ai';

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

  return (
    <div className={containerClassName}>
      {messages.map((m, index) =>
        m.role === 'user' ? (
          <UserMessage key={`user-message-${index}`} content={m.content} index={index} />
        ) : (
          <AssistantMessage key={`chat-message-${index}`} content={m.content} index={index} />
        ),
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

interface MessageProps {
  content: string;
  index: number;
}

export function UserMessage({ content, index }: MessageProps) {
  const messageNumber = Math.ceil(index / 2) + 1;

  return (
    <div key={`user-message-${messageNumber}`} className="flex justify-end">
      <div className="max-w-[70%] rounded-lg bg-gray-900 p-3 text-white">
        <p>{content}</p>
      </div>
    </div>
  );
}

export function AssistantMessage({ content, index }: MessageProps) {
  const messageNumber = Math.ceil(index / 2);

  return (
    <div key={`chat-message-${messageNumber}`} className="flex">
      <div className="max-w-[70%] rounded-lg bg-gray-200 p-3 text-gray-800">
        <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
      </div>
    </div>
  );
}
