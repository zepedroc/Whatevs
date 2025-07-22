'use client';

import { ClipboardEvent, FormEvent, KeyboardEvent, Suspense, useEffect, useState } from 'react';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useChat } from '@ai-sdk/react';

import { ChatMessages } from '@/components/chat-messages';
import { ChatModeSelector } from '@/components/chat-mode-selector';
import FilePreview from '@/components/file-preview';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { ChatMode } from '@/constants/chatbot-constants';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { SendIcon } from '@/icons/icons';

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
  const { messages, input, handleInputChange, handleSubmit: chatHandleSubmit, setInput } = useChat({ body: { mode } });
  const { isRecording, transcript, toggleRecording } = useSpeechRecognition();

  const [files, setFiles] = useState<File[]>([]);
  const [modalImage, setModalImage] = useState<File | null>(null);

  // Update input field with transcript when recording
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript, setInput]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handlePaste = (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;

    if (items) {
      const pastedFiles = Array.from(items)
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null);

      if (pastedFiles.length > 0) {
        const validFiles = pastedFiles.filter((file) => file.type.startsWith('image/') || file.type.startsWith('text/'));

        if (validFiles.length === pastedFiles.length) {
          setFiles((prev) => [...prev, ...validFiles]);
        } else {
          toast.error('Only image and text files are allowed');
        }
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageClick = (file: File) => {
    setModalImage(file);
  };

  // Wrap the submit handler to stop recording if active
  const handleSubmit = (e: FormEvent<HTMLFormElement> | KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    if (isRecording) {
      toggleRecording();
    }

    const options = files.length > 0 ? { experimental_attachments: filesToFileList(files) } : {};

    chatHandleSubmit(e, options);
    setFiles([]);
  };

  // Helper to convert File[] to FileList
  function filesToFileList(files: File[]): FileList {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    return dataTransfer.files;
  }

  return (
    <>
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-4xl">
          <ChatMessages messages={messages} />
        </div>
      </div>
      <form onSubmit={handleSubmit} className="fixed bottom-0 w-screen">
        <div className="border-t border-gray-200 bg-white px-4 py-4 shadow-lg">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 min-h-[60px]">
              <FilePreview files={files} onRemove={handleRemoveFile} onImageClick={handleImageClick} />
              <div className="flex items-end">
                <Textarea
                  className="flex-1 border-none bg-transparent p-0 shadow-none resize-none min-h-[32px] outline-none focus-visible:ring-0 focus-visible:border-none focus-visible:ring-offset-0 focus:ring-offset-0"
                  placeholder={t('Chat.inputPlaceholder')}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  rows={1}
                />
                <div className="flex gap-2 ml-2 pb-1">
                  <Button
                    type="button"
                    onClick={toggleRecording}
                    className={`rounded-lg p-3 transition-colors ${
                      isRecording ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    title={isRecording ? t('Chat.stopRecording') : t('Chat.startRecording')}
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
                  <Button className="rounded-lg bg-gray-900 p-3 hover:bg-gray-800 transition-colors" type="submit">
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
      {/* Image Modal */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={URL.createObjectURL(modalImage)}
              alt={modalImage.name}
              className="object-contain max-w-[90vw] max-h-[90vh] rounded shadow-lg"
            />
            <button
              className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-2 text-black hover:bg-opacity-100"
              onClick={() => setModalImage(null)}
              aria-label="Close image preview"
            >
              ×
            </button>
          </div>
        </div>
      )}
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
