import { useState, useRef, useEffect } from 'react';

// Declare the global interface for TypeScript
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
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

  const recognitionRef = useRef<any>(null);

  const startRecording = () => {
    setState((prev) => ({ ...prev, isRecording: true, recordingComplete: false }));
    recognitionRef.current = new window.webkitSpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event: any) => {
      const { transcript } = event.results[event.results.length - 1][0];
      setState((prev) => ({ ...prev, transcript }));
    };

    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setState((prev) => ({ ...prev, isRecording: false, recordingComplete: true }));
    }
  };

  const toggleRecording = () => {
    if (!state.isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

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
  };
}
