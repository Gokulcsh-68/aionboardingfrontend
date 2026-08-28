export type VoiceState =
  | "idle"
  | "starting"
  | "ai_speaking"
  | "listening"
  | "processing"
  | "confirmation"
  | "completed"
  | "error";

export interface PatientInfo {
  id: string;
  name: string;
  age: number;
  gender: string;
  abha_id?: string;
  phone?: string;
  insurance_scheme?: string;
  dietary_habits?: string;
}

export interface CategoryInfo {
  type: "general" | "speciality";
  code: string;
  name: string;
}

export interface VoiceTurnResult {
  success: boolean;
  session_id: string;
  patient_transcript: string;
  ai_text: string;
  stage: string;
  completed: boolean;
  audio_url: string;
  latencyMs?: number;
}

export interface MessageItem {
  id: string;
  role: "assistant" | "patient" | "system";
  text: string;
  timestamp: string;
  audioUrl?: string;
  latencyMs?: number;
}

