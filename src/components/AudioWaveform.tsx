import React from "react";
import { VoiceState } from "../types/voice";

interface AudioWaveformProps {
  state: VoiceState;
  audioLevel: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ state, audioLevel }) => {
  if (state !== "listening" && state !== "ai_speaking") {
    return null;
  }

  const barCount = 18;
  const isListening = state === "listening";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      height: "44px",
      margin: "12px 0",
    }}>
      {Array.from({ length: barCount }).map((_, idx) => {
        // Calculate dynamic height based on audio level or animation
        let height = 6;
        if (isListening) {
          const factor = Math.sin((idx / barCount) * Math.PI) * (audioLevel / 100);
          height = Math.max(6, Math.min(38, Math.round(6 + factor * 32 + (Math.random() * 8))));
        } else {
          // AI Speaking rhythmic wave
          const phase = (idx + Date.now() / 150) % barCount;
          height = Math.max(8, Math.min(36, Math.round(10 + Math.sin(phase) * 18 + 8)));
        }

        return (
          <div
            key={idx}
            style={{
              width: "4px",
              height: `${height}px`,
              borderRadius: "999px",
              background: isListening
                ? "linear-gradient(to top, #f43f5e, #fb7185)"
                : "linear-gradient(to top, #06b6d4, #3b82f6)",
              transition: "height 0.1s ease",
            }}
          />
        );
      })}
    </div>
  );
};
