import React, { useState, useEffect } from 'react';
import { User, Phone, Sparkles, Globe, Stethoscope, ArrowRight, HeartPulse, CheckCircle } from 'lucide-react';

const INDIAN_LANGUAGES = [
  { code: 'ta-IN', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'hi-IN', name: 'हिंदी (Hindi)', flag: '🇮🇳' },
  { code: 'te-IN', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
  { code: 'ml-IN', name: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
  { code: 'bn-IN', name: 'বাংলা (Bengali)', flag: '🇮🇳' },
  { code: 'mr-IN', name: 'मराठी (Marathi)', flag: '🇮🇳' },
  { code: 'gu-IN', name: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
  { code: 'pa-IN', name: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳' },
  { code: 'en-IN', name: 'English (Indian Accent)', flag: '🇮🇳' },
];

export default function PatientSetupForm({ onStartSession, onSubmit, isLoading }) {
  const submitHandler = onStartSession || onSubmit;

  const [formData, setFormData] = useState({
    patient_id: 'PAT-' + Math.floor(1000 + Math.random() * 9000),
    first_name: '',
    last_name: '',
    age: 35,
    gender: 'male',
    abha_id: '',
    phone: '',
    language: 'ta-IN',
    category: {
      type: 'general',
      code: 'general_medicine',
      name: 'General Medicine / Primary Care (Auto-Triage)',
    },
  });

  // WebView & URL Parameter Auto-fill Listener
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const name = params.get('name') || params.get('patient_name');
      const age = params.get('age');
      const gender = params.get('gender');
      const abha_id = params.get('abha_id') || params.get('abha');
      const phone = params.get('phone') || params.get('mobile');
      const langCode = params.get('language') || params.get('lang');
      const autoStart = params.get('auto_start') === 'true' || params.get('autostart') === '1';

      if (name || age || gender || phone || langCode) {
        const parts = (name || 'Patient').trim().split(' ');
        const fn = parts[0] || 'Arun';
        const ln = parts.slice(1).join(' ') || '';

        setFormData((prev) => ({
          ...prev,
          first_name: fn,
          last_name: ln,
          age: age ? parseInt(age) : prev.age,
          gender: gender || prev.gender,
          abha_id: abha_id || prev.abha_id,
          phone: phone || prev.phone,
          language: langCode || prev.language,
        }));

        if (autoStart && fn && typeof submitHandler === 'function') {
          submitHandler({
            patient: {
              id: 'PAT-' + Math.floor(1000 + Math.random() * 9000),
              name: (fn + ' ' + ln).trim(),
              first_name: fn,
              last_name: ln,
              age: age ? parseInt(age) : 35,
              gender: gender || 'male',
              abha_id: abha_id || '',
              phone: phone || '',
            },
            category: { type: 'general', code: 'general_medicine', name: 'General Medicine' },
            language: langCode || 'ta-IN',
            mode: 'voice',
          });
        }
      }
    }

    const handlePostMessage = (event) => {
      if ((event.data?.type === 'INJECT_PATIENT_DATA' || event.data?.type === 'START_ONBOARDING') && event.data.patient) {
        const pData = event.data.patient;
        const parts = (pData.name || '').trim().split(' ');
        const fn = pData.first_name || parts[0] || 'Arun';
        const ln = pData.last_name || parts.slice(1).join(' ') || '';

        setFormData((prev) => ({
          ...prev,
          first_name: fn,
          last_name: ln,
          age: pData.age ? parseInt(pData.age) : prev.age,
          gender: pData.gender || prev.gender,
          abha_id: pData.abha_id || prev.abha_id,
          phone: pData.phone || prev.phone,
          language: event.data.language || prev.language,
        }));

        if ((event.data.autoStart || event.data.type === 'START_ONBOARDING') && typeof submitHandler === 'function') {
          submitHandler({
            patient: {
              id: pData.id || 'PAT-' + Math.floor(1000 + Math.random() * 9000),
              name: (fn + ' ' + ln).trim(),
              first_name: fn,
              last_name: ln,
              age: pData.age ? parseInt(pData.age) : 35,
              gender: pData.gender || 'male',
              abha_id: pData.abha_id || '',
              phone: pData.phone || '',
            },
            category: { type: 'general', code: 'general_medicine', name: 'General Medicine' },
            language: event.data.language || 'ta-IN',
            mode: 'voice',
          });
        }
      }
    };

    window.addEventListener('message', handlePostMessage);
    return () => window.removeEventListener('message', handlePostMessage);
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.first_name.trim()) return;

    if (typeof submitHandler === 'function') {
      submitHandler({
        patient: {
          id: formData.patient_id,
          name: (formData.first_name + ' ' + formData.last_name).trim(),
          first_name: formData.first_name,
          last_name: formData.last_name,
          age: Number(formData.age),
          gender: formData.gender,
          abha_id: formData.abha_id,
          phone: formData.phone,
        },
        category: formData.category,
        language: formData.language,
        mode: 'voice',
      });
    } else {
      console.error('No submit handler function passed to PatientSetupForm');
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-8 px-4">
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xl shadow-sky-500/10 relative overflow-hidden bg-white/90">
        
        {/* Colorful Glow Background Accents */}
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Patient Intake & Triage</h2>
            <p className="text-sm text-slate-600 font-medium">Enter patient details to initialize AI voice onboarding</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {/* AI Auto Triage Banner */}
          <div className="bg-gradient-to-r from-cyan-50 via-sky-50 to-indigo-50 border border-cyan-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <Sparkles className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong className="font-bold text-cyan-900 block mb-0.5">✨ AI Dynamic Specialty Auto-Triage Active</strong>
              No manual department selection required! The AI doctor will automatically classify your symptoms in real-time and assign you to Cardiology, Dermatology, Orthopedics, Neurology, etc.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">First Name *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  placeholder="e.g. Arun"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 rounded-xl text-slate-900 text-sm outline-none font-medium shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                placeholder="e.g. Kumar"
                className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 rounded-xl text-slate-900 text-sm outline-none font-medium shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Age</label>
              <input
                type="number"
                min="1"
                max="120"
                value={formData.age}
                onChange={(e) => handleChange('age', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 rounded-xl text-slate-900 text-sm outline-none font-medium shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 rounded-xl text-slate-900 text-sm outline-none font-medium shadow-sm"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Preferred Spoken Language</label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <select
                value={formData.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 rounded-xl text-slate-900 text-sm outline-none font-medium shadow-sm"
              >
                {INDIAN_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer transform active:scale-98"
          >
            {isLoading ? (
              <span>Initializing AI Voice Engine...</span>
            ) : (
              <>
                <span>Start AI Voice Consultation</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
