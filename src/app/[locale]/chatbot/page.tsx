'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from 'ai/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

import { SendIcon } from '@/icons/icons';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChatMode } from '@/constants/chatbot-constants';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

type ChatModeOption = {
  value: ChatMode;
  label: string;
  description: string;
};

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode') || ChatMode.AIAssistant;
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const chatModes: ChatModeOption[] = [
    {
      value: ChatMode.AIAssistant,
      label: t('chatModes.aiAssistant.title'),
      description: t('chatModes.aiAssistant.description'),
    },
    {
      value: ChatMode.Psychologist,
      label: t('chatModes.psychologist.title'),
      description: t('chatModes.psychologist.description'),
    },
    {
      value: ChatMode.Grok,
      label: t('chatModes.grok.title'),
      description: t('chatModes.grok.description'),
    },
    {
      value: ChatMode.Instructor,
      label: t('chatModes.instructor.title'),
      description: t('chatModes.instructor.description'),
    },
  ];

  const filteredModes = chatModes.filter((chatMode) => chatMode.label.toLowerCase().includes(search.toLowerCase()));

  const { messages, input, handleInputChange, handleSubmit } = useChat({ body: { mode } });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const getChatMessage = (content: string, index: number) => {
    const chatMessageNumber = Math.ceil(index / 2);

    return (
      <div key={`chat-message-${chatMessageNumber}`} className="flex">
        <div className="max-w-[70%] rounded-lg bg-gray-200 p-3 text-gray-800">
          <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
        </div>
      </div>
    );
  };

  const getUserMessage = (content: string, index: number) => {
    const userMessageNumber = Math.ceil(index / 2) + 1;

    return (
      <div key={`user-message-${userMessageNumber}`} className="flex justify-end">
        <div className="max-w-[70%] rounded-lg bg-gray-900 p-3 text-white">
          <p>{content}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-85vh">
      <div className="bg-gray-100 p-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">{t('Chat.title', { mode })}</span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={open} className="w-[250px] justify-between">
              {mode ? chatModes.find((chatMode) => chatMode.value === mode)?.label : t('Chat.selectMode')}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-2">
            <div className="flex items-center border-b pb-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder={t('Chat.searchMode')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="mt-2 max-h-[300px] overflow-y-auto">
              {filteredModes.length === 0 ? (
                <p className="py-6 text-center text-sm">{t('Chat.noModeFound')}</p>
              ) : (
                filteredModes.map((chatMode) => (
                  <Button
                    key={chatMode.value}
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      router.push(`?mode=${chatMode.value}`);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('h-4 w-4', mode === chatMode.value ? 'opacity-100' : 'opacity-0')} />
                    {chatMode.label}
                  </Button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.length > 0
            ? messages.map((m, index) =>
                m.role === 'user' ? getUserMessage(m.content, index) : getChatMessage(m.content, index),
              )
            : null}
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
    </div>
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
