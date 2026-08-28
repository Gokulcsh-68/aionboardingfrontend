import React from "react";
import { Activity, Globe, Shield, Sparkles, Volume2 } from "lucide-react";
import { CategoryInfo, PatientInfo, VoiceState } from "../types/voice";

interface HeaderProps {
  patient: PatientInfo;
  category: CategoryInfo;
  language: string;
  onLanguageChange: (lang: string) => void;
  onCategoryChange: (cat: CategoryInfo) => void;
  voiceState: VoiceState;
  onOpenVoiceSettings?: () => void;
}

const SPECIALTIES: CategoryInfo[] = [
  { type: "speciality", code: "cardiology", name: "Cardiology" },
  { type: "speciality", code: "mental_health", name: "Mental Health" },
  { type: "general", code: "general", name: "General Consultation" },
  { type: "speciality", code: "dermatology", name: "Dermatology" },
  { type: "speciality", code: "pediatrics", name: "Pediatrics" },
  { type: "speciality", code: "orthopedics", name: "Orthopedics" },
];

export const Header: React.FC<HeaderProps> = ({
  patient,
  category,
  language,
  onLanguageChange,
  onCategoryChange,
  voiceState,
  onOpenVoiceSettings,
}) => {
  const isSessionLocked = voiceState !== "idle" && voiceState !== "completed" && voiceState !== "error";

  return (
    <header style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 28px",
      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      background: "rgba(10, 13, 20, 0.8)",
      backdropFilter: "blur(12px)",
      position: "sticky",
      top: 0,
      zIndex: 40,
    }}>
      {/* Brand & Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "42px",
          height: "42px",
          borderRadius: "14px",
          background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 20px rgba(6, 182, 212, 0.4)",
        }}>
          <Activity size={24} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px", fontWeight: "700", letterSpacing: "-0.02em" }}>
              CureSelect
            </span>
            <span style={{
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "999px",
              background: "rgba(6, 182, 212, 0.15)",
              color: "#06b6d4",
              border: "1px solid rgba(6, 182, 212, 0.3)",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <Sparkles size={10} /> Voice AI
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
            Hospital Patient Intake Assistant
          </p>
        </div>
      </div>

      {/* Patient & Specialty Context */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 14px",
          background: "rgba(255, 255, 255, 0.04)",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}>
          <div style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "rgba(59, 130, 246, 0.2)",
            color: "#60a5fa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "600",
          }}>
            {patient.name.charAt(0)}
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>
              {patient.name} ({patient.age}y, {patient.gender})
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              ID: {patient.id}
            </div>
          </div>
        </div>

        {/* Specialty Selector */}
        <select
          disabled={isSessionLocked}
          value={category.code}
          onChange={(e) => {
            const found = SPECIALTIES.find((s) => s.code === e.target.value);
            if (found) onCategoryChange(found);
          }}
          style={{
            background: "rgba(18, 24, 38, 0.9)",
            color: "#38bdf8",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            borderRadius: "12px",
            padding: "8px 14px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: isSessionLocked ? "not-allowed" : "pointer",
            outline: "none",
          }}
        >
          {SPECIALTIES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Language Selector */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(255, 255, 255, 0.04)",
          padding: "6px 12px",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}>
          <Globe size={15} color="#94a3b8" />
          <select
            disabled={isSessionLocked}
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            style={{
              background: "transparent",
              color: "var(--text-primary)",
              border: "none",
              fontSize: "13px",
              fontWeight: "500",
              cursor: isSessionLocked ? "not-allowed" : "pointer",
              outline: "none",
            }}
          >
            <option value="ta-IN" style={{ background: "#0a0d14" }}>Tamil (தமிழ்)</option>
            <option value="en-IN" style={{ background: "#0a0d14" }}>English (India)</option>
            <option value="hi-IN" style={{ background: "#0a0d14" }}>Hindi (हिन्दी)</option>
            <option value="te-IN" style={{ background: "#0a0d14" }}>Telugu (తెలుగు)</option>
            <option value="kn-IN" style={{ background: "#0a0d14" }}>Kannada (ಕನ್ನಡ)</option>
          </select>
        </div>

        {/* Indian Voice & Accent Settings Button */}
        {onOpenVoiceSettings && (
          <button
            onClick={onOpenVoiceSettings}
            title="Configure Indian Neural Voice & Accent Calibration"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(6, 182, 212, 0.12)",
              color: "#38bdf8",
              border: "1px solid rgba(6, 182, 212, 0.3)",
              padding: "7px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Volume2 size={15} />
            <span>Voice & Accent</span>
          </button>
        )}

        {/* Medical Safety Seal */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: "#34d399",
          fontSize: "12px",
          fontWeight: "500",
          background: "rgba(16, 185, 129, 0.1)",
          padding: "6px 12px",
          borderRadius: "999px",
          border: "1px solid rgba(16, 185, 129, 0.2)",
        }}>
          <Shield size={14} />
          <span>Intake Portal</span>
        </div>
      </div>
    </header>
  );
};

