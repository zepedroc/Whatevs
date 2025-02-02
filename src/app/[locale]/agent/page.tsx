'use client';

import { useEffect, useCallback } from 'react';
import { useChat } from 'ai/react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { RecordingButton } from '@/components/recording-button';
import { ChatMessages } from '@/components/chat-messages';
import { ChatMode } from '@/constants/chatbot-constants';

export default function MicrophoneComponent() {
  const { isRecording, recordingComplete, transcript, toggleRecording, resetTranscript } = useSpeechRecognition();
  const { messages, append, isLoading } = useChat({
    body: { mode: ChatMode.AIAssistant },
  });

  const handleTranscriptSubmission = useCallback(async () => {
    if (recordingComplete && transcript.trim()) {
      try {
        await append({
          role: 'user',
          content: transcript,
        });
      } catch (error) {
        console.error('Failed to submit transcript:', error);
      } finally {
        resetTranscript();
      }
    }
  }, [recordingComplete, transcript, append, resetTranscript]);

  useEffect(() => {
    handleTranscriptSubmission();
  }, [handleTranscriptSubmission]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="bg-gray-100 p-4 flex items-center">
        <div className="flex-1 text-center">
          <span className="text-sm text-gray-600">Voice Assistant</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-4xl">
          <ChatMessages messages={messages} />
          {/* Show current transcript while recording */}
          {isRecording && transcript && (
            <div className="flex items-start gap-4 mb-4">
              <div className="rounded-lg bg-gray-100 px-4 py-2 max-w-[80%]">
                <div className="prose break-words">
                  <p className="mb-0 text-gray-600">{transcript}</p>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="rounded-full w-2 h-2 bg-red-400 animate-pulse" />
                  <span className="text-xs text-gray-500">Recording...</span>
                </div>
              </div>
            </div>
          )}
          {/* Show loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-pulse flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                <div className="h-2 w-2 rounded-full bg-gray-400"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recording Button */}
      <div className="border-t border-gray-200 bg-white px-4 py-4 shadow-lg">
        <div className="mx-auto max-w-4xl flex items-center justify-center">
          <RecordingButton isRecording={isRecording} onClick={toggleRecording} />
        </div>
      </div>
    </div>
  );
}
