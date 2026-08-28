// Force relative paths on Netlify to route through Netlify proxy and eliminate CORS errors
const isNetlify = typeof window !== 'undefined' && window.location.hostname.includes('netlify.app');
const API_BASE_URL = isNetlify ? '' : (import.meta.env.VITE_API_BASE_URL || '');

/**
 * Health check endpoint ping
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn('Health check error (Backend offline or starting up):', err);
    return {
      success: false,
      service: 'AI Patient Onboarding',
      status: 'offline',
      models: {
        speech: 'Sarvam AI / Whisper',
        conversation: 'OpenAI GPT-4o-mini',
        validation: 'Claude 3.5 Sonnet',
        vision_documents: 'Gemini 1.5 Flash',
      },
    };
  }
}

/**
 * Start Voice Onboarding Session
 */
export async function startVoiceSession({ patient, category, language }) {
  const res = await fetch(`${API_BASE_URL}/v1/voice-onboarding/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient, category, language }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to start voice session: ${errText}`);
  }
  return await res.json();
}

/**
 * Send Voice Turn (Audio Blob or Text Fallback)
 */
export async function sendVoiceTurn(sessionId, audioBlob = null, textFallback = null) {
  const formData = new FormData();
  let hasData = false;

  if (audioBlob && audioBlob.size > 0) {
    const filename = audioBlob.type.includes('wav') ? 'speech.wav' : 'speech.webm';
    formData.append('audio', audioBlob, filename);
    hasData = true;
  }
  if (textFallback) {
    formData.append('text_fallback', textFallback);
    hasData = true;
  }

  if (!hasData) {
    throw new Error('No audio recording or text input provided');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout safeguard for serverless proxies

  try {
    const res = await fetch(`${API_BASE_URL}/v1/voice-onboarding/${sessionId}/turn`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Server status ${res.status}: ${errText}`);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out while processing speech turn.');
    }
    throw err;
  }
}

/**
 * Start Text Onboarding Session
 */
export async function startTextSession({ patient, category, language }) {
  const res = await fetch(`${API_BASE_URL}/v1/onboarding/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient, category, language }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to start text session: ${errText}`);
  }
  return await res.json();
}

/**
 * Send Text Message Turn
 */
export async function sendTextMessage(sessionId, message) {
  const res = await fetch(`${API_BASE_URL}/v1/onboarding/${sessionId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to send message: ${errText}`);
  }
  return await res.json();
}

/**
 * Upload Medical Document / Prescription (Gemini Vision OCR)
 */
export async function uploadDocument(sessionId, file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/v1/documents/${sessionId}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to upload document: ${errText}`);
  }
  return await res.json();
}

/**
 * Complete & Confirm Session (Step A: confirmed=false for preview, Step B: confirmed=true to save)
 */
export async function completeSession(sessionId, confirmed = false, isVoice = true) {
  const endpoint = isVoice
    ? `${API_BASE_URL}/v1/voice-onboarding/${sessionId}/complete`
    : `${API_BASE_URL}/v1/onboarding/${sessionId}/complete`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmed }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to complete onboarding session: ${errText}`);
  }
  return await res.json();
}

/**
 * Utility to resolve full audio URL for playback
 */
export function resolveAudioUrl(audioUrl) {
  if (!audioUrl) return null;
  if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
    return audioUrl;
  }
  return `${API_BASE_URL}${audioUrl}`;
}
