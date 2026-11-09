"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Code,
  FileCode,
  Download,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { useAnimationStore } from "@/store/useAnimationStore";
import {
  EXPORT_FORMATS,
  analyzeExportCompatibility,
  exportProjectCode,
} from "@/engine/codeExport";

export default function CodeExportModal({ isOpen, onClose }) {
  const project = useEditorStore((s) => s.project);
  const layers = useEditorStore((s) => s.layers);
  const keyframes = useAnimationStore((s) => s.keyframes);

  const [activeFormat, setActiveFormat] = useState("json");
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState("code"); // 'code' | 'compatibility' | 'instructions'

  // Compatibility Analysis
  const compatibility = useMemo(() => {
    return analyzeExportCompatibility(project, layers, keyframes, activeFormat);
  }, [project, layers, keyframes, activeFormat]);

  // Export Code Generation
  const exportResult = useMemo(() => {
    if (!project) return { code: "", filename: "project.json", mimeType: "text/plain" };
    try {
      return exportProjectCode(project, layers, keyframes, activeFormat);
    } catch (err) {
      return { code: `// Export error: ${err.message}`, filename: "error.txt", mimeType: "text/plain" };
    }
  }, [project, layers, keyframes, activeFormat]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(exportResult.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([exportResult.code], { type: `${exportResult.mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportResult.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge =
    compatibility.status === "compatible"
      ? { label: "Fully Compatible", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 }
      : compatibility.status === "partially_compatible"
      ? { label: "Partially Compatible", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: AlertTriangle }
      : { label: "Unsupported", color: "text-red-400 bg-red-500/10 border-red-500/20", icon: AlertOctagon };

  const StatusIcon = statusBadge.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-surface-200 border border-surface-border rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border bg-surface-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Code Export Studio & Engine
              </h2>
              <p className="text-xs text-zinc-400">
                Generate production-ready code with automated compatibility analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-border transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-surface-200 border-b border-surface-border overflow-x-auto no-scrollbar">
          {EXPORT_FORMATS.map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => {
                setActiveFormat(fmt.id);
                setActiveView("code");
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[38px] ${
                activeFormat === fmt.id
                  ? "bg-brand-600 text-white shadow-glow"
                  : "bg-surface-100 text-zinc-400 hover:text-zinc-200 border border-surface-border"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{fmt.label}</span>
            </button>
          ))}
        </div>

        {/* Main Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left/Main Code Editor & Viewer */}
          <div className="flex-1 flex flex-col bg-[#07070a] overflow-hidden border-b md:border-b-0 md:border-r border-surface-border">
            {/* Sub-bar (File Info & View Tabs) */}
            <div className="flex items-center justify-between px-4 py-2 bg-surface-100 border-b border-surface-border text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-zinc-300 font-semibold">{exportResult.filename}</span>
                <span className="text-[11px] text-zinc-500">
                  ({(exportResult.code.length / 1024).toFixed(1)} KB)
                </span>
              </div>

              <div className="flex items-center gap-1 bg-surface-200 p-0.5 rounded-lg border border-surface-border">
                <button
                  onClick={() => setActiveView("code")}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    activeView === "code" ? "bg-brand-600 text-white font-medium" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Code
                </button>
                <button
                  onClick={() => setActiveView("compatibility")}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    activeView === "compatibility" ? "bg-brand-600 text-white font-medium" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Compatibility ({compatibility.score}%)
                </button>
              </div>
            </div>

            {/* Viewport Content */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs text-zinc-200 select-text leading-relaxed">
              {activeView === "code" ? (
                <pre className="whitespace-pre overflow-x-auto selection:bg-brand-600/30">
                  {exportResult.code}
                </pre>
              ) : (
                <div className="flex flex-col gap-4 font-sans text-xs">
                  {/* Status Box */}
                  <div className={`p-4 rounded-xl border flex items-center justify-between ${statusBadge.color}`}>
                    <div className="flex items-center gap-3">
                      <StatusIcon className="w-5 h-5 shrink-0" />
                      <div>
                        <div className="font-bold text-sm">{statusBadge.label}</div>
                        <div className="text-[11px] opacity-80">
                          Target format compatibility score: {compatibility.score}/100
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Warnings / Caveats */}
                  <div>
                    <h4 className="font-bold text-zinc-300 uppercase tracking-wider text-[11px] mb-2">
                      Warnings & Potential Regressions ({compatibility.warnings.length})
                    </h4>
                    {compatibility.warnings.length === 0 ? (
                      <div className="p-3 rounded-xl bg-surface-100 border border-surface-border text-zinc-400">
                        Zero warnings. Full lossless conversion achieved!
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {compatibility.warnings.map((w, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-start gap-2.5"
                          >
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Supported Features */}
                  <div>
                    <h4 className="font-bold text-zinc-300 uppercase tracking-wider text-[11px] mb-2">
                      Supported Features ({compatibility.supportedFeatures.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {compatibility.supportedFeatures.map((f, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-surface-100 border border-surface-border flex items-center gap-2 text-zinc-300"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Instructions & Details */}
          <div className="w-full md:w-80 p-5 bg-surface-100 overflow-y-auto flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Export Target Details
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {EXPORT_FORMATS.find((f) => f.id === activeFormat)?.description}
              </p>
            </div>

            {/* Compatibility Summary Card */}
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${statusBadge.color}`}>
              <StatusIcon className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-bold">{statusBadge.label}</span>
                <p className="text-[10px] opacity-80 mt-0.5">
                  {compatibility.warnings.length === 0
                    ? "Ready to run with zero manual changes."
                    : `${compatibility.warnings.length} features modified or adapted.`}
                </p>
              </div>
            </div>

            {/* Quick Project Stats */}
            <div className="p-3 rounded-xl bg-surface-200 border border-surface-border text-xs flex flex-col gap-1.5">
              <div className="text-[10px] uppercase font-bold text-zinc-400">Project Metadata</div>
              <div className="flex justify-between text-zinc-300">
                <span>Layers:</span>
                <span className="font-mono text-white">{layers.length}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Keyframes:</span>
                <span className="font-mono text-white">{keyframes.length}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Duration:</span>
                <span className="font-mono text-white">{project?.duration || 5.0}s</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>FPS:</span>
                <span className="font-mono text-white">{project?.fps || 60}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto flex flex-col gap-2 pt-4">
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-surface-200 hover:bg-surface-border border border-surface-border text-white transition-colors min-h-[44px]"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Code"}</span>
              </button>

              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-glow transition-all min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>Download {exportResult.filename}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
