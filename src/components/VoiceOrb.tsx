import React from "react";
import { Mic, Volume2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { VoiceState } from "../types/voice";

interface VoiceOrbProps {
  state: VoiceState;
  audioLevel: number;
  isSpeechDetected?: boolean;
  onClick: () => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  audioLevel,
  onClick,
}) => {
  const getOrbVisuals = () => {
    switch (state) {
      case "listening":
        return {
          gradient: "radial-gradient(circle, #f43f5e 0%, #be123c 100%)",
          glow: "rgba(244, 63, 94, 0.6)",
          icon: <Mic size={42} color="#ffffff" className="animate-pulse" />,
          statusText: "Listening to you...",
          subText: "Speak naturally, AI will respond automatically",
          color: "#f43f5e",
        };
      case "ai_speaking":
        return {
          gradient: "radial-gradient(circle, #06b6d4 0%, #2563eb 100%)",
          glow: "rgba(6, 182, 212, 0.7)",
          icon: <Volume2 size={42} color="#ffffff" />,
          statusText: "Assistant Speaking...",
          subText: "Mic activates automatically when speech ends",
          color: "#06b6d4",
        };
      case "processing":
        return {
          gradient: "radial-gradient(circle, #8b5cf6 0%, #6d28d9 100%)",
          glow: "rgba(139, 92, 246, 0.7)",
          icon: <Sparkles size={42} color="#ffffff" className="animate-spin-slow" />,
          statusText: "Thinking...",
          subText: "Analyzing symptoms & clinical details",
          color: "#8b5cf6",
        };
      case "confirmation":
        return {
          gradient: "radial-gradient(circle, #10b981 0%, #047857 100%)",
          glow: "rgba(16, 185, 129, 0.6)",
          icon: <CheckCircle2 size={42} color="#ffffff" />,
          statusText: "Intake Complete",
          subText: "Review your summary below to confirm",
          color: "#10b981",
        };
      case "completed":
        return {
          gradient: "radial-gradient(circle, #10b981 0%, #065f46 100%)",
          glow: "rgba(16, 185, 129, 0.5)",
          icon: <CheckCircle2 size={44} color="#ffffff" />,
          statusText: "Saved to Hospital Record",
          subText: "Transferred to OPD Consultation Queue",
          color: "#10b981",
        };
      case "error":
        return {
          gradient: "radial-gradient(circle, #ef4444 0%, #991b1b 100%)",
          glow: "rgba(239, 68, 68, 0.6)",
          icon: <AlertCircle size={42} color="#ffffff" />,
          statusText: "Tap to Reconnect",
          subText: "Reconnecting voice intake channel",
          color: "#ef4444",
        };
      default:
        return {
          gradient: "radial-gradient(circle, #06b6d4 0%, #3b82f6 100%)",
          glow: "rgba(6, 182, 212, 0.4)",
          icon: <Mic size={42} color="#ffffff" />,
          statusText: "Hands-Free Voice Active",
          subText: "Speak naturally to start conversation",
          color: "#06b6d4",
        };
    }
  };

  const visuals = getOrbVisuals();
  const scaleByAudio = state === "listening"
    ? 1 + Math.min(0.22, (audioLevel / 220))
    : state === "ai_speaking"
    ? 1.05
    : 1;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 0 16px 0",
      position: "relative",
    }}>
      {/* Orb Outer Container */}
      <div style={{ position: "relative", width: "170px", height: "170px", margin: "20px 0" }}>
        {/* Multi-layered dynamic aura glow */}
        <div
          style={{
            position: "absolute",
            inset: "-24px",
            borderRadius: "50%",
            background: visuals.glow,
            filter: "blur(36px)",
            opacity: state === "listening" || state === "ai_speaking" ? 0.95 : 0.4,
            transition: "all 0.3s ease",
            transform: `scale(${scaleByAudio})`,
          }}
        />

        {/* Dynamic Sound Ripple Aura */}
        {(state === "listening" || state === "ai_speaking") && (
          <>
            <div
              style={{
                position: "absolute",
                inset: "-16px",
                borderRadius: "50%",
                border: `2px solid ${visuals.color}`,
                opacity: 0.6,
                animation: "pulse-slow 2s infinite ease-out",
                transform: `scale(${scaleByAudio})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: "-32px",
                borderRadius: "50%",
                border: `1px solid ${visuals.color}`,
                opacity: 0.3,
                animation: "pulse-slow 2s 0.6s infinite ease-out",
              }}
            />
          </>
        )}

        {/* Clean, Modern Floating Voice Sphere */}
        <button
          onClick={onClick}
          aria-label={visuals.statusText}
          style={{
            position: "relative",
            width: "170px",
            height: "170px",
            borderRadius: "50%",
            background: visuals.gradient,
            border: "2px solid rgba(255, 255, 255, 0.35)",
            boxShadow: `0 0 50px ${visuals.glow}, inset 0 0 30px rgba(255, 255, 255, 0.4)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            outline: "none",
            transition: "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease",
            transform: `scale(${scaleByAudio})`,
          }}
        >
          {visuals.icon}
        </button>
      </div>

      {/* State Text & Feedback */}
      <div style={{ textAlign: "center", marginTop: "12px" }}>
        <h2 style={{
          fontSize: "22px",
          fontWeight: "700",
          color: visuals.color,
          marginBottom: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          letterSpacing: "-0.01em",
        }}>
          {visuals.statusText}
        </h2>
        <p style={{
          fontSize: "13px",
          color: "var(--text-secondary)",
          maxWidth: "380px",
          lineHeight: "1.4",
          margin: "0 auto",
        }}>
          {visuals.subText}
        </p>
      </div>
    </div>
  );
};
