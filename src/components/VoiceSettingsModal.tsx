import React, { useState, useEffect } from "react";
import { Volume2, Sliders, X, Sparkles, Check, Play, Square } from "lucide-react";
import {
  getAvailableIndianVoices,
  setSelectedVoiceURI,
  getSelectedVoiceURI,
  getVoiceRate,
  setVoiceRate,
  getVoicePitch,
  setVoicePitch,
  testIndianAccentSample,
  stopNeuralSpeech,
} from "../services/voiceSynthesis";

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedURI, setSelectedURI] = useState<string | null>(getSelectedVoiceURI());
  const [rate, setRate] = useState<number>(getVoiceRate());
  const [pitch, setPitch] = useState<number>(getVoicePitch());
  const [isPlayingTest, setIsPlayingTest] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadVoices = () => {
      const available = getAvailableIndianVoices(language);
      setVoices(available);
      setSelectedURI(getSelectedVoiceURI());
      setRate(getVoiceRate());
      setPitch(getVoicePitch());
    };

    loadVoices();

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [isOpen, language]);

  if (!isOpen) return null;

  const handleVoiceSelect = (uri: string) => {
    const newURI = uri === "auto" ? null : uri;
    setSelectedURI(newURI);
    setSelectedVoiceURI(newURI);
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    setVoiceRate(newRate);
  };

  const handlePitchChange = (newPitch: number) => {
    setPitch(newPitch);
    setVoicePitch(newPitch);
  };

  const handleTestVoice = () => {
    if (isPlayingTest) {
      stopNeuralSpeech();
      setIsPlayingTest(false);
      return;
    }

    setIsPlayingTest(true);
    testIndianAccentSample(language, () => {
      setIsPlayingTest(false);
    });
  };

  const langNames: Record<string, string> = {
    "ta-IN": "Tamil (தமிழ்)",
    "en-IN": "English (India)",
    "hi-IN": "Hindi (हिन्दी)",
    "te-IN": "Telugu (తెలుగు)",
    "kn-IN": "Kannada (ಕನ್ನಡ)",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "16px",
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "540px",
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(10, 15, 29, 0.98))",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(6, 182, 212, 0.15)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Volume2 size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: "700", margin: 0, color: "#ffffff" }}>
                Indian Voice & Accent Calibration
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                Active Language: <strong style={{ color: "#38bdf8" }}>{langNames[language] || language}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopNeuralSpeech();
              setIsPlayingTest(false);
              onClose();
            }}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "6px",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Voice Selection List */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", display: "block", marginBottom: "8px" }}>
            Select Neural / Natural Indian Voice Engine
          </label>

          <div
            style={{
              maxHeight: "180px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              paddingRight: "4px",
            }}
          >
            {/* Auto-Optimized Option */}
            <div
              onClick={() => handleVoiceSelect("auto")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: "10px",
                background: selectedURI === null ? "rgba(6, 182, 212, 0.15)" : "rgba(255, 255, 255, 0.03)",
                border: selectedURI === null ? "1px solid #06b6d4" : "1px solid rgba(255, 255, 255, 0.06)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Sparkles size={13} color="#06b6d4" /> Auto-Select Highest Quality Indian Voice
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Recommended • Prioritizes Microsoft Neerja / Swara / Valluvar & Google Neural voices
                </div>
              </div>
              {selectedURI === null && <Check size={16} color="#06b6d4" />}
            </div>

            {/* Installed Voices */}
            {voices.map((v) => {
              const isSelected = selectedURI === v.voiceURI;
              const isNatural = v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("online");
              const isIndianNamed = ["neerja", "prabhat", "heera", "ravi", "swara", "madhur", "valluvar", "mohan", "gagan", "india"].some(
                (k) => v.name.toLowerCase().includes(k)
              );

              return (
                <div
                  key={v.voiceURI}
                  onClick={() => handleVoiceSelect(v.voiceURI)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: isSelected ? "rgba(6, 182, 212, 0.15)" : "rgba(255, 255, 255, 0.03)",
                    border: isSelected ? "1px solid #06b6d4" : "1px solid rgba(255, 255, 255, 0.06)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                      {v.name}
                      {isIndianNamed && (
                        <span
                          style={{
                            fontSize: "10px",
                            background: "rgba(16, 185, 129, 0.2)",
                            color: "#34d399",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            fontWeight: "700",
                          }}
                        >
                          Indian Accent
                        </span>
                      )}
                      {isNatural && (
                        <span
                          style={{
                            fontSize: "10px",
                            background: "rgba(59, 130, 246, 0.2)",
                            color: "#60a5fa",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            fontWeight: "600",
                          }}
                        >
                          Neural
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Language: {v.lang}
                    </div>
                  </div>
                  {isSelected && <Check size={16} color="#06b6d4" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sliders: Rate & Pitch */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Pacing / Speed</span>
              <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "600" }}>{rate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.2"
              step="0.02"
              value={rate}
              onChange={(e) => handleRateChange(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "#06b6d4", cursor: "pointer" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Pitch / Tone</span>
              <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "600" }}>{pitch.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.02"
              value={pitch}
              onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "#06b6d4", cursor: "pointer" }}
            />
          </div>
        </div>

        {/* High Precision STT & Medical Speech Normalization Badge */}
        <div
          style={{
            background: "rgba(6, 182, 212, 0.08)",
            border: "1px solid rgba(56, 189, 248, 0.2)",
            borderRadius: "10px",
            padding: "10px 14px",
            marginBottom: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={14} color="#38bdf8" />
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#e0f2fe" }}>
              High-Precision Clinical STT Active
            </span>
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
            Multi-engine cascade (Sarvam Saaras v2 + Gemini Multimodal + Whisper-1) with Indian clinical phonetic normalization & code-switching (Tanglish/Hinglish).
          </p>
        </div>

        {/* Test Speech Sample Button & Done Button */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handleTestVoice}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 16px",
              borderRadius: "12px",
              background: isPlayingTest ? "rgba(239, 68, 68, 0.2)" : "rgba(6, 182, 212, 0.15)",
              border: isPlayingTest ? "1px solid #ef4444" : "1px solid #06b6d4",
              color: isPlayingTest ? "#f87171" : "#38bdf8",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {isPlayingTest ? (
              <>
                <Square size={16} /> Stop Sample
              </>
            ) : (
              <>
                <Play size={16} /> Test Accent Speech
              </>
            )}
          </button>

          <button
            onClick={() => {
              stopNeuralSpeech();
              setIsPlayingTest(false);
              onClose();
            }}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
              border: "none",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 0 15px rgba(6, 182, 212, 0.3)",
            }}
          >
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
};
