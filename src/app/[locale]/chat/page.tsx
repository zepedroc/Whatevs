'use client';

import { ClipboardEvent, FormEvent, KeyboardEvent, Suspense, useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

import { DefaultChatTransport } from 'ai';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useChat } from '@ai-sdk/react';

import ChatForm from '@/components/chat-form';
import { ChatMessages } from '@/components/chat-messages';
import { ChatModeSelector } from '@/components/chat-mode-selector';

import { ChatMode } from '@/constants/chatbot-constants';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

function ChatContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || ChatMode.AIAssistant;
  const t = useTranslations();

  return (
    <div className="flex flex-col h-[80vh]">
      <div className="bg-gray-100 p-4 flex items-center">
        <div className="flex-1 text-center">
          <span className="text-sm text-gray-600">{t('Chat.title', { mode })}</span>
        </div>
        <ChatModeSelector mode={mode} />
      </div>
      <ChatSection key={mode} mode={mode} />
    </div>
  );
}

function ChatSection({ mode }: { mode: string }) {
  const t = useTranslations();
  const [input, setInput] = useState('');
  const [useWebSearch, setUseWebSearch] = useState(false);
  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/chat', body: { mode, webSearch: useWebSearch } }),
    [mode, useWebSearch],
  );
  const { messages, sendMessage, setMessages, status } = useChat({
    transport,
    id: `main-chat-${mode}-${useWebSearch ? 'web' : 'noweb'}`,
  });
  const { isRecording, transcript, toggleRecording } = useSpeechRecognition();

  const [files, setFiles] = useState<File[]>([]);
  const [modalImage, setModalImage] = useState<File | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevStatusRef = useRef(status);

  // Update input field with transcript when recording
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript, setInput]);

  // Autofocus textarea when assistant finishes streaming
  useEffect(() => {
    if (prevStatusRef.current === 'streaming' && status !== 'streaming' && textareaRef.current) {
      textareaRef.current.focus();
    }
    prevStatusRef.current = status;
  }, [status]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  /**
   * Handle starting a new chat by clearing all messages and files
   */
  const handleNewChat = () => {
    setMessages([]);
    setFiles([]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  /**
   * Handle the pasting of files from the clipboard
   * @param event - The clipboard event
   */
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

  /**
   * Handle the addition of files from the file picker
   * @param newFiles - The files to add
   */
  const handleAddFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => file.type.startsWith('image/'));
    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
    } else {
      toast.error('Only image files are allowed');
    }
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

    if (input.trim()) {
      if (files.length > 0) {
        // Handle file attachments with the new v5 API
        sendMessage({
          text: input.trim(),
          files: filesToFileList(files),
        });
      } else {
        sendMessage({ text: input.trim() });
      }
      setInput('');
      setFiles([]);
    }
  };

  // Helper to convert File[] to FileList
  function filesToFileList(files: File[]): FileList {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    return dataTransfer.files;
  }

  const showLoading = status === 'submitted';

  return (
    <>
      <div className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-4xl">
          <ChatMessages messages={messages} />
          {showLoading && (
            <div className="flex mt-4">
              <div className="max-w-[70%] rounded-lg flex flex-row items-center gap-2">
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-900">{t('Chat.thinking')}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <ChatForm
        input={input}
        onInputChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onSubmit={handleSubmit}
        files={files}
        onRemoveFile={handleRemoveFile}
        onImageClick={handleImageClick}
        isRecording={isRecording}
        toggleRecording={toggleRecording}
        status={status}
        t={t}
        textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
        onAddFiles={handleAddFiles}
        onNewChat={handleNewChat}
        useWebSearch={useWebSearch}
        onToggleWebSearch={() => setUseWebSearch((prev) => !prev)}
      />
      {/* Image Modal */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <Image
              src={URL.createObjectURL(modalImage)}
              alt={modalImage.name}
              className="object-contain rounded shadow-lg"
              width={1000}
              height={1000}
              style={{ width: 'auto', height: 'auto', maxWidth: '90vw', maxHeight: '90vh' }}
              onClick={(e) => e.stopPropagation()}
            />
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
