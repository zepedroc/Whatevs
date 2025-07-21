import { SpeechRecognition } from './speechRecognition';

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}
