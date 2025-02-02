'use client';

import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { RecordingStatus } from '@/components/recording-status';
import { RecordingButton } from '@/components/recording-button';

export default function MicrophoneComponent() {
  const { isRecording, recordingComplete, transcript, toggleRecording } = useSpeechRecognition();

  return (
    <div className="flex items-center justify-center h-screen w-full">
      <div className="w-full">
        {(isRecording || transcript) && (
          <RecordingStatus isRecording={isRecording} recordingComplete={recordingComplete} transcript={transcript} />
        )}

        <div className="flex items-center w-full">
          <RecordingButton isRecording={isRecording} onClick={toggleRecording} />
        </div>
      </div>
    </div>
  );
}
