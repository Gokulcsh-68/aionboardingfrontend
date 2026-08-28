import React, { useState } from "react";
import { X, Upload, FileText, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { uploadMedicalDocument } from "../services/api";
import { DocumentExtractionResult } from "../types/onboarding";

interface DocumentUploadModalProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onExtractionComplete: (result: DocumentExtractionResult) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  sessionId,
  isOpen,
  onClose,
  onExtractionComplete,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentExtractionResult | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setError(null);
      const res = await uploadMedicalDocument(sessionId, selectedFile);
      setResult(res);
      onExtractionComplete(res);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Document analysis failed";
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50,
      padding: "20px",
    }}>
      <div className="glass-panel" style={{
        width: "100%",
        maxWidth: "520px",
        padding: "28px",
        background: "#0f172a",
        position: "relative",
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <FileText size={20} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "700" }}>Upload Medical Document</h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
              Gemini Vision analyzes prescriptions, previous lab tests & reports
            </p>
          </div>
        </div>

        {/* Upload Dropzone */}
        <div style={{
          margin: "20px 0",
          padding: "24px",
          border: "2px dashed rgba(255, 255, 255, 0.15)",
          borderRadius: "16px",
          textAlign: "center",
          background: "rgba(255, 255, 255, 0.02)",
        }}>
          <Upload size={32} color="#60a5fa" style={{ marginBottom: "12px" }} />
          <p style={{ fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}>
            {selectedFile ? selectedFile.name : "Select or drop medical file"}
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>
            Supports PDF, PNG, JPG, or Scanned Doctor Prescription
          </p>
          <label style={{
            display: "inline-block",
            padding: "8px 18px",
            borderRadius: "999px",
            background: "rgba(255, 255, 255, 0.08)",
            color: "var(--text-primary)",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}>
            Browse File
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#f87171",
            fontSize: "13px",
            marginBottom: "16px",
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Extracted Findings Preview */}
        {result && (
          <div style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "14px",
            padding: "16px",
            marginBottom: "20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#34d399", fontWeight: "600", fontSize: "14px", marginBottom: "8px" }}>
              <CheckCircle size={16} />
              <span>Extracted by Gemini Vision:</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "10px" }}>
              {result.summary}
            </p>
            {result.findings && result.findings.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {result.findings.map((f, i) => (
                  <span key={i} style={{
                    fontSize: "12px",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: "rgba(255, 255, 255, 0.08)",
                    color: "#f8fafc",
                  }}>
                    {f.test}: <strong>{f.value} {f.unit || ""}</strong> ({f.interpretation || "Observed"})
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isUploading}
          >
            Close
          </button>
          {!result ? (
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="btn-primary"
              style={{ opacity: !selectedFile || isUploading ? 0.6 : 1 }}
            >
              <Sparkles size={16} />
              {isUploading ? "Analyzing with Gemini..." : "Extract with Gemini"}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="btn-primary"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
