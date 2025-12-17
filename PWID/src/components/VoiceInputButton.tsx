import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceInputButtonProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscription, disabled }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Check for Web Speech API support
  const SpeechRecognition = 
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const isSupported = !!SpeechRecognition;

  const startListening = useCallback(() => {
    if (!isSupported) {
      toast({
        title: 'Voice input not supported',
        description: 'Your browser does not support voice input. Please use manual entry.',
        variant: 'destructive',
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      setIsProcessing(true);
      const transcript = event.results[0][0].transcript;
      onTranscription(transcript);
      setIsProcessing(false);
      setIsListening(false);
      
      toast({
        title: 'Voice captured',
        description: 'Transcription complete. You can edit the text if needed.',
      });
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setIsProcessing(false);
      
      let message = 'An error occurred during voice recognition.';
      if (event.error === 'no-speech') {
        message = 'No speech was detected. Please try again.';
      } else if (event.error === 'audio-capture') {
        message = 'No microphone was found. Please ensure a microphone is connected.';
      } else if (event.error === 'not-allowed') {
        message = 'Microphone permission was denied. Please allow access and try again.';
      }
      
      toast({
        title: 'Voice input error',
        description: message,
        variant: 'destructive',
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [isSupported, onTranscription, toast]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  return (
    <Button
      variant={isListening ? 'media-active' : 'media'}
      size="icon-lg"
      onClick={isListening ? stopListening : startListening}
      disabled={disabled || isProcessing}
      aria-label={
        isListening 
          ? 'Stop recording voice note' 
          : isProcessing 
            ? 'Processing voice input' 
            : 'Start recording voice note'
      }
      aria-pressed={isListening}
      className="relative"
    >
      {isProcessing ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : isListening ? (
        <>
          <MicOff className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-urgent rounded-full animate-pulse" />
        </>
      ) : (
        <Mic className="w-6 h-6" />
      )}
    </Button>
  );
};

export default VoiceInputButton;
