// Custom hook to encapsulate the speech recognition logic
import { useRef, useCallback } from 'react';

export const useSpeechRecognition = (onResult: (transcript: string) => void) => {
    const recognitionRef = useRef<typeof SpeechRecognition | null>(null);

    const startSpeechRecognition = useCallback(() => {
        if (!recognitionRef.current) {
            recognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.interimResults = false;
            recognitionRef.current.maxAlternatives = 1;
            recognitionRef.current.continuous = true; // Optional for continuous listening
        }

        const recognition = recognitionRef.current;

        recognition.onstart = () => {
            console.log("Speech recognition started.");
        };

        recognition.onend = () => {
            console.log("Speech recognition ended.");
        };

        recognition.onresult = (event) => {
            const speechToText = event.results[0][0].transcript.toLowerCase().trim();
            console.log("Recognized Speech:", speechToText);

            // Pass the recognized speech to the callback
            onResult(speechToText);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };

        recognition.start();
    }, [onResult]);

    const stopSpeechRecognition = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    return { startSpeechRecognition, stopSpeechRecognition };
};