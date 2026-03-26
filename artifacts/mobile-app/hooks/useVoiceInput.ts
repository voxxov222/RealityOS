import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";

export type VoiceState = "idle" | "recording" | "processing" | "error";

interface UseVoiceInputOptions {
  onTranscript: (text: string) => void;
  onError?: (message: string) => void;
}

interface UseVoiceInputReturn {
  voiceState: VoiceState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => Promise<void>;
}

export function useVoiceInput({
  onTranscript,
  onError,
}: UseVoiceInputOptions): UseVoiceInputReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const recordingRef = useRef<Audio.Recording | null>(null);
  const webRecognitionRef = useRef<SpeechRecognition | null>(null);

  const cancelRecording = useCallback(async () => {
    if (Platform.OS === "web") {
      webRecognitionRef.current?.abort();
      webRecognitionRef.current = null;
    } else {
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {
          // ignore — already stopped or unloaded
        }
        recordingRef.current = null;
      }
    }
    setVoiceState("idle");
  }, []);

  const startRecording = useCallback(async () => {
    if (voiceState !== "idle") return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Web: use browser SpeechRecognition API
    if (Platform.OS === "web") {
      const SpeechRecognitionAPI =
        (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
        (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

      if (!SpeechRecognitionAPI) {
        setVoiceState("error");
        onError?.("Voice input is not supported in this browser. Please type your prompt.");
        setTimeout(() => setVoiceState("idle"), 2500);
        return;
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      webRecognitionRef.current = recognition;

      recognition.onstart = () => setVoiceState("recording");
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0]?.[0]?.transcript ?? "";
        if (transcript) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onTranscript(transcript);
        }
        setVoiceState("idle");
      };
      recognition.onerror = () => {
        setVoiceState("error");
        onError?.("Voice recognition failed. Please try again.");
        setTimeout(() => setVoiceState("idle"), 2500);
      };
      recognition.onend = () => {
        webRecognitionRef.current = null;
        if (voiceState === "recording") setVoiceState("idle");
      };

      try {
        recognition.start();
      } catch {
        setVoiceState("error");
        onError?.("Could not start voice input. Please try again.");
        setTimeout(() => setVoiceState("idle"), 2500);
      }
      return;
    }

    // Native: use expo-av
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        setVoiceState("error");
        onError?.("Microphone permission denied. Please enable it in Settings.");
        setTimeout(() => setVoiceState("idle"), 2500);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setVoiceState("recording");
    } catch {
      setVoiceState("error");
      onError?.("Could not start recording. Please try again.");
      setTimeout(() => setVoiceState("idle"), 2500);
    }
  }, [voiceState, onTranscript, onError]);

  const stopRecording = useCallback(async () => {
    if (voiceState !== "recording") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS === "web") {
      webRecognitionRef.current?.stop();
      setVoiceState("idle");
      return;
    }

    if (!recordingRef.current) {
      setVoiceState("idle");
      return;
    }

    setVoiceState("processing");

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        setVoiceState("idle");
        return;
      }

      // On native, we can't do STT without an external API.
      // Show a helpful message instead of silently failing.
      onError?.("Voice transcription requires a speech API. For now, please type your prompt.");
      setVoiceState("idle");
    } catch {
      recordingRef.current = null;
      onError?.("Recording failed. Please try again.");
      setVoiceState("idle");
    }
  }, [voiceState, onError]);

  return { voiceState, startRecording, stopRecording, cancelRecording };
}
