import { CategoryInfo, PatientInfo, VoiceTurnResult } from "../types/voice";
import { DocumentExtractionResult, PatientOnboardingResult } from "../types/onboarding";

const API_BASE_URL = "https://services-api.a2zhealth.in/onboarding";

export async function startVoiceOnboarding(
  patient: PatientInfo,
  category: CategoryInfo,
  language: string = "en-IN"
): Promise<{
  session_id: string;
  greeting_text: string;
  audio_url: string;
}> {
  const response = await fetch(`${API_BASE_URL}/v1/voice-onboarding/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patient,
      category,
      language,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to start voice onboarding session");
  }

  return response.json();
}

export async function sendVoiceTurn(
  sessionId: string,
  audioBlob?: Blob,
  textFallback?: string
): Promise<VoiceTurnResult> {
  const formData = new FormData();

  if (audioBlob) {
    formData.append("audio", audioBlob, "patient_speech.webm");
  }

  if (textFallback) {
    formData.append("text_fallback", textFallback);
  }

  const response = await fetch(
    `${API_BASE_URL}/v1/voice-onboarding/${sessionId}/turn`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Voice turn failed");
  }

  return response.json();
}

export async function uploadMedicalDocument(
  sessionId: string,
  file: File
): Promise<DocumentExtractionResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/v1/documents/${sessionId}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Document analysis failed");
  }

  return response.json();
}

export async function completeVoiceOnboarding(
  sessionId: string,
  confirmed: boolean
): Promise<{
  success: boolean;
  status: string;
  result?: PatientOnboardingResult;
  message: string;
}> {
  const response = await fetch(
    `${API_BASE_URL}/v1/voice-onboarding/${sessionId}/complete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmed }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to complete onboarding");
  }

  return response.json();
}

export function getAudioFullUrl(relativePath: string): string {
  if (relativePath.startsWith("http")) return relativePath;
  return `${API_BASE_URL}${relativePath.startsWith("/") ? "" : "/"}${relativePath}`;
}
