import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  greeting: string;
  flag: string;
  accentColor: string;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: "ta-IN",
    name: "Tamil",
    nativeName: "தமிழ்",
    greeting: "வணக்கம்! தமிழில் தொடரவும்",
    flag: "🇮🇳",
    accentColor: "#f59e0b",
  },
  {
    code: "en-IN",
    name: "English",
    nativeName: "English (India)",
    greeting: "Hello! Continue in English",
    flag: "🇬🇧",
    accentColor: "#3b82f6",
  },
  {
    code: "hi-IN",
    name: "Hindi",
    nativeName: "हिन्दी",
    greeting: "नमस्ते! हिन्दी में जारी रखें",
    flag: "🇮🇳",
    accentColor: "#ef4444",
  },
  {
    code: "te-IN",
    name: "Telugu",
    nativeName: "తెలుగు",
    greeting: "నమస్కారం! తెలుగులో కొనసాగించండి",
    flag: "🇮🇳",
    accentColor: "#10b981",
  },
  {
    code: "kn-IN",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    greeting: "ನಮಸ್ಕಾರ! ಕನ್ನಡದಲ್ಲಿ ಮುಂದುವರಿಯಿರಿ",
    flag: "🇮🇳",
    accentColor: "#8b5cf6",
  },
];

interface LanguageStepProps {
  selectedLanguage: string;
  onSelectLanguage: (code: string) => void;
  onNext: () => void;
}

export const LanguageStep: React.FC<LanguageStepProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onNext,
}) => {
  const handleCardClick = (code: string) => {
    onSelectLanguage(code);
    // Instant single-tap transition to Step 2
    onNext();
  };

  return (
    <div className="glass-panel" style={{
      maxWidth: "760px",
      width: "100%",
      margin: "0 auto",
      padding: "36px 32px",
      textAlign: "center",
    }}>
      {/* Title */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        background: "rgba(6, 182, 212, 0.12)",
        color: "#06b6d4",
        padding: "4px 14px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "600",
        marginBottom: "12px",
      }}>
        <Sparkles size={14} /> Step 1 of 3 • Tap a Language to Proceed
      </div>

      <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "8px", letterSpacing: "-0.02em" }}>
        Choose Your Language
      </h2>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "28px", maxWidth: "480px", margin: "0 auto 28px auto" }}>
        Tap your native language to immediately choose your medical department.
      </p>

      {/* Language Cards Grid (Instant Tap) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
      }}>
        {LANGUAGES.map((lang) => {
          const isSelected = selectedLanguage === lang.code;

          return (
            <button
              key={lang.code}
              onClick={() => handleCardClick(lang.code)}
              className="lang-card"
              style={{
                background: isSelected
                  ? "rgba(6, 182, 212, 0.14)"
                  : "rgba(255, 255, 255, 0.03)",
                border: isSelected
                  ? "2px solid #06b6d4"
                  : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "18px",
                padding: "22px 18px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.18s ease",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                boxShadow: isSelected ? "0 0 24px rgba(6, 182, 212, 0.25)" : "none",
                outline: "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <span style={{ fontSize: "28px" }}>{lang.flag}</span>
                <ArrowRight size={16} color={isSelected ? "#06b6d4" : "var(--text-muted)"} />
              </div>

              <div style={{ fontSize: "19px", fontWeight: "700", color: "#ffffff", marginTop: "4px" }}>
                {lang.nativeName}
              </div>

              <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>
                {lang.name}
              </div>

              <div style={{ fontSize: "11px", color: "#38bdf8", marginTop: "4px" }}>
                {lang.greeting}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
