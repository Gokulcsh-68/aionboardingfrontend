// High-Definition Neural Speech Synthesizer with Authentic Local Indian Accent Support

let cachedVoices: SpeechSynthesisVoice[] = [];
let customSelectedVoiceURI: string | null = null;
let customRate: number = 0.94;
let customPitch: number = 1.0;

export function initVoiceEngine() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    cachedVoices = window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
    };
  }
}

// Immediately warm up voices
initVoiceEngine();


// Indian voice priority keywords & specific local names
const INDIAN_VOICE_KEYWORDS = [
  "neerja", "prabhat", "heera", "ravi", "swara", "madhur", "kalpana", "hemant",
  "valluvar", "pallavi", "mohan", "gagan", "sapna", "rishi", "veena", "lekha",
  "kavya", "vani", "meera", "shruti", "ananya", "india", "indian", "hindi",
  "tamil", "telugu", "kannada", "bengali", "marathi", "gujarati"
];

export function getAvailableIndianVoices(languageCode?: string): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return [];

  if (!languageCode) {
    return voices.filter((v) => {
      const vLang = v.lang.toLowerCase().replace("_", "-");
      const vName = v.name.toLowerCase();
      return (
        vLang.includes("in") ||
        INDIAN_VOICE_KEYWORDS.some((kw) => vName.includes(kw) || vLang.includes(kw))
      );
    });
  }

  const targetLang = languageCode.toLowerCase().replace("_", "-");
  const targetPrefix = targetLang.split("-")[0];

  const matched = voices.filter((v) => {
    const vLang = v.lang.toLowerCase().replace("_", "-");
    const vName = v.name.toLowerCase();
    return (
      vLang === targetLang ||
      vLang.startsWith(targetPrefix) ||
      (targetLang === "en-in" && (vLang.includes("en") || vName.includes("india")))
    );
  });

  // Sort matched voices so Indian accents and natural neural voices appear first
  return matched.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const aLang = a.lang.toLowerCase().replace("_", "-");
    const bLang = b.lang.toLowerCase().replace("_", "-");

    const aScore =
      (aLang.includes("in") ? 50 : 0) +
      (INDIAN_VOICE_KEYWORDS.some((k) => aName.includes(k)) ? 40 : 0) +
      (aName.includes("natural") || aName.includes("online") ? 30 : 0) +
      (aName.includes("neural") ? 20 : 0);

    const bScore =
      (bLang.includes("in") ? 50 : 0) +
      (INDIAN_VOICE_KEYWORDS.some((k) => bName.includes(k)) ? 40 : 0) +
      (bName.includes("natural") || bName.includes("online") ? 30 : 0) +
      (bName.includes("neural") ? 20 : 0);

    return bScore - aScore;
  });
}

export function setSelectedVoiceURI(uri: string | null) {
  customSelectedVoiceURI = uri;
}

export function getSelectedVoiceURI(): string | null {
  return customSelectedVoiceURI;
}

export function setVoiceRate(rate: number) {
  customRate = Math.max(0.6, Math.min(1.5, rate));
}

export function getVoiceRate(): number {
  return customRate;
}

export function setVoicePitch(pitch: number) {
  customPitch = Math.max(0.7, Math.min(1.4, pitch));
}

export function getVoicePitch(): number {
  return customPitch;
}

export function getBestIndianVoice(languageCode: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;

  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // If user selected a custom voice URI, respect it
  if (customSelectedVoiceURI) {
    const chosen = voices.find((v) => v.voiceURI === customSelectedVoiceURI);
    if (chosen) return chosen;
  }

  const targetLang = languageCode.toLowerCase().replace("_", "-");
  const targetPrefix = targetLang.split("-")[0]; // "en", "ta", "hi", "te", "kn"

  let bestVoice: SpeechSynthesisVoice | null = null;
  let bestScore = -100;

  for (const voice of voices) {
    const vLang = voice.lang.toLowerCase().replace("_", "-");
    const vName = voice.name.toLowerCase();
    let score = 0;

    const isExactLang = vLang === targetLang || (targetLang === "en-in" && (vLang === "en-in" || vLang.includes("en_in")));
    const isPrefixLang = vLang.startsWith(targetPrefix);

    if (isExactLang) {
      score += 50;
    } else if (isPrefixLang) {
      score += 20;
    } else if (targetLang === "en-in" && vLang.startsWith("en")) {
      // English requested, check if voice has Indian name
      score += 5;
    } else {
      continue; // Language doesn't match at all
    }

    // Check for natural / neural quality
    if (vName.includes("natural") || vName.includes("online")) {
      score += 30;
    }
    if (vName.includes("neural")) {
      score += 25;
    }
    if (vName.includes("google")) {
      score += 15;
    }

    // Check for Indian regional identifiers & names
    const hasIndianKeyword = INDIAN_VOICE_KEYWORDS.some((kw) => vName.includes(kw) || vLang.includes("in"));
    if (hasIndianKeyword) {
      score += 40;
    }

    // If English (India) is requested, heavily prioritize Indian English voices
    if (targetLang === "en-in") {
      if (vLang.includes("en-in") || vLang.includes("en_in") || vName.includes("india") || vName.includes("neerja") || vName.includes("prabhat") || vName.includes("heera") || vName.includes("ravi")) {
        score += 60;
      }
      // Penalize US/UK voices if an Indian voice can be found
      if ((vLang.includes("en-us") || vLang.includes("en-gb")) && !hasIndianKeyword) {
        score -= 40;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    }
  }

  return bestVoice;
}

// Clean and normalize text for smooth natural Indian pronunciation
export function normalizeTextForSpeech(text: string): string {
  return text
    .replace(/[()#*_\-–—]/g, " ")
    .replace(/\bBP\b/gi, "Blood Pressure")
    .replace(/\bDr\b\.?/gi, "Doctor")
    .replace(/\bmg\b/gi, "milligrams")
    .replace(/\bkg\b/gi, "kilograms")
    .replace(/\bhrs\b/gi, "hours")
    .replace(/\bmin\b/gi, "minutes")
    .replace(/\s+/g, " ")
    .trim();
}

export function playNeuralIndianSpeech(
  text: string,
  languageCode: string = "ta-IN",
  onEnd?: () => void
): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return false;
  }

  // Cancel any active speech synthesis
  window.speechSynthesis.cancel();

  const cleanText = normalizeTextForSpeech(text);
  if (!cleanText) return false;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = languageCode;

  // Optimized rate & pitch for natural Indian conversational healthcare tone
  utterance.rate = customRate || 0.94;
  utterance.pitch = customPitch || 1.0;

  // Select the best authentic local Indian voice
  const preferredVoice = getBestIndianVoice(languageCode);
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  let finished = false;
  const finishOnce = () => {
    if (!finished) {
      finished = true;
      if (onEnd) onEnd();
    }
  };

  utterance.onend = finishOnce;
  utterance.onerror = (e) => {
    console.warn("SpeechSynthesis error:", e);
    finishOnce();
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopNeuralSpeech() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function testIndianAccentSample(languageCode: string = "en-IN", onEnd?: () => void): boolean {
  const samples: Record<string, string> = {
    "en-IN": "Hello. Welcome to CureSelect Healthcare. How can I assist you with your health intake today?",
    "ta-IN": "வணக்கம், CureSelect மருத்துவமனைக்கு நல்வரவு. இன்று தங்களுக்கு ஏற்பட்டுள்ள உடல்நல பாதிப்பு பற்றி கூற முடியுமா?",
    "hi-IN": "नमस्ते, CureSelect अस्पताल में आपका स्वागत है। आज आप किस स्वास्थ्य समस्या के लिए परामर्श लेना चाहते हैं?",
    "te-IN": "నమస్కారం, CureSelect హాస్పిటల్‌కు స్వాగతం. ఈరోజు మీకున్న ఆరోగ్య సమస్య గురించి చెప్పగలరా?",
    "kn-IN": "ನಮಸ್ಕಾರ, CureSelect ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ. ಇಂದು ನಿಮ್ಮ ಆರೋಗ್ಯದ ತೊಂದರೆ ಬಗ್ಗೆ ತಿಳಿಸಬಹುದೇ?",
  };

  const sample = samples[languageCode] || samples["en-IN"];
  return playNeuralIndianSpeech(sample, languageCode, onEnd);
}


