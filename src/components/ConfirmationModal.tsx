import React from "react";
import { CheckCircle2, ShieldCheck, Heart, Pill, AlertTriangle, Send } from "lucide-react";
import { PatientOnboardingResult } from "../types/onboarding";

interface ConfirmationModalProps {
  isOpen: boolean;
  result: PatientOnboardingResult | null;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  result,
  isSubmitting,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !result) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.8)",
      backdropFilter: "blur(10px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 60,
      padding: "20px",
    }}>
      <div className="glass-panel" style={{
        width: "100%",
        maxWidth: "600px",
        padding: "32px",
        background: "#0d1322",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        boxShadow: "0 0 50px rgba(16, 185, 129, 0.15)",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #10b981, #06b6d4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <ShieldCheck size={26} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: "700" }}>Review & Confirm OPD Intake</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
              Specialty: {result.category.name} | OPD ID: {result.patient_id} {result.abha_id ? `| ABHA: ${result.abha_id}` : ""}
            </p>
          </div>
        </div>

        {/* Structured Summary Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
          {/* Chief Complaint */}
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "14px",
            padding: "14px 18px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}>
            <div style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "600", textTransform: "uppercase", marginBottom: "4px" }}>
              Chief Complaint / Reason for Visit
            </div>
            <div style={{ fontSize: "15px", fontWeight: "600" }}>
              {result.chief_complaint || "Not specified"}
            </div>
          </div>

          {/* Reported Symptoms */}
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "14px",
            padding: "14px 18px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#fb7185", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
              <Heart size={14} /> Reported Symptoms
            </div>
            {result.symptoms && result.symptoms.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {result.symptoms.map((s, i) => (
                  <div key={i} style={{ fontSize: "14px", display: "flex", justifyContent: "space-between", background: "rgba(255, 255, 255, 0.02)", padding: "6px 10px", borderRadius: "8px" }}>
                    <span style={{ fontWeight: "500" }}>• {s.name}</span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                      {s.duration ? `Duration: ${s.duration}` : ""} {s.severity ? `(${s.severity})` : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>None reported</span>
            )}
          </div>

          {/* Current Medications & Allergies Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* Medications */}
            <div style={{
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: "14px",
              padding: "14px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#a78bfa", fontWeight: "600", textTransform: "uppercase", marginBottom: "6px" }}>
                <Pill size={14} /> Medications
              </div>
              {result.medications && result.medications.length > 0 ? (
                <ul style={{ paddingLeft: "16px", fontSize: "13px", margin: 0 }}>
                  {result.medications.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              ) : (
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>No regular medications</span>
              )}
            </div>

            {/* Allergies */}
            <div style={{
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: "14px",
              padding: "14px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#facc15", fontWeight: "600", textTransform: "uppercase", marginBottom: "6px" }}>
                <AlertTriangle size={14} /> Allergies
              </div>
              {result.allergies && result.allergies.length > 0 ? (
                <ul style={{ paddingLeft: "16px", fontSize: "13px", margin: 0, color: "#f87171" }}>
                  {result.allergies.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              ) : (
                <span style={{ fontSize: "13px", color: "#34d399" }}>No known drug allergies</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={onCancel}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Edit / Continue Voice
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary"
            disabled={isSubmitting}
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              boxShadow: "0 4px 20px rgba(16, 185, 129, 0.4)",
            }}
          >
            <Send size={16} />
            {isSubmitting ? "Submitting to Hospital EHR..." : "Confirm & Save to Record"}
          </button>
        </div>
      </div>
    </div>
  );
};
