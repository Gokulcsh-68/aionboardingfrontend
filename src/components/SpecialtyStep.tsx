import React, { useState } from "react";
import {
  Heart,
  Brain,
  Stethoscope,
  Sparkles,
  Baby,
  Bone,
  Eye,
  ArrowLeft,
  ArrowRight,
  User,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { CategoryInfo, PatientInfo } from "../types/voice";

interface SpecialtyOption {
  code: string;
  name: string;
  type: "general" | "speciality";
  icon: React.ReactNode;
  color: string;
  focus: string;
  examples: string;
}

const SPECIALTIES: SpecialtyOption[] = [
  {
    code: "cardiology",
    name: "Cardiology (Heart & BP)",
    type: "speciality",
    icon: <Heart size={24} color="#f43f5e" />,
    color: "#f43f5e",
    focus: "Chest pain (நெஞ்சு வலி), BP, palpitations, breathlessness, Telma / Amlodipine",
    examples: "Heart checkup, ECG, Stent history",
  },
  {
    code: "diabetology",
    name: "Diabetology (Sugar / Diabetes)",
    type: "speciality",
    icon: <Activity size={24} color="#06b6d4" />,
    color: "#06b6d4",
    focus: "Sugar readings, Fasting/PPBS, HbA1c, Glycomet, Insulin, tingling in feet",
    examples: "Sugar check, diabetic diet, foot exam",
  },
  {
    code: "general",
    name: "General Physician & OPD",
    type: "general",
    icon: <Stethoscope size={24} color="#10b981" />,
    color: "#10b981",
    focus: "Fever (Dengue, Viral, Typhoid), cold, body ache, acidity / Pan-D, Dolo 650",
    examples: "General OPD consultation, health check",
  },
  {
    code: "mental_health",
    name: "Mental Health & Wellness",
    type: "speciality",
    icon: <Brain size={24} color="#8b5cf6" />,
    color: "#8b5cf6",
    focus: "Stress, anxiety, sleep issues (தூக்கமின்மை), low mood, panic",
    examples: "Psychiatry, counselling intake",
  },
  {
    code: "dermatology",
    name: "Dermatology (Skin & Hair)",
    type: "speciality",
    icon: <Sparkles size={24} color="#ec4899" />,
    color: "#ec4899",
    focus: "Skin rashes, itching (அரிப்பு), fungal infections, hair fall, acne",
    examples: "Skin OPD, cosmetic consultation",
  },
  {
    code: "orthopedics",
    name: "Orthopedics (Bone & Joint)",
    type: "speciality",
    icon: <Bone size={24} color="#f59e0b" />,
    color: "#f59e0b",
    focus: "Knee pain (மூட்டு வலி), back pain, arthritis, fractures, swelling",
    examples: "Bone & joint specialist, X-ray",
  },
  {
    code: "pediatrics",
    name: "Pediatrics (Child Health)",
    type: "speciality",
    icon: <Baby size={24} color="#3b82f6" />,
    color: "#3b82f6",
    focus: "Child fever, growth milestones, vaccinations (தடுப்பூசி), appetite",
    examples: "Child OPD, immunization",
  },
  {
    code: "ent",
    name: "ENT (Ear, Nose & Throat)",
    type: "speciality",
    icon: <Eye size={24} color="#14b8a6" />,
    color: "#14b8a6",
    focus: "Ear discharge, sinusitis, sore throat (தொண்டை வலி), tonsils",
    examples: "ENT clinic, hearing check",
  },
];

interface SpecialtyStepProps {
  selectedSpecialty: CategoryInfo;
  patient: PatientInfo;
  onSelectSpecialty: (cat: CategoryInfo) => void;
  onUpdatePatient: (patient: PatientInfo) => void;
  onBack: () => void;
  onNext: (cat?: CategoryInfo) => void;
}

export const SpecialtyStep: React.FC<SpecialtyStepProps> = ({
  selectedSpecialty,
  patient,
  onSelectSpecialty,
  onUpdatePatient,
  onBack,
  onNext,
}) => {
  const [showEditPatient, setShowEditPatient] = useState(false);

  const handleCardClick = (spec: SpecialtyOption) => {
    const cat: CategoryInfo = {
      type: spec.type,
      code: spec.code,
      name: spec.name,
    };
    onSelectSpecialty(cat);
    // Instant launch of voice onboarding on tap
    onNext(cat);
  };

  return (
    <div className="glass-panel" style={{
      maxWidth: "880px",
      width: "100%",
      margin: "0 auto",
      padding: "36px 32px",
    }}>
      {/* Top Navigation Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <button
          onClick={onBack}
          className="btn-secondary"
          style={{ padding: "8px 16px", fontSize: "13px" }}
        >
          <ArrowLeft size={15} />
          <span>Change Language</span>
        </button>

        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(59, 130, 246, 0.12)",
          color: "#60a5fa",
          padding: "4px 14px",
          borderRadius: "999px",
          fontSize: "12px",
          fontWeight: "600",
        }}>
          <Sparkles size={14} /> Step 2 of 3 • Tap a Department to Begin Voice Intake
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "6px", letterSpacing: "-0.02em" }}>
          Select Medical Specialty
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "560px", margin: "0 auto" }}>
          Tap any department to immediately start your voice conversation with the AI Doctor Assistant.
        </p>
      </div>

      {/* Indian Patient Profile & ABHA Card */}
      <div style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        padding: "14px 20px",
        marginBottom: "24px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
            }}>
              <User size={19} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>{patient.name} ({patient.age}y, {patient.gender})</span>
                <span style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#34d399",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}>
                  <ShieldCheck size={11} /> ABHA: {patient.abha_id || "91-5642-1289-4091"}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                OPD Slip: {patient.id} | Scheme: {patient.insurance_scheme || "PM-JAY / Ayushman Bharat"}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowEditPatient(!showEditPatient)}
            className="btn-secondary"
            style={{ padding: "6px 12px", fontSize: "12px" }}
          >
            {showEditPatient ? "Save Details" : "Edit ABHA & Info"}
          </button>
        </div>

        {/* Expandable Patient Edit Form */}
        {showEditPatient && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            marginTop: "14px",
            paddingTop: "14px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          }}>
            <div>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                Patient Name
              </label>
              <input
                type="text"
                value={patient.name}
                onChange={(e) => onUpdatePatient({ ...patient, name: e.target.value })}
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  color: "#fff",
                  fontSize: "13px",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                ABHA ID
              </label>
              <input
                type="text"
                value={patient.abha_id || "91-5642-1289-4091"}
                onChange={(e) => onUpdatePatient({ ...patient, abha_id: e.target.value })}
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  color: "#38bdf8",
                  fontSize: "13px",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                Insurance / Scheme
              </label>
              <select
                value={patient.insurance_scheme || "PM-JAY / Ayushman Bharat"}
                onChange={(e) => onUpdatePatient({ ...patient, insurance_scheme: e.target.value })}
                style={{
                  width: "100%",
                  background: "rgba(18, 24, 38, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  color: "#fff",
                  fontSize: "13px",
                }}
              >
                <option value="PM-JAY / Ayushman Bharat">PM-JAY / Ayushman Bharat</option>
                <option value="Chief Minister Health Scheme (CMCHIS)">Chief Minister Health Scheme (CMCHIS)</option>
                <option value="CGHS / ECHS">CGHS / ECHS Govt Scheme</option>
                <option value="Private TPA Insurance">Private Insurance (Star / Care / HDFC)</option>
                <option value="Cash / Self-Pay">Cash / Self-Pay</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Specialties Grid (Instant Launch on Click) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "14px",
      }}>
        {SPECIALTIES.map((spec) => {
          const isSelected = selectedSpecialty.code === spec.code;

          return (
            <button
              key={spec.code}
              onClick={() => handleCardClick(spec)}
              style={{
                background: isSelected
                  ? "rgba(6, 182, 212, 0.14)"
                  : "rgba(255, 255, 255, 0.03)",
                border: isSelected
                  ? "2px solid #06b6d4"
                  : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "16px",
                padding: "18px 16px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.18s ease",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                boxShadow: isSelected ? "0 0 20px rgba(6, 182, 212, 0.25)" : "none",
                outline: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {spec.icon}
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  color: "#38bdf8",
                  fontWeight: "600",
                }}>
                  <span>Start</span>
                  <ArrowRight size={14} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff" }}>
                  {spec.name}
                </div>
                <p style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  margin: "4px 0 0 0",
                  lineHeight: "1.4",
                }}>
                  {spec.focus}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
