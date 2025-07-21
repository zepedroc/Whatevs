interface RecordingStatusProps {
  isRecording: boolean;
  recordingComplete: boolean;
  transcript: string;
}

export function RecordingStatus({ isRecording, recordingComplete, transcript }: RecordingStatusProps) {
  return (
    <div className="w-1/4 m-auto rounded-md border p-4 bg-white">
      <div className="flex-1 flex w-full justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium leading-none">{recordingComplete ? 'Recorded' : 'Recording'}</p>
          <p className="text-sm text-muted-foreground">{recordingComplete ? 'Thanks for talking.' : 'Start speaking...'}</p>
        </div>
        {isRecording && <div className="rounded-full w-4 h-4 bg-red-400 animate-pulse" />}
      </div>

      {transcript && (
        <div className="border rounded-md p-2 h-fullm mt-4">
          <p className="mb-0">{transcript}</p>
        </div>
      )}
    </div>
  );
}
