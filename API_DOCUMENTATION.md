# AI Patient Onboarding — Backend API Documentation

This document provides a comprehensive guide for integrating with the **AI Patient Onboarding FastAPI Backend**. It covers all REST API endpoints, request/response models, voice integration flows, medical document processing, and EHR integration.

---

## Table of Contents
1. [Architecture & Server Overview](#1-architecture--server-overview)
2. [Environment Configuration (`.env`)](#2-environment-configuration-env)
3. [Running the Backend Locally](#3-running-the-backend-locally)
4. [Voice Onboarding API (`/v1/voice-onboarding`)](#4-voice-onboarding-api-v1voice-onboarding)
   - [4.1 Start Voice Session](#41-start-voice-session)
   - [4.2 Send Voice / Speech Turn](#42-send-voice--speech-turn)
   - [4.3 Fetch Synthesized Voice Audio](#43-fetch-synthesized-voice-audio)
   - [4.4 Complete & Confirm Session](#44-complete--confirm-session)
5. [Text Onboarding API (`/v1/onboarding`)](#5-text-onboarding-api-v1onboarding)
   - [5.1 Start Text Session](#51-start-text-session)
   - [5.2 Send Text Message](#52-send-text-message)
   - [5.3 Complete Text Onboarding](#53-complete-text-onboarding)
6. [Medical Document & Vision API (`/v1/documents`)](#6-medical-document--vision-api-v1documents)
7. [System Health Check (`/health`)](#7-system-health-check-health)
8. [Connecting External Hospital EMR / EHR System](#8-connecting-external-hospital-emr--ehr-system)
9. [Multi-Language & Clinical Specialties](#9-multi-language--clinical-specialties)
10. [Client Integration Code Samples](#10-client-integration-code-samples)

---

## 1. Architecture & Server Overview

- **Framework:** FastAPI (Python 3.10+) with SQLAlchemy ORM
- **Default Base URL:** `http://127.0.0.1:8000`
- **Interactive Swagger Documentation:** `http://127.0.0.1:8000/docs`
- **OpenAPI JSON Spec:** `http://127.0.0.1:8000/openapi.json`
- **CORS:** Pre-configured to allow all origins (`*`) for easy React web and mobile client integration.

```
+------------------+         +-------------------------------+         +-----------------------+
|  Client Device   |         |  FastAPI Backend Engine       |         | Hospital EHR / Database|
+------------------+         +-------------------------------+         +-----------------------+
         |                                   |                                     |
         | --- POST /start ----------------> | (Initialize Session + State)        |
         | <-- Greeting Text & Audio URL --- | (Synthesized TTS Audio)             |
         |                                   |                                     |
         | --- POST /turn (Audio / Text) --> | (Sarvam STT -> GPT-4o -> State)     |
         | <-- Next Question & Audio URL --- |                                     |
         |                                   |                                     |
         | --- POST /upload (Prescription) > | (Gemini Vision OCR -> Extract Meds) |
         | <-- Extracted Findings ---------- |                                     |
         |                                   |                                     |
         | --- POST /complete (confirmed) -> | (Extract EHR JSON) ---------------->| POST /patients
         | <-- Final Success Status -------- | <--- 200 OK Record Saved -----------|
```

---

## 2. Environment Configuration (`.env`)

Create or update the `.env` file in the `ai-patient-onboarding/` directory:

```ini
APP_NAME="AI Patient Onboarding"
APP_ENV=development
APP_VERSION=1.0.0

# Database URL
DATABASE_URL="sqlite:///./data/onboarding.db"

# AI Provider API Keys
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"

ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"

GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL="gemini-1.5-flash"

SARVAM_API_KEY="your_sarvam_key"

# External Destination Hospital EHR / Patient API (Optional)
PATIENT_API_BASE_URL="https://your-hospital-emr.com/api/v1"
PATIENT_API_TOKEN="your_secure_bearer_token"
```

---

## 3. Running the Backend Locally

```bash
# Navigate to the backend directory
cd ai-patient-onboarding

# Activate Python Virtual Environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux / macOS:
# source venv/bin/activate

# Install dependencies if not already installed
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 4. Voice Onboarding API (`/v1/voice-onboarding`)

### 4.1 Start Voice Session

Creates a new voice onboarding session, initializes dynamic state, and returns localized assistant greeting with audio.

- **URL:** `POST /v1/voice-onboarding/start`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "patient": {
    "id": "PAT-9842",
    "name": "Arun Kumar",
    "age": 42,
    "gender": "male",
    "abha_id": "91-1234-5678-9012",
    "phone": "+91 98765 43210",
    "insurance_scheme": "PM-JAY",
    "dietary_habits": "Vegetarian"
  },
  "category": {
    "type": "speciality",
    "code": "cardio",
    "name": "Cardiology"
  },
  "language": "en-IN"
}
```

- **Response (`200 OK`):**
```json
{
  "success": true,
  "session_id": "VOICE-78A1BF2C",
  "patient_id": "PAT-9842",
  "category": {
    "type": "speciality",
    "code": "cardio",
    "name": "Cardiology"
  },
  "language": "en-IN",
  "status": "in_progress",
  "stage": "greeting",
  "greeting_text": "Hello Arun Kumar, welcome to CureSelect Cardiology department. What symptoms or discomfort are you experiencing today?",
  "audio_url": "/v1/voice-onboarding/audio/voice_greeting_89bf1a.wav"
}
```

---

### 4.2 Send Voice / Speech Turn

Submits the patient's recorded audio or transcribed speech. The backend runs multi-model Indic speech recognition (Sarvam/Whisper), extracts medical entities, updates conversational state, and generates the next question with audio TTS.

- **URL:** `POST /v1/voice-onboarding/{session_id}/turn`
- **Headers:** `Content-Type: multipart/form-data`
- **Form Data Parameters:**
  - `audio` *(Optional File)*: WebM, WAV, or MP3 recorded audio file from the user's microphone.
  - `text_fallback` *(Optional String)*: Real-time browser speech recognition transcript fallback.

- **Response (`200 OK`):**
```json
{
  "success": true,
  "session_id": "VOICE-78A1BF2C",
  "patient_transcript": "I have had severe chest pain and breathlessness since yesterday evening.",
  "ai_text": "I understand. Does the chest pain radiate to your left arm or jaw, and are you currently taking any blood pressure or heart medications?",
  "stage": "symptoms_inquiry",
  "completed": false,
  "audio_url": "/v1/voice-onboarding/audio/speech_reply_30ef2.wav"
}
```

---

### 4.3 Fetch Synthesized Voice Audio

Streams audio file generated for assistant responses.

- **URL:** `GET /v1/voice-onboarding/audio/{audio_id}`
- **Response:** `audio/wav` or `audio/mpeg` binary stream.

---

### 4.4 Complete & Confirm Session

Extracts complete structured clinical results. Supports a two-step confirmation workflow (review preview -> permanent submission).

- **URL:** `POST /v1/voice-onboarding/{session_id}/complete`
- **Headers:** `Content-Type: application/json`

#### Step A: Request Review Preview (`confirmed: false`)
```json
{
  "confirmed": false
}
```
**Response (`200 OK`):**
```json
{
  "success": true,
  "session_id": "VOICE-78A1BF2C",
  "status": "awaiting_confirmation",
  "result": {
    "patient_id": "PAT-9842",
    "abha_id": "91-1234-5678-9012",
    "phone": "+91 98765 43210",
    "insurance_scheme": "PM-JAY",
    "category": {
      "type": "speciality",
      "code": "cardio",
      "name": "Cardiology"
    },
    "chief_complaint": "Acute onset retrosternal chest pain and dyspnea",
    "symptoms": [
      {
        "name": "Chest tightness",
        "duration": "1 day",
        "severity": "Moderate to Severe",
        "description": "Retrosternal pressure aggravated by exertion"
      }
    ],
    "medical_history": ["Hypertension (5 years)"],
    "medications": ["Amlodipine 5mg OD"],
    "allergies": ["Penicillin"],
    "dietary_habits": "Vegetarian",
    "additional_information": "Non-smoker",
    "language": "en-IN",
    "onboarding_completed": true
  },
  "message": "Please review the collected information and confirm by voice or tap."
}
```

#### Step B: Confirm & Submit to EHR (`confirmed: true`)
```json
{
  "confirmed": true
}
```
**Response (`200 OK`):**
```json
{
  "success": true,
  "session_id": "VOICE-78A1BF2C",
  "status": "submitted_and_cleaned",
  "result": { ... },
  "message": "Voice onboarding successfully saved to patient record."
}
```

---

## 5. Text Onboarding API (`/v1/onboarding`)

For text chat interfaces or non-voice kiosks.

### 5.1 Start Text Session
- **URL:** `POST /v1/onboarding/start`
- **Body:** Same as Voice Start (`patient`, `category`, `language`).
- **Response:** Returns `session_id`, `greeting_message`, and initial state.

### 5.2 Send Text Message
- **URL:** `POST /v1/onboarding/{session_id}/message`
- **Body:**
```json
{
  "message": "I've had knee pain for 3 days after a run."
}
```
- **Response:**
```json
{
  "success": true,
  "session_id": "ONB-84A12B1C",
  "stage": "symptoms_inquiry",
  "message": "Is the knee swollen or locking when you walk?",
  "status": "in_progress"
}
```

### 5.3 Complete Text Onboarding
- **URL:** `POST /v1/onboarding/{session_id}/complete`
- **Body:** `{"confirmed": true}`

---

## 6. Medical Document & Vision API (`/v1/documents`)

Uploads patient medical documents (prescriptions, discharge summaries, lab reports) to extract medications, allergies, and diagnoses using Gemini 1.5 Flash Vision, automatically injecting findings into the active session state.

- **URL:** `POST /v1/documents/{session_id}/upload`
- **Headers:** `Content-Type: multipart/form-data`
- **Form Field:** `file` *(Binary image or PDF file)*

- **Response (`200 OK`):**
```json
{
  "success": true,
  "session_id": "VOICE-78A1BF2C",
  "document_type": "prescription",
  "summary": "Prescription from Cardiologist dated 15-Aug-2024",
  "findings": ["Ejection Fraction 55%", "Normal Sinus Rhythm"],
  "medications_found": ["Atorvastatin 20mg", "Metoprolol 25mg"],
  "allergies_found": ["Sulfa drugs"],
  "message": "Medical document analyzed and integrated into onboarding session."
}
```

---

## 7. System Health Check (`/health`)

- **URL:** `GET /health`
- **Response (`200 OK`):**
```json
{
  "success": true,
  "service": "AI Patient Onboarding",
  "status": "healthy",
  "models": {
    "speech": "Sarvam AI (Indian Languages) / OpenAI Whisper",
    "conversation": "OpenAI GPT-4o-mini",
    "validation": "Claude 3.5 Sonnet",
    "vision_documents": "Gemini 1.5 Flash"
  }
}
```

---

## 8. Connecting External Hospital EMR / EHR System

When onboarding is finalized, the backend invokes `PatientSubmissionService` located at:
`app/services/patient_submission_service.py`

### Customizing the Destination Forwarding:
```python
import httpx
from app.config import PATIENT_API_BASE_URL, PATIENT_API_TOKEN

class PatientSubmissionService:
    async def submit(self, result: dict) -> dict:
        if not PATIENT_API_BASE_URL:
            # Local fallback mock
            return {
                "success": True,
                "message": "Patient data saved locally.",
                "patient_id": result.get("patient_id"),
            }

        # Forward JSON payload to hospital central server
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = {
                "Authorization": f"Bearer {PATIENT_API_TOKEN}",
                "Content-Type": "application/json",
            }
            response = await client.post(
                f"{PATIENT_API_BASE_URL}/patients/{result.get('patient_id')}/onboarding",
                json=result,
                headers=headers,
            )

            if response.status_code in [200, 201]:
                return {"success": True, "data": response.json()}
            
            return {
                "success": False,
                "error": f"Hospital API error: {response.text}",
            }
```

---

## 9. Multi-Language & Clinical Specialties

### Supported Languages
| Code | Language | Speech Engine |
|---|---|---|
| `en-IN` / `en` | English (Indian accent) | Sarvam / OpenAI Whisper |
| `hi-IN` / `hi` | Hindi (हिन्दी) | Sarvam Bulbul / Whisper |
| `ta-IN` / `ta` | Tamil (தமிழ்) | Sarvam Bulbul / Whisper |
| `te-IN` / `te` | Telugu (తెలుగు) | Sarvam Bulbul / Whisper |
| `kn-IN` / `kn` | Kannada (ಕನ್ನಡ) | Sarvam Bulbul / Whisper |
| `bn-IN` / `bn` | Bengali (বাংলা) | Sarvam Bulbul / Whisper |
| `ml-IN` / `ml` | Malayalam (മലയാളം) | Sarvam Bulbul / Whisper |
| `mr-IN` / `mr` | Marathi (मराठी) | Sarvam Bulbul / Whisper |
| `gu-IN` / `gu` | Gujarati (ગુજરાતી) | Sarvam Bulbul / Whisper |

### Clinical Specialties Supported
- `general_medicine` - General Medicine / Primary Care
- `cardio` - Cardiology
- `ortho` - Orthopedics
- `peds` - Pediatrics
- `derma` - Dermatology
- `neuro` - Neurology
- `gastro` - Gastroenterology
- `ent` - ENT / Otorhinolaryngology
- `gyn` - Obstetrics & Gynecology

---

## 10. Client Integration Code Samples

### 10.1 Python Client (`httpx`)
```python
import httpx
import asyncio

API_BASE = "http://127.0.0.1:8000"

async def main():
    async with httpx.AsyncClient() as client:
        # 1. Start Session
        start_res = await client.post(f"{API_BASE}/v1/voice-onboarding/start", json={
            "patient": {"id": "P-1001", "name": "Deepak Sharma", "age": 45, "gender": "male"},
            "category": {"type": "speciality", "code": "cardio", "name": "Cardiology"},
            "language": "hi-IN"
        })
        session = start_res.json()
        session_id = session["session_id"]
        print(f"Session started: {session_id}")
        print(f"Greeting: {session['greeting_text']}")

        # 2. Send Turn
        turn_res = await client.post(
            f"{API_BASE}/v1/voice-onboarding/{session_id}/turn",
            data={"text_fallback": "मुझे सीने में भारीपन महसूस हो रहा है"}
        )
        turn_data = turn_res.json()
        print(f"AI Response: {turn_data['ai_text']}")

        # 3. Finalize & Submit
        complete_res = await client.post(
            f"{API_BASE}/v1/voice-onboarding/{session_id}/complete",
            json={"confirmed": True}
        )
        print(f"EHR Saved: {complete_res.json()}")

if __name__ == "__main__":
    asyncio.run(main())
```

### 10.2 JavaScript / TypeScript (`fetch`)
```typescript
const API_BASE = "http://127.0.0.1:8000";

// Start voice onboarding
export async function startVoiceOnboarding(patient: any, category: any, language = "en-IN") {
  const res = await fetch(`${API_BASE}/v1/voice-onboarding/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patient, category, language })
  });
  return res.json();
}

// Send audio turn
export async function sendVoiceTurn(sessionId: string, audioBlob?: Blob, textFallback?: string) {
  const formData = new FormData();
  if (audioBlob) formData.append("audio", audioBlob, "speech.webm");
  if (textFallback) formData.append("text_fallback", textFallback);

  const res = await fetch(`${API_BASE}/v1/voice-onboarding/${sessionId}/turn`, {
    method: "POST",
    body: formData
  });
  return res.json();
}

// Upload medical report
export async function uploadPrescription(sessionId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/v1/documents/${sessionId}/upload`, {
    method: "POST",
    body: formData
  });
  return res.json();
}

// Complete onboarding
export async function completeOnboarding(sessionId: string, confirmed: boolean) {
  const res = await fetch(`${API_BASE}/v1/voice-onboarding/${sessionId}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmed })
  });
  return res.json();
}
```

### 10.3 cURL Commands

#### Start Session:
```bash
curl -X POST "http://127.0.0.1:8000/v1/voice-onboarding/start" \
  -H "Content-Type: application/json" \
  -d '{
    "patient": {"id": "P-101", "name": "Arun Kumar", "age": 40, "gender": "male"},
    "category": {"type": "general", "code": "general_medicine", "name": "General Medicine"},
    "language": "en-IN"
  }'
```

#### Send Voice Turn (with text fallback):
```bash
curl -X POST "http://127.0.0.1:8000/v1/voice-onboarding/VOICE-XXXXX/turn" \
  -F "text_fallback=I have had high fever and sore throat since yesterday"
```

#### Upload Prescription:
```bash
curl -X POST "http://127.0.0.1:8000/v1/documents/VOICE-XXXXX/upload" \
  -F "file=@/path/to/prescription.pdf"
```

#### Confirm & Submit:
```bash
curl -X POST "http://127.0.0.1:8000/v1/voice-onboarding/VOICE-XXXXX/complete" \
  -H "Content-Type: application/json" \
  -d '{"confirmed": true}'
```
