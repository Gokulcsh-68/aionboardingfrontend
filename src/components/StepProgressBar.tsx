import React from "react";
import { Globe, Stethoscope, Mic } from "lucide-react";

interface StepProgressBarProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  currentStep,
  onStepClick,
}) => {
  const steps = [
    { num: 1, label: "Select Language", icon: <Globe size={16} /> },
    { num: 2, label: "Choose Specialty", icon: <Stethoscope size={16} /> },
    { num: 3, label: "AI Voice Intake", icon: <Mic size={16} /> },
  ];

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 24px auto",
      maxWidth: "580px",
      width: "100%",
    }}>
      {steps.map((s, index) => {
        const isActive = currentStep === s.num;
        const isPassed = currentStep > s.num;

        return (
          <React.Fragment key={s.num}>
            {/* Step Node */}
            <div
              onClick={() => {
                if (isPassed && onStepClick) onStepClick(s.num);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: isPassed ? "pointer" : "default",
                opacity: isActive || isPassed ? 1 : 0.45,
                transition: "all 0.3s ease",
              }}
            >
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: isActive
                  ? "linear-gradient(135deg, #06b6d4, #3b82f6)"
                  : isPassed
                  ? "rgba(16, 185, 129, 0.2)"
                  : "rgba(255, 255, 255, 0.06)",
                border: isActive
                  ? "2px solid #38bdf8"
                  : isPassed
                  ? "2px solid #10b981"
                  : "1px solid rgba(255, 255, 255, 0.12)",
                color: isActive ? "#ffffff" : isPassed ? "#34d399" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: isActive ? "0 0 16px rgba(6, 182, 212, 0.5)" : "none",
                fontWeight: "700",
                fontSize: "14px",
              }}>
                {s.icon}
              </div>

              <div style={{ textAlign: "left" }}>
                <div style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: isActive ? "#38bdf8" : isPassed ? "#34d399" : "var(--text-muted)",
                }}>
                  Step {s.num}
                </div>
                <div style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: isActive ? "#f8fafc" : isPassed ? "#e2e8f0" : "var(--text-secondary)",
                }}>
                  {s.label}
                </div>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div style={{
                flex: 1,
                height: "2px",
                margin: "0 12px",
                background: currentStep > index + 1
                  ? "linear-gradient(90deg, #10b981, #06b6d4)"
                  : "rgba(255, 255, 255, 0.1)",
                transition: "all 0.3s ease",
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
