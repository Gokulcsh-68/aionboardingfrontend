import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  FileText,
  Keyboard,
  Send,
  Sparkles,
  RotateCcw,
  VolumeX,
  Volume2,
  Settings,
} from "lucide-react";
import { Header } from "./components/Header";
import { StepProgressBar } from "./components/StepProgressBar";
import { LanguageStep } from "./components/LanguageStep";
import { SpecialtyStep } from "./components/SpecialtyStep";
import { VoiceOrb } from "./components/VoiceOrb";
import { AudioWaveform } from "./components/AudioWaveform";
import { LiveTranscript } from "./components/LiveTranscript";
import { DocumentUploadModal } from "./components/DocumentUploadModal";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { VoiceSettingsModal } from "./components/VoiceSettingsModal";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import {
  startVoiceOnboarding,
  sendVoiceTurn,
  completeVoiceOnboarding,
  getAudioFullUrl,
} from "./services/api";
import { playNeuralIndianSpeech, stopNeuralSpeech } from "./services/voiceSynthesis";
import {
  CategoryInfo,
  MessageItem,
  PatientInfo,
  VoiceState,
} from "./types/voice";
import { PatientOnboardingResult } from "./types/onboarding";

const DEFAULT_PATIENT: PatientInfo = {
  id: "PAT-10023",
  name: "Ravi Kumar",
  age: 35,
  gender: "male",
  abha_id: "91-5642-1289-4091",
  phone: "+91 98401 23456",
  insurance_scheme: "PM-JAY / Ayushman Bharat",
  dietary_habits: "South Indian Vegetarian",
};

const DEFAULT_CATEGORY: CategoryInfo = {
  type: "speciality",
  code: "cardiology",
  name: "Cardiology (Heart & BP)",
};

export function App() {
  // Wizard Step: 1 = Language, 2 = Specialty, 3 = Onboarding
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Intake State
  const [patient, setPatient] = useState<PatientInfo>(DEFAULT_PATIENT);
  const [category, setCategory] = useState<CategoryInfo>(DEFAULT_CATEGORY);
  const [language, setLanguage] = useState<string>("ta-IN");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [currentStage, setCurrentStage] = useState<string>("greeting");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [onboardingResult, setOnboardingResult] = useState<PatientOnboardingResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showKeyboardFallback, setShowKeyboardFallback] = useState(false);
  const [textInput, setTextInput] = useState("");

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const setSessionIdWithRef = (id: string | null) => {
    sessionIdRef.current = id;
    setSessionId(id);
  };

  const recorderRef = useRef<{ startRecording: () => void; stopRecording: () => void } | null>(null);


  // Automated Hands-Free Speech Playback & Auto-Listen Loop
  const playAudioResponse = useCallback((
    audioUrl: string,
    speechTextOrAutoListen?: string | boolean,
    autoListenParam: boolean = true
  ) => {
    const speechText = typeof speechTextOrAutoListen === "string" ? speechTextOrAutoListen : undefined;
    const autoListenOnEnd = typeof speechTextOrAutoListen === "boolean" ? speechTextOrAutoListen : autoListenParam;

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    stopNeuralSpeech();

    if (isMuted) {
      if (autoListenOnEnd) {
        setVoiceState("listening");
        setTimeout(() => {
          if (recorderRef.current) recorderRef.current.startRecording();
        }, 300);
      }
      return;
    }

    setVoiceState("ai_speaking");

    const onSpeechFinished = () => {
      if (autoListenOnEnd) {
        setVoiceState("listening");
        setTimeout(() => {
          if (recorderRef.current) {
            recorderRef.current.startRecording();
          }
        }, 200);
      } else {
        setVoiceState("idle");
      }
    };

    // 1. Play Backend High-Fidelity Audio Stream (Sarvam AI Native Indian Accent) if available
    if (audioUrl) {
      const fullUrl = getAudioFullUrl(audioUrl);
      const audio = new Audio(fullUrl);
      currentAudioRef.current = audio;

      audio.onended = onSpeechFinished;
      audio.onerror = () => {
        // Fallback to browser neural voice if audio stream fails to load
        if (speechText) {
          const spoke = playNeuralIndianSpeech(speechText, language, onSpeechFinished);
          if (spoke) return;
        }
        onSpeechFinished();
      };

      audio.play().then(() => {
        // Audio stream started playing successfully
      }).catch((err) => {
        console.warn("Backend audio stream playback error, falling back to Web Speech:", err);
        if (speechText) {
          const spoke = playNeuralIndianSpeech(speechText, language, onSpeechFinished);
          if (spoke) return;
        }
        onSpeechFinished();
      });
      return;
    }

    // 2. Direct browser Web Speech if no audio URL provided
    if (speechText) {
      const spoke = playNeuralIndianSpeech(speechText, language, onSpeechFinished);
      if (spoke) return;
    }

    onSpeechFinished();
  }, [isMuted, language]);


  // Audio Recorder Hook (Handles Continuous Hands-Free VAD + Live Transcript)
  const handleAudioCaptured = useCallback(async (audioBlob: Blob, textTranscript?: string) => {
    const activeSessionId = sessionIdRef.current || sessionId;
    if (!activeSessionId) {
      console.warn("No active session ID for voice turn");
      return;
    }

    const startTime = performance.now();

    try {
      setVoiceState("processing");
      const turnRes = await sendVoiceTurn(activeSessionId, audioBlob, textTranscript);
      const responseTimeMs = Math.round(performance.now() - startTime);

      const hasSpeech = Boolean(turnRes.patient_transcript && turnRes.patient_transcript.trim());

      // Add AI response message with latency metric
      const aiMsg: MessageItem = {
        id: `ai-${Date.now() + 1}`,
        role: "assistant",
        text: turnRes.ai_text,
        timestamp: new Date().toLocaleTimeString(),
        audioUrl: turnRes.audio_url,
        latencyMs: responseTimeMs,
      };

      if (hasSpeech) {
        // Add patient transcribed message ONLY if patient actually spoke something
        const patientMsg: MessageItem = {
          id: `p-${Date.now()}`,
          role: "patient",
          text: turnRes.patient_transcript,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, patientMsg, aiMsg]);
      } else {
        setMessages((prev) => [...prev, aiMsg]);
      }

      setCurrentStage(turnRes.stage);

      if (turnRes.completed) {
        handleReviewCompletion();
      } else {
        // Only auto-listen if speech was actually detected, avoiding infinite silent loops
        playAudioResponse(turnRes.audio_url, turnRes.ai_text, hasSpeech);
      }
    } catch (err) {
      console.error("Voice turn processing error:", err);
      setVoiceState("error");
    }
  }, [sessionId, playAudioResponse]);

  const recorder = useAudioRecorder({
    language: language,
    onAudioCaptured: handleAudioCaptured,
  });

  useEffect(() => {
    recorderRef.current = recorder;
  }, [recorder]);

  // Start Onboarding Session
  const handleStartSession = async (chosenCategory?: CategoryInfo, chosenLanguage?: string) => {
    const cat = chosenCategory || category;
    const lang = chosenLanguage || language;
    const startTime = performance.now();

    try {
      setVoiceState("starting");
      const data = await startVoiceOnboarding(patient, cat, lang);
      const responseTimeMs = Math.round(performance.now() - startTime);
      setSessionIdWithRef(data.session_id);
      setCurrentStage("greeting");

      const greetingMsg: MessageItem = {
        id: `greet-${Date.now()}`,
        role: "assistant",
        text: data.greeting_text,
        timestamp: new Date().toLocaleTimeString(),
        audioUrl: data.audio_url,
        latencyMs: responseTimeMs,
      };

      setMessages([greetingMsg]);
      playAudioResponse(data.audio_url, data.greeting_text, true);
    } catch (err) {
      console.error("Failed to start voice session:", err);
      setVoiceState("error");
    }
  };

  // Main Orb Click Handler (Only needed if user manually wants to toggle/interrupt)
  const handleOrbClick = () => {
    if (voiceState === "idle" || voiceState === "error") {
      if (!sessionId) {
        handleStartSession();
      } else {
        setVoiceState("listening");
        if (recorderRef.current) recorderRef.current.startRecording();
      }
    } else if (voiceState === "listening") {
      // Manual commit early if desired
      if (recorderRef.current) recorderRef.current.stopRecording();
    } else if (voiceState === "ai_speaking") {
      // User interrupts AI speech to speak immediately
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      setVoiceState("listening");
      if (recorderRef.current) recorderRef.current.startRecording();
    } else if (voiceState === "confirmation") {
      setIsConfirmModalOpen(true);
    }
  };

  // Text Fallback Submit
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !sessionId) return;

    const userText = textInput.trim();
    setTextInput("");
    const startTime = performance.now();

    try {
      setVoiceState("processing");
      const turnRes = await sendVoiceTurn(sessionId, undefined, userText);
      const responseTimeMs = Math.round(performance.now() - startTime);

      const patientMsg: MessageItem = {
        id: `p-${Date.now()}`,
        role: "patient",
        text: userText,
        timestamp: new Date().toLocaleTimeString(),
      };

      const aiMsg: MessageItem = {
        id: `ai-${Date.now() + 1}`,
        role: "assistant",
        text: turnRes.ai_text,
        timestamp: new Date().toLocaleTimeString(),
        audioUrl: turnRes.audio_url,
        latencyMs: responseTimeMs,
      };

      setMessages((prev) => [...prev, patientMsg, aiMsg]);
      setCurrentStage(turnRes.stage);

      if (turnRes.completed) {
        handleReviewCompletion();
      } else if (turnRes.audio_url) {
        playAudioResponse(turnRes.audio_url, true);
      } else {
        setVoiceState("idle");
      }
    } catch (err) {
      console.error("Text fallback submission failed:", err);
      setVoiceState("error");
    }
  };


  // Review Completion Summary
  const handleReviewCompletion = async () => {
    if (!sessionId) return;
    try {
      setVoiceState("processing");
      const res = await completeVoiceOnboarding(sessionId, false);
      if (res.result) {
        setOnboardingResult(res.result);
        setIsConfirmModalOpen(true);
        setVoiceState("confirmation");
      }
    } catch (err) {
      console.error("Failed to load completion review:", err);
      setVoiceState("error");
    }
  };

  // Final Confirmation & Submission to Hospital EHR
  const handleFinalConfirm = async () => {
    if (!sessionId) return;
    try {
      setIsSubmitting(true);
      const res = await completeVoiceOnboarding(sessionId, true);
      if (res.success) {
        setIsConfirmModalOpen(false);
        setVoiceState("completed");
        const sysMsg: MessageItem = {
          id: `sys-${Date.now()}`,
          role: "system",
          text: "✅ Onboarding successfully saved to Hospital EHR record.",
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, sysMsg]);
      }
    } catch (err) {
      console.error("Final submission failed:", err);
      alert("Submission error. Temporary session retained for retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Session
  const handleReset = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    if (recorderRef.current) {
      recorderRef.current.stopRecording();
    }
    setSessionIdWithRef(null);
    setVoiceState("idle");
    setMessages([]);
    setOnboardingResult(null);
    setCurrentStage("greeting");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navigation Header */}
      <Header
        patient={patient}
        category={category}
        language={language}
        onLanguageChange={setLanguage}
        onCategoryChange={setCategory}
        voiceState={voiceState}
        onOpenVoiceSettings={() => setIsVoiceSettingsOpen(true)}
      />

      {/* Main Wizard Container */}
      <div style={{ flex: 1, maxWidth: "1280px", width: "100%", margin: "0 auto", padding: "24px 28px" }}>
        {/* Step Progress Bar */}
        <StepProgressBar
          currentStep={currentStep}
          onStepClick={(step) => {
            if (voiceState === "idle" || voiceState === "completed" || voiceState === "error") {
              setCurrentStep(step);
            }
          }}
        />

        {/* STEP 1: Language Selection */}
        {currentStep === 1 && (
          <LanguageStep
            selectedLanguage={language}
            onSelectLanguage={setLanguage}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {/* STEP 2: Specialty Selection */}
        {currentStep === 2 && (
          <SpecialtyStep
            selectedSpecialty={category}
            patient={patient}
            onSelectSpecialty={setCategory}
            onUpdatePatient={setPatient}
            onBack={() => setCurrentStep(1)}
            onNext={(cat) => {
              setCurrentStep(3);
              handleStartSession(cat);
            }}
          />
        )}

        {/* STEP 3: Voice Onboarding Intake */}
        {currentStep === 3 && (
          <main style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: "28px",
            alignItems: "start",
          }}>
            {/* Left Column: Voice Orb & Interactive Controls */}
            <section className="glass-panel" style={{
              padding: "32px 28px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minHeight: "560px",
              justifyContent: "space-between",
              position: "relative",
            }}>
              {/* Top Specialty & Language Status Badge */}
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <span className="badge-specialty">
                  {category.name} • {language === "ta-IN" ? "தமிழ்" : language === "hi-IN" ? "हिन्दी" : language === "te-IN" ? "తెలుగు" : language === "kn-IN" ? "ಕನ್ನಡ" : "English"}
                </span>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      handleReset();
                      setCurrentStep(1);
                    }}
                    className="btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                    title="Change Language & Specialty"
                  >
                    <Settings size={14} /> Change Config
                  </button>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                    title={isMuted ? "Unmute AI Voice" : "Mute AI Voice"}
                  >
                    {isMuted ? <VolumeX size={14} color="#f87171" /> : <Volume2 size={14} color="#38bdf8" />}
                  </button>

                  {sessionId && (
                    <button
                      onClick={handleReset}
                      className="btn-secondary"
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                      title="Restart Session"
                    >
                      <RotateCcw size={14} /> Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Central Glowing Voice Sphere (Clean Hands-Free) */}
              <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <VoiceOrb
                  state={voiceState}
                  audioLevel={recorder.audioLevel}
                  isSpeechDetected={recorder.isSpeechDetected}
                  onClick={handleOrbClick}
                />

                {/* Dynamic Soundwave Visualizer */}
                <AudioWaveform
                  state={voiceState}
                  audioLevel={recorder.audioLevel}
                />
              </div>

              {/* Bottom Action Tray: Document Upload + Keyboard Fallback + Review */}
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
                  {/* Document Upload Button */}
                  <button
                    onClick={() => setIsDocModalOpen(true)}
                    disabled={!sessionId}
                    className="btn-secondary"
                    style={{ opacity: !sessionId ? 0.5 : 1 }}
                  >
                    <FileText size={16} color="#8b5cf6" />
                    Upload Prescription / Report
                  </button>

                  {/* Keyboard Mode Toggle */}
                  <button
                    onClick={() => setShowKeyboardFallback(!showKeyboardFallback)}
                    className="btn-secondary"
                  >
                    <Keyboard size={16} color="#38bdf8" />
                    {showKeyboardFallback ? "Hide Keyboard" : "Type instead"}
                  </button>

                  {/* Review & Complete Trigger */}
                  {sessionId && (
                    <button
                      onClick={handleReviewCompletion}
                      className="btn-primary"
                      style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)" }}
                    >
                      <Sparkles size={16} /> Review Summary
                    </button>
                  )}
                </div>

                {/* Keyboard Input Fallback Box */}
                {showKeyboardFallback && (
                  <form onSubmit={handleTextSubmit} style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <input
                      type="text"
                      placeholder="Type your response to the doctor's assistant..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      disabled={!sessionId}
                      style={{
                        flex: 1,
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: "999px",
                        padding: "10px 18px",
                        color: "#f8fafc",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!textInput.trim() || !sessionId}
                      className="btn-primary"
                      style={{ padding: "10px 20px" }}
                    >
                      <Send size={15} />
                    </button>
                  </form>
                )}
              </div>
            </section>

            {/* Right Column: Live Clinical Dialogue Transcript */}
            <section style={{ width: "100%" }}>
              <LiveTranscript
                messages={messages}
                currentStage={currentStage}
                isProcessing={voiceState === "processing"}
                onPlayAudio={(url) => playAudioResponse(url, false)}
              />
            </section>
          </main>
        )}
      </div>

      {/* Gemini Vision Document Upload Modal */}
      {sessionId && (
        <DocumentUploadModal
          sessionId={sessionId}
          isOpen={isDocModalOpen}
          onClose={() => setIsDocModalOpen(false)}
          onExtractionComplete={(docRes) => {
            const docMsg: MessageItem = {
              id: `doc-${Date.now()}`,
              role: "system",
              text: `📄 Document Analyzed (${docRes.document_type}): ${docRes.summary}`,
              timestamp: new Date().toLocaleTimeString(),
            };
            setMessages((prev) => [...prev, docMsg]);
          }}
        />
      )}

      {/* Confirmation & Hospital Submission Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        result={onboardingResult}
        isSubmitting={isSubmitting}
        onConfirm={handleFinalConfirm}
        onCancel={() => setIsConfirmModalOpen(false)}
      />

      {/* Indian Voice & Accent Settings Modal */}
      <VoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
        language={language}
      />
    </div>
  );
}

export default App;

