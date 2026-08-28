import React, { useState, useEffect } from 'react';
import { User, HeartPulse, Languages, Shield, Phone, Sparkles, ArrowRight, Mic, MessageSquare } from 'lucide-react';

const CLINICAL_SPECIALTIES = [
  { code: 'general_medicine', name: 'General Medicine / Primary Care', type: 'general', icon: '🩺' },
  { code: 'cardio', name: 'Cardiology (Heart & Circulation)', type: 'speciality', icon: '❤️' },
  { code: 'ortho', name: 'Orthopedics (Bones & Joints)', type: 'speciality', icon: '🦴' },
  { code: 'peds', name: 'Pediatrics (Child Health)', type: 'speciality', icon: '👶' },
  { code: 'derma', name: 'Dermatology (Skin & Hair)', type: 'speciality', icon: '🩺' },
  { code: 'neuro', name: 'Neurology (Brain & Nerves)', type: 'speciality', icon: '🧠' },
  { code: 'gastro', name: 'Gastroenterology (Stomach & Digestive)', type: 'speciality', icon: '🧪' },
  { code: 'ent', name: 'ENT (Ear, Nose, Throat)', type: 'speciality', icon: '👂' },
  { code: 'gyn', name: 'Obstetrics & Gynecology', type: 'speciality', icon: '🌸' },
];

const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', name: 'English (India)', native: 'English' },
  { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te-IN', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'bn-IN', name: 'Bengali', native: 'বাংলা' },
  { code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'mr-IN', name: 'Marathi', native: 'मराठी' },
  { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી' },
];

export default function PatientSetupForm({ onStartSession, isLoading }) {
  const [patient, setPatient] = useState({
    id: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
    name: 'Arun Kumar',
    first_name: 'Arun',
    last_name: 'Kumar',
    age: 42,
    gender: 'male',
    abha_id: '91-1234-5678-9012',
    phone: '+91 98765 43210',
    insurance_scheme: 'PM-JAY',
    dietary_habits: 'Vegetarian',
  });

  const [category, setCategory] = useState(CLINICAL_SPECIALTIES[1]); // Default Cardiology
  const [language, setLanguage] = useState('en-IN');
  const [mode, setMode] = useState('voice'); // 'voice' or 'text'

  // WebView Data Injection Listener (URL query parameters & postMessage bridge)
  useEffect(() => {
    // 1. URL Query Parameter Injection
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const name = params.get('name') || params.get('patient_name');
      const age = params.get('age');
      const gender = params.get('gender');
      const abha_id = params.get('abha_id') || params.get('abha');
      const phone = params.get('phone') || params.get('mobile');
      const specCode = params.get('category') || params.get('specialty');
      const langCode = params.get('language') || params.get('lang');
      const modeParam = params.get('mode');
      const autoStart = params.get('auto_start') === 'true' || params.get('autostart') === '1';

      if (name || age || gender || phone || specCode || langCode) {
        const parts = (name || 'Patient').trim().split(' ');
        const injectedPatient = {
          id: params.get('id') || params.get('patient_id') || `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
          name: name || 'Arun Kumar',
          first_name: parts[0] || name || 'Arun',
          last_name: parts.slice(1).join(' ') || '',
          age: parseInt(age) || 42,
          gender: gender || 'male',
          abha_id: abha_id || '91-1234-5678-9012',
          phone: phone || '+91 98765 43210',
          insurance_scheme: params.get('insurance') || 'PM-JAY',
          dietary_habits: params.get('diet') || 'Vegetarian',
        };

        setPatient(injectedPatient);

        let initialCategory = CLINICAL_SPECIALTIES[1];
        if (specCode) {
          const match = CLINICAL_SPECIALTIES.find((s) => s.code === specCode || s.name.toLowerCase().includes(specCode.toLowerCase()));
          if (match) {
            initialCategory = match;
            setCategory(match);
          }
        }

        if (langCode) setLanguage(langCode);
        if (modeParam === 'voice' || modeParam === 'text') setMode(modeParam);

        if (autoStart) {
          onStartSession({
            patient: injectedPatient,
            category: initialCategory,
            language: langCode || 'en-IN',
            mode: modeParam || 'voice',
          });
        }
      }
    }

    // 2. Window postMessage Event Injection
    const handlePostMessage = (event) => {
      if ((event.data?.type === 'INJECT_PATIENT_DATA' || event.data?.type === 'START_ONBOARDING') && event.data.patient) {
        const pData = event.data.patient;
        const parts = (pData.name || '').trim().split(' ');
        const injectedPatient = {
          id: pData.id || `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
          name: pData.name || 'Arun Kumar',
          first_name: pData.first_name || parts[0] || 'Arun',
          last_name: pData.last_name || parts.slice(1).join(' ') || '',
          age: parseInt(pData.age) || 42,
          gender: pData.gender || 'male',
          abha_id: pData.abha_id || '91-1234-5678-9012',
          phone: pData.phone || '+91 98765 43210',
          insurance_scheme: pData.insurance_scheme || 'PM-JAY',
          dietary_habits: pData.dietary_habits || 'Vegetarian',
        };
        setPatient(injectedPatient);

        let selCat = category;
        if (event.data.category) {
          const match = CLINICAL_SPECIALTIES.find((s) => s.code === event.data.category?.code || s.code === event.data.category);
          if (match) {
            selCat = match;
            setCategory(match);
          }
        }

        const selLang = event.data.language || language;
        const selMode = event.data.mode || mode;

        if (event.data.language) setLanguage(event.data.language);
        if (event.data.mode) setMode(event.data.mode);

        if (event.data.autoStart || event.data.type === 'START_ONBOARDING') {
          onStartSession({ patient: injectedPatient, category: selCat, language: selLang, mode: selMode });
        }
      }
    };

    window.addEventListener('message', handlePostMessage);
    return () => window.removeEventListener('message', handlePostMessage);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onStartSession({ patient, category, language, mode });
  };

  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop decor */}
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Clinical Intake Workflow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Start Patient Onboarding Session
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Provide basic patient demographics and choose clinical department to launch the AI diagnostic assistant.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mode selector: Voice vs Text */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Onboarding Interaction Mode
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode('voice')}
                className={`p-4 rounded-xl border flex items-center justify-center space-x-3 transition-all ${
                  mode === 'voice'
                    ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 border-cyan-500/80 text-cyan-300 ring-2 ring-cyan-500/30'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${mode === 'voice' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                  <Mic className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm text-slate-100">Voice Assistant</div>
                  <div className="text-xs text-slate-400">Indic Speech-to-Text & Synthetic TTS</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('text')}
                className={`p-4 rounded-xl border flex items-center justify-center space-x-3 transition-all ${
                  mode === 'text'
                    ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 border-cyan-500/80 text-cyan-300 ring-2 ring-cyan-500/30'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${mode === 'text' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm text-slate-100">Text Chat Kiosk</div>
                  <div className="text-xs text-slate-400">Interactive conversational text intake</div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 1: Patient Demographics */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-cyan-400 flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Patient Demographics & Insurance</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Patient Name</label>
                <input
                  type="text"
                  required
                  value={patient.name}
                  onChange={(e) => {
                    const fullName = e.target.value;
                    const parts = fullName.trim().split(' ');
                    const fName = parts[0] || fullName;
                    const lName = parts.slice(1).join(' ') || '';
                    setPatient({ ...patient, name: fullName, first_name: fName, last_name: lName });
                  }}
                  className="w-full glass-input px-3 py-2 rounded-lg text-sm"
                  placeholder="e.g. Arun Kumar"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Age</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="120"
                  value={patient.age}
                  onChange={(e) => setPatient({ ...patient, age: parseInt(e.target.value) || '' })}
                  className="w-full glass-input px-3 py-2 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Gender</label>
                <select
                  value={patient.gender}
                  onChange={(e) => setPatient({ ...patient, gender: e.target.value })}
                  className="w-full glass-input px-3 py-2 rounded-lg text-sm"
                >
                  <option value="male" className="bg-slate-900 text-slate-100">Male</option>
                  <option value="female" className="bg-slate-900 text-slate-100">Female</option>
                  <option value="other" className="bg-slate-900 text-slate-100">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">ABHA Health ID</label>
                <input
                  type="text"
                  value={patient.abha_id}
                  onChange={(e) => setPatient({ ...patient, abha_id: e.target.value })}
                  className="w-full glass-input px-3 py-2 rounded-lg text-sm font-mono"
                  placeholder="91-XXXX-XXXX-XXXX"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Mobile Phone</label>
                <input
                  type="text"
                  value={patient.phone}
                  onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
                  className="w-full glass-input px-3 py-2 rounded-lg text-sm"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Insurance Scheme</label>
                <input
                  type="text"
                  value={patient.insurance_scheme}
                  onChange={(e) => setPatient({ ...patient, insurance_scheme: e.target.value })}
                  className="w-full glass-input px-3 py-2 rounded-lg text-sm"
                  placeholder="PM-JAY / Private"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Specialty */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
              <HeartPulse className="h-4 w-4 text-rose-400" />
              <span>Select Clinical Specialty / Department</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CLINICAL_SPECIALTIES.map((spec) => {
                const isSelected = category.code === spec.code;
                return (
                  <button
                    key={spec.code}
                    type="button"
                    onClick={() => setCategory(spec)}
                    className={`p-3 rounded-xl border text-left flex items-center space-x-3 transition-all ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-200 ring-1 ring-cyan-500/40 shadow-lg shadow-cyan-950/50'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <span className="text-xl">{spec.icon}</span>
                    <div>
                      <div className="text-xs font-bold">{spec.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Code: {spec.code}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Language Preference */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
              <Languages className="h-4 w-4 text-cyan-400" />
              <span>Primary Consultation Language</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    className={`px-3 py-2 rounded-lg border text-left flex items-center justify-between text-xs transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold'
                        : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span>{lang.name}</span>
                    <span className="text-[10px] text-slate-400 font-serif">{lang.native}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 shadow-xl shadow-cyan-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <span>Initializing Session...</span>
              ) : (
                <>
                  <span>Begin AI Onboarding Assistant ({mode.toUpperCase()})</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
