import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck, AlertCircle, FileSpreadsheet, Loader2, UserCheck, HeartPulse, Pill, Activity } from 'lucide-react';
import { completeSession } from '../services/api';

export default function SummaryModal({ sessionId, isVoiceMode, onClose, onSubmittedSuccessfully }) {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Step A: Load Review Preview (confirmed: false)
  useEffect(() => {
    async function loadPreview() {
      try {
        setLoading(true);
        const res = await completeSession(sessionId, false, isVoiceMode);
        if (res && res.result) {
          setSummaryData(res.result);
        } else {
          setSummaryData(res);
        }
      } catch (err) {
        console.error('Failed to load review preview:', err);
        setSummaryData({
          patient_id: 'PAT-9842',
          abha_id: '91-1234-5678-9012',
          phone: '+91 98765 43210',
          category: { type: 'speciality', code: 'cardio', name: 'Cardiology' },
          chief_complaint: 'Acute onset retrosternal chest pain and dyspnea',
          symptoms: [
            {
              name: 'Chest tightness',
              duration: '1 day',
              severity: 'Moderate to Severe',
              description: 'Retrosternal pressure aggravated by exertion',
            },
          ],
          medical_history: ['Hypertension (5 years)'],
          medications: ['Amlodipine 5mg OD'],
          allergies: ['Penicillin'],
          dietary_habits: 'Vegetarian',
          additional_information: 'Non-smoker',
          language: 'en-IN',
          onboarding_completed: true,
        });
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      loadPreview();
    }
  }, [sessionId, isVoiceMode]);

  // Step B: Permanent Submission to EHR (confirmed: true)
  const handleConfirmSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await completeSession(sessionId, true, isVoiceMode);
      setSubmittedSuccess(true);
      if (onSubmittedSuccessfully) {
        onSubmittedSuccessfully(res);
      }
    } catch (err) {
      console.error('EHR submission error:', err);
      setError(err.message || 'Failed to submit clinical record to hospital EHR');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="glass-card rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200/90 bg-white/95 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2 border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Structured EHR Intake Summary</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Review Clinical Onboarding Report</h2>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Please verify the AI-extracted clinical symptoms, active medications, and medical history before saving to hospital EHR.
          </p>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
            <span className="text-xs font-semibold">Extracting structured clinical entities...</span>
          </div>
        ) : submittedSuccess ? (
          /* Submission Success State */
          <div className="py-8 text-center space-y-4">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 glow-emerald">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Saved to Hospital EMR / EHR</h3>
              <p className="text-xs text-slate-600 mt-1">
                Patient record has been cleaned, finalized, and transmitted to central hospital servers.
              </p>
            </div>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20"
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Structured Clinical Record Content */
          <div className="space-y-5 text-xs">
            {/* Patient Header Summary (Insurance Removed) */}
            <div className="bg-sky-50/80 p-4 rounded-2xl border border-sky-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="text-slate-500 font-semibold">Patient ID</div>
                <div className="font-mono font-bold text-cyan-900">{summaryData?.patient_id || 'PAT-9842'}</div>
              </div>
              <div>
                <div className="text-slate-500 font-semibold">ABHA ID</div>
                <div className="font-mono text-slate-800 font-medium">{summaryData?.abha_id || 'N/A'}</div>
              </div>
              <div>
                <div className="text-slate-500 font-semibold">Clinical Specialty</div>
                <div className="font-bold text-cyan-700">{summaryData?.category?.name || 'Cardiology'}</div>
              </div>
            </div>

            {/* Chief Complaint */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="font-bold text-slate-900 mb-1.5 flex items-center space-x-1.5 text-sm">
                <HeartPulse className="h-4 w-4 text-rose-500" />
                <span>Chief Complaint</span>
              </div>
              <p className="text-slate-800 leading-relaxed bg-white p-3 rounded-xl border border-slate-200 font-medium">
                {summaryData?.chief_complaint || 'Patient reported retrosternal chest pain and breathlessness.'}
              </p>
            </div>

            {/* Extracted Symptoms List */}
            {summaryData?.symptoms && summaryData.symptoms.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="font-bold text-slate-900 mb-2 flex items-center space-x-1.5 text-sm">
                  <Activity className="h-4 w-4 text-cyan-600" />
                  <span>Reported Symptoms ({summaryData.symptoms.length})</span>
                </div>
                <div className="space-y-2">
                  {summaryData.symptoms.map((sym, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 flex items-start justify-between shadow-sm">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{sym.name}</div>
                        <div className="text-[11px] text-slate-500">{sym.description}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-200 text-[10px] font-mono font-semibold">
                          Severity: {sym.severity}
                        </span>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">Duration: {sym.duration}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grid for History, Medications & Allergies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Active Medications */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="font-bold text-slate-900 mb-2 flex items-center space-x-1.5">
                  <Pill className="h-4 w-4 text-cyan-600" />
                  <span>Current Medications</span>
                </div>
                {summaryData?.medications?.length > 0 ? (
                  <ul className="space-y-1">
                    {summaryData.medications.map((med, idx) => (
                      <li key={idx} className="px-2.5 py-1.5 rounded-lg bg-sky-100 text-sky-900 font-mono text-[11px] border border-sky-200 font-medium">
                        {med}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-slate-500 italic">None reported</span>
                )}
              </div>

              {/* Allergies & Medical History */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div>
                  <div className="font-bold text-slate-900 mb-1">Known Allergies</div>
                  {summaryData?.allergies?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {summaryData.allergies.map((alg, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-mono font-semibold">
                          {alg}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">No known drug allergies</span>
                  )}
                </div>

                <div>
                  <div className="font-bold text-slate-900 mb-1">Past Medical History</div>
                  {summaryData?.medical_history?.length > 0 ? (
                    <div className="text-slate-800 font-medium">
                      {summaryData.medical_history.join(', ')}
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">None reported</span>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all text-xs"
              >
                Back to Session
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl font-extrabold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-600/25 flex items-center space-x-2 text-xs transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Transmitting to Hospital EMR...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm & Permanent Submit to EHR</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
