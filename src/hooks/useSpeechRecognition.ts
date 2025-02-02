import { useState, useRef, useEffect, useCallback } from 'react';

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionState {
  isRecording: boolean;
  recordingComplete: boolean;
  transcript: string;
}

export function useSpeechRecognition() {
  const [state, setState] = useState<SpeechRecognitionState>({
    isRecording: false,
    recordingComplete: false,
    transcript: '',
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startRecording = () => {
    setState((prev) => ({ ...prev, isRecording: true, recordingComplete: false, transcript: '' }));

    try {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.results[event.results.length - 1];
        const { transcript } = current[0];
        setState((prev) => ({ ...prev, transcript }));
      };

      recognitionRef.current.onend = () => {
        setState((prev) => ({
          ...prev,
          isRecording: false,
          recordingComplete: true,
        }));
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setState((prev) => ({
          ...prev,
          isRecording: false,
          recordingComplete: true,
        }));
      };

      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setState((prev) => ({
        ...prev,
        isRecording: false,
        recordingComplete: false,
      }));
    }
  };

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const toggleRecording = () => {
    if (!state.isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const resetTranscript = useCallback(() => {
    setState((prev) => ({ ...prev, transcript: '', recordingComplete: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    ...state,
    toggleRecording,
    resetTranscript,
  };
}
