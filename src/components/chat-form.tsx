import { ClipboardEvent, FormEvent, KeyboardEvent } from 'react';
import { useRef } from 'react';

import { SendIcon } from '@/icons/icons';

import FilePreview from './file-preview';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface ChatFormProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onPaste: (e: ClipboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement> | KeyboardEvent<HTMLTextAreaElement>) => void;
  files: File[];
  onRemoveFile: (index: number) => void;
  onImageClick: (file: File) => void;
  isRecording: boolean;
  toggleRecording: () => void;
  status: string;
  t: (key: string) => string;
}

export default function ChatForm({
  input,
  onInputChange,
  onKeyDown,
  onPaste,
  onSubmit,
  files,
  onRemoveFile,
  onImageClick,
  isRecording,
  toggleRecording,
  status,
  t,
  textareaRef: externalTextareaRef,
}: ChatFormProps & { textareaRef?: React.RefObject<HTMLTextAreaElement> }) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalTextareaRef || internalRef;

  const focusTextarea = (e: React.MouseEvent<HTMLDivElement>) => {
    if (textareaRef.current && e.target instanceof HTMLElement && !e.target.closest('button')) {
      textareaRef.current.focus();
    }
  };

  return (
    <form onSubmit={onSubmit} className="fixed bottom-0 w-screen">
      <div className="border-t border-gray-200 bg-white px-4 py-4 shadow-lg">
        <div className="mx-auto max-w-4xl cursor-text" onClick={focusTextarea}>
          <div className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 min-h-[60px]">
            <FilePreview files={files} onRemove={onRemoveFile} onImageClick={onImageClick} />
            <div className="flex items-end">
              <Textarea
                ref={textareaRef}
                className="flex-1 border-none bg-transparent p-0 shadow-none resize-none min-h-[32px] outline-none focus-visible:ring-0 focus-visible:border-none focus-visible:ring-offset-0 focus:ring-offset-0 cursor-text"
                placeholder={t('Chat.inputPlaceholder')}
                value={input}
                onChange={onInputChange}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
                rows={1}
                disabled={status === 'submitted' || status === 'streaming'}
              />
              <div className="flex gap-2 ml-2 pb-1">
                <Button
                  type="button"
                  onClick={toggleRecording}
                  className={`rounded-lg p-3 transition-colors ${
                    isRecording ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                  title={isRecording ? t('Chat.stopRecording') : t('Chat.startRecording')}
                  disabled={status === 'submitted' || status === 'streaming'}
                >
                  {isRecording ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                      <path
                        fill="currentColor"
                        d="M128 176a48.05 48.05 0 0 0 48-48V64a48 48 0 0 0-96 0v64a48.05 48.05 0 0 0 48 48ZM96 64a32 32 0 0 1 64 0v64a32 32 0 0 1-64 0Zm40 143.6V232a8 8 0 0 1-16 0v-24.4A80.11 80.11 0 0 1 48 128a8 8 0 0 1 16 0a64 64 0 0 0 128 0a8 8 0 0 1 16 0a80.11 80.11 0 0 1-72 79.6Z"
                      />
                    </svg>
                  )}
                </Button>
                <Button
                  className="rounded-lg bg-gray-900 p-3 hover:bg-gray-800 transition-colors"
                  type="submit"
                  disabled={status === 'submitted' || status === 'streaming' || input.length === 0}
                >
                  <SendIcon className="h-5 w-5 text-white" />
                </Button>
              </div>
            </div>
          </div>
          {/* Recording indicator */}
          {isRecording && (
            <div className="mt-2 flex items-center gap-2">
              <div className="rounded-full w-2 h-2 bg-red-400 animate-pulse" />
              <span className="text-xs text-gray-500">{t('Chat.recording')}</span>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
