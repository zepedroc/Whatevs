'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChatMode } from '@/constants/chatbot-constants';
import { cn } from '@/lib/utils';

type ChatModeOption = {
  value: ChatMode;
  label: string;
  description: string;
};

interface ChatModeSelectorProps {
  mode: string;
}

export function ChatModeSelector({ mode }: ChatModeSelectorProps) {
  const router = useRouter();
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);

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
    {
      value: ChatMode.DeepSeekReasoning,
      label: t('chatModes.deepSeekReasoning.title'),
      description: t('chatModes.deepSeekReasoning.description'),
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[250px] justify-between">
          {mode ? chatModes.find((chatMode) => chatMode.value === mode)?.label : t('Chat.selectMode')}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-2">
        <div className="max-h-[300px] overflow-y-auto space-y-1">
          {chatModes.map((chatMode) => (
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
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
