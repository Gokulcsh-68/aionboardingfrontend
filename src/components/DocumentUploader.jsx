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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="glass-card rounded-3xl max-w-xl w-full p-6 border border-slate-200/90 bg-white/95 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold mb-2 border border-cyan-200">
            <FileText className="h-3.5 w-3.5" />
            <span>Gemini Vision OCR & Medical Extractor</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Upload Medical Document</h3>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Upload doctor's prescription, discharge summary, or lab result image to automatically extract active medications and allergies into this session.
          </p>
        </div>

        {/* Upload Form */}
        {!uploadResult ? (
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-cyan-200 hover:border-cyan-500 rounded-2xl p-6 text-center transition-all bg-sky-50/50">
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
                <div className="h-12 w-12 rounded-full bg-cyan-100 border border-cyan-200 flex items-center justify-center text-cyan-700">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {selectedFile ? selectedFile.name : 'Click or Drag prescription file here'}
                </div>
                <div className="text-xs text-slate-500 font-medium">Supports PNG, JPG, WEBP or PDF (Max 10MB)</div>
              </label>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-2 disabled:opacity-40 transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
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
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center space-x-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold text-sm">Document Analyzed Successfully</div>
                <div>{uploadResult.message}</div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div>
                <span className="text-slate-500 font-semibold">Document Type: </span>
                <span className="text-cyan-900 font-bold capitalize">{uploadResult.document_type || 'Prescription'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Summary: </span>
                <span className="text-slate-800 font-medium">{uploadResult.summary}</span>
              </div>

              {/* Medications Found */}
              {uploadResult.medications_found?.length > 0 && (
                <div>
                  <div className="font-bold text-cyan-800 flex items-center space-x-1.5 mb-1">
                    <Pill className="h-3.5 w-3.5 text-cyan-600" />
                    <span>Medications Extracted:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {uploadResult.medications_found.map((med, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-sky-100 border border-sky-200 text-sky-900 font-mono font-medium">
                        {med}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Allergies Found */}
              {uploadResult.allergies_found?.length > 0 && (
                <div>
                  <div className="font-bold text-rose-800 flex items-center space-x-1.5 mb-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                    <span>Allergies Flagged:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {uploadResult.allergies_found.map((alg, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg bg-rose-100 border border-rose-200 text-rose-800 font-mono font-medium">
                        {alg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Findings */}
              {uploadResult.findings?.length > 0 && (
                <div>
                  <div className="font-bold text-slate-800 flex items-center space-x-1.5 mb-1">
                    <Activity className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Clinical Findings:</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-800 space-y-0.5 pl-1 font-medium">
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
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold text-xs transition-all shadow-md shadow-cyan-600/20"
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
