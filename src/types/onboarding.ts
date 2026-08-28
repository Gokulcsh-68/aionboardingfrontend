export interface Symptom {
  name: string;
  duration?: string | null;
  severity?: string | null;
  description?: string | null;
}

export interface PatientOnboardingResult {
  patient_id: string;
  abha_id?: string;
  phone?: string;
  insurance_scheme?: string;
  category: {
    type: string;
    code: string;
    name: string;
  };
  chief_complaint?: string | null;
  symptoms: Symptom[];
  medical_history: string[];
  medications: string[];
  allergies: string[];
  dietary_habits?: string | null;
  additional_information?: string | null;
  language: string;
  onboarding_completed: boolean;
}

export interface DocumentFinding {
  test: string;
  value: string;
  unit?: string | null;
  interpretation?: string | null;
}

export interface DocumentExtractionResult {
  success: boolean;
  session_id: string;
  document_type: string;
  summary: string;
  findings: DocumentFinding[];
  medications_found: string[];
  allergies_found: string[];
  message: string;
}
