import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

interface VoiceInputButtonProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscription, disabled }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);

  // WAV Encoder Utility
  const encodeWAV = (samples: Float32Array, sampleRate: number) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // RIFF identifier
    writeString(0, 'RIFF');
    // file length
    view.setUint32(4, 36 + samples.length * 2, true);
    // RIFF type
    writeString(8, 'WAVE');
    // format chunk identifier
    writeString(12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count (mono)
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    writeString(36, 'data');
    // data chunk length
    view.setUint32(40, samples.length * 2, true);

    // Write PCM samples
    const offset = 44;
    for (let i = 0; i < samples.length; i++) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(offset + i * 2, s, true);
    }

    return new Blob([view], { type: 'audio/wav' });
  };

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Force 16kHz sample rate if possible, but browser might ignore
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      audioChunksRef.current = [];

      processor.onaudioprocess = (e) => {
        // Only capture if listening state is true intended (managed by react, 
        // but callback might run once more after stop invoked quickly)
        // We handle logic in stop to slice what we need.
        const channelData = e.inputBuffer.getChannelData(0);
        // Copy data to avoid buffer restrictions
        audioChunksRef.current.push(new Float32Array(channelData));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsListening(true);
    } catch (err) {
      console.error(err);
      toast({
        title: t('mic_error'),
        description: t('mic_access_denied'),
        variant: 'destructive'
      });
    }
  }, [toast, t]);

  const stopListening = useCallback(async () => {
    if (!isListening) return;

    setIsListening(false);
    setIsProcessing(true);

    try {
      // ... same cleanup ...
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      if (audioContextRef.current) {
        if (audioContextRef.current.state !== 'closed') {
          await audioContextRef.current.close();
        }
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Process stored chunks
      const totalLength = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
      const mergedBuffer = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of audioChunksRef.current) {
        mergedBuffer.set(chunk, offset);
        offset += chunk.length;
      }

      const wavBlob = encodeWAV(mergedBuffer, 16000);

      const formData = new FormData();
      formData.append('file', wavBlob, 'recording.wav');

      const response = await api.post('/api/voice/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.text) {
        onTranscription(response.data.text);
        toast({ title: t('voice_captured'), description: t('transcription_complete') });
      } else if (response.data.error) {
        throw new Error(response.data.error);
      }

    } catch (error) {
      console.error(error);
      toast({
        title: t('transcription_failed'),
        description: t('could_not_process_audio') + ' ' + (error instanceof Error ? error.message : ''),
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isListening, onTranscription, toast, t]);

  return (
    <Button
      variant={isListening ? 'destructive' : 'ghost'} // semantic colors for clearer state
      size="icon" // smaller standard size
      onClick={isListening ? stopListening : startListening}
      disabled={disabled || isProcessing}
      title={isListening ? t('stop_recording') : t('start_recording')}
      aria-label={
        isListening
          ? t('stop_recording')
          : isProcessing
            ? t('processing_voice')
            : t('start_recording')
      }
      aria-pressed={isListening}
      className={`relative h-8 w-8 rounded-full ${isListening ? 'animate-none' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
    >
      {isProcessing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isListening ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  );
};

export default VoiceInputButton;
