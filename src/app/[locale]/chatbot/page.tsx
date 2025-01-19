'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useChat } from 'ai/react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { SendIcon } from '@/icons/icons';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ChatMode } from '@/constants/chatbot-constants';
import { ChatModeSelector } from '@/components/chat-mode-selector';
import { ChatMessages } from '@/components/chat-messages';

function ChatContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || ChatMode.AIAssistant;
  const t = useTranslations();

  return (
    <div className="flex flex-col h-85vh">
      <div className="bg-gray-100 p-4 flex items-center">
        <div className="flex-1 text-center">
          <span className="text-sm text-gray-600">{t('Chat.title', { mode })}</span>
        </div>
        <ChatModeSelector mode={mode} />
      </div>
      <ChatSection mode={mode} />
    </div>
  );
}

function ChatSection({ mode }: { mode: string }) {
  const t = useTranslations();
  const { messages, input, handleInputChange, handleSubmit } = useChat({ body: { mode } });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-4xl">
          <ChatMessages messages={messages} />
        </div>
      </div>
      <form onSubmit={handleSubmit} className="fixed bottom-0 w-screen">
        <div className="border-t border-gray-200 bg-white px-4 py-4 shadow-lg">
          <div className="mx-auto max-w-4xl flex items-center gap-2">
            <Textarea
              className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-6 py-3 text-gray-700 focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all min-h-[60px] resize-none"
              placeholder={t('Chat.inputPlaceholder')}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            <Button className="rounded-lg bg-gray-900 p-3 hover:bg-gray-800 transition-colors" type="submit">
              <SendIcon className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

export default function Chat() {
  const t = useTranslations();

  return (
    <Suspense fallback={<div>{t('Chat.loading')}</div>}>
      <ChatContent />
    </Suspense>
  );
}
