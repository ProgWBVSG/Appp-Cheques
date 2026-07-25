import { useState, useCallback, useEffect } from 'react';
import { parseTransaction } from '../utils/nlpParser';
import type { NLPResult } from '../utils/nlpParser';

interface UseVoiceAssistantResult {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  result: NLPResult | null;
  supported: boolean;
}

export function useVoiceAssistant(): UseVoiceAssistantResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NLPResult | null>(null);
  const [supported, setSupported] = useState(true);

  // @ts-ignore - SpeechRecognition is not fully typed in standard TS yet
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  useEffect(() => {
    if (!SpeechRecognition) {
      setSupported(false);
      setError('El reconocimiento de voz no está soportado en este navegador.');
    }
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) return;

    setError(null);
    setTranscript('');
    setResult(null);

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-AR'; // Español Argentina
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      const parsed = parseTransaction(text);
      if (parsed) {
        setResult(parsed);
      } else {
        setError('No entendí bien. Decí algo como "Gasté 5000 en nafta" o "Cobré 10 lucas".');
      }
    };

    recognition.onerror = (event: any) => {
      setError(`Error de voz: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      setError('Ya se estaba escuchando u ocurrió un error.');
    }
  }, [SpeechRecognition]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    // Note: stopping recognition abruptly doesn't always yield an onresult. 
    // We rely on the natural end of speech in most cases.
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    result,
    supported
  };
}
