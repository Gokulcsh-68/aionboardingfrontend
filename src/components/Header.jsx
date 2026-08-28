import React from 'react';
import { Activity, Stethoscope, ShieldCheck, Sparkles, Cpu, Radio } from 'lucide-react';

export default function Header({ healthStatus, activeSession, onResetSession }) {
  const isHealthy = healthStatus?.status === 'healthy';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-md shadow-cyan-500/20">
            <div className="h-full w-full bg-white rounded-[10px] flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-cyan-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 bg-clip-text text-transparent">
                CureSelect AI
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                Patient Onboarding
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Multilingual Clinical Assistant & EHR Intake</p>
          </div>
        </div>

        {/* Center: Active AI Models Bar */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-xs text-slate-700 font-medium shadow-inner">
          <div className="flex items-center space-x-1.5 text-cyan-700 font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
            <span>AI Suite:</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono text-[11px]">Sarvam Indic AI</span>
          <span className="text-slate-400">•</span>
          <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono text-[11px]">GPT-4o Clinical</span>
          <span className="text-slate-400">•</span>
          <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono text-[11px]">Gemini Vision OCR</span>
        </div>

        {/* Right side: Session status & Health indicator */}
        <div className="flex items-center space-x-3">
          {activeSession && (
            <div className="flex items-center space-x-2 bg-sky-50 border border-sky-200 px-3 py-1 rounded-xl shadow-sm">
              <Radio className="h-3.5 w-3.5 text-cyan-600 animate-pulse" />
              <span className="text-xs font-mono text-cyan-900 font-semibold">
                {activeSession.session_id}
              </span>
              <button
                onClick={onResetSession}
                className="text-[11px] font-bold text-sky-700 hover:text-sky-900 underline ml-1"
                title="Start a new session"
              >
                New Session
              </button>
            </div>
          )}

          {/* Health Status Indicator */}
          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${
              isHealthy
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{isHealthy ? 'Backend Live' : 'Connecting...'}</span>
          </div>
        </div>

      </div>
    </header>
  );
}
