import { useState, useRef, useCallback, useEffect } from "react";

interface UseAudioRecorderProps {
  onAudioCaptured: (audioBlob: Blob, textTranscript?: string) => void;
  language?: string;
  maxDurationSeconds?: number;
  silenceThresholdSeconds?: number;
}

export function useAudioRecorder({
  onAudioCaptured,
  language = "ta-IN",
  maxDurationSeconds = 5.0,
  silenceThresholdSeconds = 0.9,
}: UseAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isSpeechDetected, setIsSpeechDetected] = useState(false);

  const onAudioCapturedRef = useRef(onAudioCaptured);
  useEffect(() => {
    onAudioCapturedRef.current = onAudioCaptured;
  }, [onAudioCaptured]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const maxTimeoutRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const liveTranscriptRef = useRef<string>("");

  // Dynamic VAD refs
  const hasSpokenRef = useRef<boolean>(false);
  const silenceStartRef = useRef<number | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  const noiseFloorRef = useRef<number>(10);
  const sampleCountRef = useRef<number>(0);
  const sampleSumRef = useRef<number>(0);

  const stopRecording = useCallback(() => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
      speechRecognitionRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    setIsSpeechDetected(false);
    setAudioLevel(0);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      isStoppingRef.current = false;
      hasSpokenRef.current = false;
      silenceStartRef.current = null;
      audioChunksRef.current = [];
      sampleCountRef.current = 0;
      sampleSumRef.current = 0;
      noiseFloorRef.current = 10;
      liveTranscriptRef.current = "";

      // High-definition audio constraints tailored for Indian speech recognition
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setHasPermission(true);

      // Web Speech API for high-accuracy local Indian Language Recognition
      try {
        const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (SpeechRec) {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = language || "ta-IN";

          rec.onresult = (event: any) => {
            let finalStr = "";
            let isFinal = false;
            for (let i = 0; i < event.results.length; i++) {
              finalStr += event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                isFinal = true;
              }
            }
            if (finalStr.trim()) {
              liveTranscriptRef.current = finalStr.trim();
              hasSpokenRef.current = true;
              setIsSpeechDetected(true);
              silenceStartRef.current = null;

              if (isFinal) {
                setTimeout(() => {
                  stopRecording();
                }, 300);
              }
            }
          };

          rec.onspeechend = () => {
            if (hasSpokenRef.current) {
              setTimeout(() => {
                stopRecording();
              }, 300);
            }
          };

          rec.onerror = () => {};
          rec.onend = () => {};

          try {
            rec.start();
            speechRecognitionRef.current = rec;
          } catch (_) {}
        }
      } catch (_) {}

      // Adaptive Dynamic VAD Analyzer with Indian Room Acoustics Tolerance
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.25;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkAudioActivity = () => {
          if (isStoppingRef.current || !analyser) return;

          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const currentLevel = Math.min(100, Math.round((avg / 128) * 100));
          setAudioLevel(currentLevel);

          // Calibrate background noise floor over the first 15 frames
          if (sampleCountRef.current < 15) {
            sampleCountRef.current += 1;
            sampleSumRef.current += currentLevel;
            noiseFloorRef.current = Math.round(sampleSumRef.current / sampleCountRef.current);
            animationFrameRef.current = requestAnimationFrame(checkAudioActivity);
            return;
          }

          const now = Date.now();
          const baseNoise = noiseFloorRef.current;
          const SPEECH_TRIGGER = Math.max(10, baseNoise + 5);

          if (currentLevel > SPEECH_TRIGGER) {
            hasSpokenRef.current = true;
            setIsSpeechDetected(true);
            silenceStartRef.current = null;
          } else {
            // Once speech has been detected, level dropping below trigger immediately starts silence countdown
            if (hasSpokenRef.current) {
              if (silenceStartRef.current === null) {
                silenceStartRef.current = now;
              } else {
                const silenceDurationMs = now - silenceStartRef.current;
                if (silenceDurationMs >= silenceThresholdSeconds * 1000) {
                  stopRecording();
                  return;
                }
              }
            }
          }

          animationFrameRef.current = requestAnimationFrame(checkAudioActivity);
        };

        checkAudioActivity();
      } catch (err) {
        console.warn("AudioContext VAD warning:", err);
      }

      // MediaRecorder initialization with standard codecs
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : undefined;

      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        const recognizedText = liveTranscriptRef.current;

        if (onAudioCapturedRef.current) {
          onAudioCapturedRef.current(audioBlob, recognizedText);
        }
        setIsRecording(false);
        setAudioLevel(0);
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      maxTimeoutRef.current = window.setTimeout(() => {
        stopRecording();
      }, maxDurationSeconds * 1000);
    } catch (err) {
      console.error("Microphone access failed:", err);
      setHasPermission(false);
      setIsRecording(false);
    }
  }, [language, maxDurationSeconds, silenceThresholdSeconds, stopRecording]);

  return {
    isRecording,
    hasPermission,
    audioLevel,
    isSpeechDetected,
    startRecording,
    stopRecording,
  };
}
