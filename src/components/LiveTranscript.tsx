import React, { useEffect, useRef, useState } from "react";
import { Bot, User, Sparkles, Clock, Zap } from "lucide-react";
import { MessageItem } from "../types/voice";

interface LiveTranscriptProps {
  messages: MessageItem[];
  onPlayAudio?: (audioUrl: string) => void;
  currentStage: string;
  isProcessing?: boolean;
}

function formatLatency(ms?: number): { text: string; color: string; bg: string; border: string } | null {
  if (ms === undefined || ms === null) return null;

  const text = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;

  if (ms < 1200) {
    return {
      text,
      color: "#34d399",
      bg: "rgba(16, 185, 129, 0.15)",
      border: "rgba(16, 185, 129, 0.3)",
    };
  } else if (ms < 2500) {
    return {
      text,
      color: "#38bdf8",
      bg: "rgba(6, 182, 212, 0.15)",
      border: "rgba(6, 182, 212, 0.3)",
    };
  } else {
    return {
      text,
      color: "#fbbf24",
      bg: "rgba(245, 158, 11, 0.15)",
      border: "rgba(245, 158, 11, 0.3)",
    };
  }
}

export const LiveTranscript: React.FC<LiveTranscriptProps> = ({
  messages,
  currentStage,
  isProcessing,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Live stopwatch while AI is processing
  useEffect(() => {
    let interval: number | null = null;
    if (isProcessing) {
      const start = Date.now();
      setElapsedSeconds(0);
      interval = window.setInterval(() => {
        setElapsedSeconds(parseFloat(((Date.now() - start) / 1000).toFixed(1)));
      }, 100);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  // Find latest AI response latency
  const latestAIMessage = [...messages].reverse().find((m) => m.role === "assistant" && m.latencyMs !== undefined);
  const latestLatency = latestAIMessage?.latencyMs ? formatLatency(latestAIMessage.latencyMs) : null;

  return (
    <div className="glass-panel" style={{
      display: "flex",
      flexDirection: "column",
      height: "560px",
      overflow: "hidden",
      padding: "24px",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "16px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        marginBottom: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles size={16} color="#06b6d4" />
          <span style={{ fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
            Live Conversation
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Latest Response Time Badge */}
          {latestLatency && !isProcessing && (
            <div
              title="Latest AI Response Latency"
              style={{
                fontSize: "11px",
                padding: "3px 10px",
                borderRadius: "999px",
                background: latestLatency.bg,
                color: latestLatency.color,
                border: `1px solid ${latestLatency.border}`,
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Zap size={11} />
              <span>{latestLatency.text}</span>
            </div>
          )}

          {/* Current Stage Badge */}
          <div style={{
            fontSize: "12px",
            padding: "4px 12px",
            borderRadius: "999px",
            background: "rgba(59, 130, 246, 0.15)",
            color: "#60a5fa",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            fontWeight: "600",
            textTransform: "capitalize",
          }}>
            {currentStage.replace(/_/g, " ")}
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          paddingRight: "6px",
        }}
      >
        {messages.length === 0 ? (
          <div style={{
            margin: "auto",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "14px",
            maxWidth: "280px",
          }}>
            Voice session started. The assistant will speak and listen automatically.
          </div>
        ) : (
          messages.map((m) => {
            const isAI = m.role === "assistant";
            const isSystem = m.role === "system";
            const latency = isAI ? formatLatency(m.latencyMs) : null;

            if (isSystem) {
              return (
                <div key={m.id} style={{
                  alignSelf: "center",
                  background: "rgba(255, 255, 255, 0.05)",
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  color: "#38bdf8",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}>
                  {m.text}
                </div>
              );
            }

            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  gap: "10px",
                  alignSelf: isAI ? "flex-start" : "flex-end",
                  maxWidth: "88%",
                }}
              >
                {isAI && (
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 0 12px rgba(6, 182, 212, 0.4)",
                  }}>
                    <Bot size={17} color="#fff" />
                  </div>
                )}

                <div style={{
                  background: isAI
                    ? "rgba(30, 41, 59, 0.85)"
                    : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  border: isAI
                    ? "1px solid rgba(255, 255, 255, 0.08)"
                    : "none",
                  color: isAI ? "var(--text-primary)" : "#ffffff",
                  padding: "14px 18px",
                  borderRadius: isAI ? "20px 20px 20px 4px" : "20px 20px 4px 20px",
                  fontSize: "14px",
                  lineHeight: "1.55",
                  boxShadow: isAI
                    ? "0 4px 16px rgba(0, 0, 0, 0.25)"
                    : "0 4px 16px rgba(37, 99, 235, 0.35)",
                }}>
                  <p style={{ margin: 0 }}>{m.text}</p>
                  
                  {/* Timestamp & Latency Metric Footer */}
                  <div style={{
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isAI ? "space-between" : "flex-end",
                    gap: "8px",
                    marginTop: "8px",
                    opacity: 0.85,
                  }}>
                    <span style={{ opacity: 0.6 }}>{m.timestamp}</span>

                    {/* Response Latency Pill for AI */}
                    {latency && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "700",
                          color: latency.color,
                          background: latency.bg,
                          border: `1px solid ${latency.border}`,
                          padding: "1px 7px",
                          borderRadius: "999px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <Clock size={10} />
                        <span>Response: {latency.text}</span>
                      </span>
                    )}
                  </div>
                </div>

                {!isAI && (
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "rgba(59, 130, 246, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: "1px solid rgba(59, 130, 246, 0.4)",
                  }}>
                    <User size={17} color="#60a5fa" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* AI Live Thinking Bubble with Real-Time Stopwatch */}
        {isProcessing && (
          <div style={{ display: "flex", gap: "10px", alignSelf: "flex-start", maxWidth: "80%" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <Bot size={17} color="#fff" />
            </div>
            <div style={{
              background: "rgba(30, 41, 59, 0.85)",
              border: "1px solid rgba(6, 182, 212, 0.3)",
              borderRadius: "20px 20px 20px 4px",
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#38bdf8", animation: "pulse 1s infinite" }} />
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#38bdf8", animation: "pulse 1s 0.2s infinite" }} />
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#38bdf8", animation: "pulse 1s 0.4s infinite" }} />
              <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "600", marginLeft: "4px" }}>
                AI Processing... {elapsedSeconds > 0 && `${elapsedSeconds}s`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

