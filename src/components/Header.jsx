import React from 'react';
import { Activity, Stethoscope, ShieldCheck, Sparkles, Cpu, Radio } from 'lucide-react';

export default function Header({ healthStatus, activeSession, onResetSession }) {
  const isHealthy = healthStatus?.status === 'healthy';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                CureSelect AI
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Patient Onboarding
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Multilingual Clinical Assistant & EHR Intake</p>
          </div>
        </div>

        {/* Center: Active AI Models Bar */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Suite:</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">Sarvam/Whisper</span>
          <span className="text-slate-600">•</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">GPT-4o-mini</span>
          <span className="text-slate-600">•</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">Gemini 1.5 Vision</span>
        </div>

        {/* Right side: Session status & Health indicator */}
        <div className="flex items-center space-x-3">
          {activeSession && (
            <div className="flex items-center space-x-2 bg-slate-900 border border-cyan-500/30 px-3 py-1 rounded-lg">
              <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span className="text-xs font-mono text-cyan-300 font-medium">
                {activeSession.session_id}
              </span>
              <button
                onClick={onResetSession}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-200 underline ml-1"
                title="Start a new session"
              >
                New Session
              </button>
            </div>
          )}

          {/* Health Status Indicator */}
          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${
              isHealthy
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-950/40 text-amber-400 border-amber-500/30'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{isHealthy ? 'Backend Live' : 'Backend Connecting'}</span>
          </div>
        </div>

      </div>
    </header>
  );
}
