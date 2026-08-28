import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, X, Pill, ShieldAlert, Activity } from 'lucide-react';
import { uploadDocument } from '../services/api';

export default function DocumentUploader({ sessionId, onClose, onDocumentUploaded }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !sessionId) return;

    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadDocument(sessionId, selectedFile);
      setUploadResult(result);
      if (onDocumentUploaded) {
        onDocumentUploaded(result);
      }
    } catch (err) {
      console.error('Document upload error:', err);
      setError(err.message || 'Failed to process medical document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-card rounded-2xl max-w-xl w-full p-6 border border-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold mb-2">
            <FileText className="h-3.5 w-3.5" />
            <span>Gemini Vision OCR & Medical Extractor</span>
          </div>
          <h3 className="text-xl font-bold text-slate-100">Upload Medical Document</h3>
          <p className="text-xs text-slate-400 mt-1">
            Upload doctor's prescription, discharge summary, or lab result image to automatically extract active medications and allergies into this session.
          </p>
        </div>

        {/* Upload Form */}
        {!uploadResult ? (
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-6 text-center transition-all bg-slate-900/40">
              <input
                type="file"
                accept="image/*,.pdf"
                id="medical-doc-input"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="medical-doc-input"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="h-12 w-12 rounded-full bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  {selectedFile ? selectedFile.name : 'Click or Drag prescription file here'}
                </div>
                <div className="text-xs text-slate-400">Supports PNG, JPG, WEBP or PDF (Max 10MB)</div>
              </label>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-2 disabled:opacity-40 transition-all"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing with Gemini Vision...</span>
                  </>
                ) : (
                  <span>Analyze Document</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Parsed Findings Results */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-sm">Document Analyzed Successfully</div>
                <div>{uploadResult.message}</div>
              </div>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Document Type: </span>
                <span className="text-cyan-300 font-bold capitalize">{uploadResult.document_type || 'Prescription'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Summary: </span>
                <span className="text-slate-200">{uploadResult.summary}</span>
              </div>

              {/* Medications Found */}
              {uploadResult.medications_found?.length > 0 && (
                <div>
                  <div className="font-semibold text-cyan-400 flex items-center space-x-1.5 mb-1">
                    <Pill className="h-3.5 w-3.5" />
                    <span>Medications Extracted:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {uploadResult.medications_found.map((med, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-mono">
                        {med}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Allergies Found */}
              {uploadResult.allergies_found?.length > 0 && (
                <div>
                  <div className="font-semibold text-rose-400 flex items-center space-x-1.5 mb-1">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Allergies Flagged:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {uploadResult.allergies_found.map((alg, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500/30 text-rose-300 font-mono">
                        {alg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Findings */}
              {uploadResult.findings?.length > 0 && (
                <div>
                  <div className="font-semibold text-slate-300 flex items-center space-x-1.5 mb-1">
                    <Activity className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Clinical Findings:</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-0.5 pl-1">
                    {uploadResult.findings.map((finding, idx) => (
                      <li key={idx}>{finding}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all"
              >
                Done & Continue Onboarding
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
