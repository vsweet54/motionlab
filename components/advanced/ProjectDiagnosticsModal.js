"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Activity,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Copy,
  Download,
  Check,
  RefreshCw,
  Cpu,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { useAnimationStore } from "@/store/useAnimationStore";
import {
  runProjectDiagnostics,
  formatDiagnosticReport,
} from "@/engine/advanced/diagnostics";

export default function ProjectDiagnosticsModal({ isOpen, onClose }) {
  const project = useEditorStore((s) => s.project);
  const layers = useEditorStore((s) => s.layers);
  const keyframes = useAnimationStore((s) => s.keyframes);

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'issues' | 'warnings' | 'passed'

  const diagnostics = useMemo(() => {
    return runProjectDiagnostics({
      project,
      layers,
      keyframes,
      audioTracks: layers.filter((l) => l.type === "audio"),
    });
  }, [project, layers, keyframes]);

  if (!isOpen) return null;

  const handleCopyReport = () => {
    const report = formatDiagnosticReport(diagnostics, project?.name || "Untitled");
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    const report = formatDiagnosticReport(diagnostics, project?.name || "Untitled");
    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(project?.name || "motionlab").toLowerCase().replace(/\s+/g, "-")}-diagnostics.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scoreColor =
    diagnostics.healthScore >= 90
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : diagnostics.healthScore >= 70
      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
      : "text-red-400 border-red-500/30 bg-red-500/10";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-surface-200 border border-surface-border rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Project Diagnostics & Health Inspector
              </h2>
              <p className="text-xs text-zinc-400">
                Deep structural analysis of layers, keyframes, missing assets, and performance
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

        {/* Health Score & Quick Metrics */}
        <div className="p-5 border-b border-surface-border bg-surface-100/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl border ${scoreColor}`}
            >
              <span className="text-2xl font-black">{diagnostics.healthScore}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Health</span>
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {diagnostics.status === "healthy"
                  ? "Project is in Excellent Health"
                  : diagnostics.status === "warning"
                  ? "Minor Warnings Detected"
                  : "Critical Issues Require Attention"}
              </div>
              <div className="text-xs text-zinc-400">
                {diagnostics.issues.length} critical issues, {diagnostics.warnings.length} warnings,{" "}
                {diagnostics.passed.length} tests passed
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyReport}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-surface-100 hover:bg-surface-border border border-surface-border text-zinc-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Report"}</span>
            </button>
            <button
              onClick={handleDownloadReport}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .MD</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-5 border-b border-surface-border bg-surface-200 text-xs">
          <div className="p-2.5 rounded-lg bg-surface-100 border border-surface-border">
            <div className="text-zinc-500 text-[10px] uppercase font-semibold">Layers</div>
            <div className="text-sm font-bold text-zinc-200 mt-0.5">{diagnostics.stats.totalLayers}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-100 border border-surface-border">
            <div className="text-zinc-500 text-[10px] uppercase font-semibold">Keyframes</div>
            <div className="text-sm font-bold text-zinc-200 mt-0.5">{diagnostics.stats.activeKeyframes}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-100 border border-surface-border">
            <div className="text-zinc-500 text-[10px] uppercase font-semibold">Resolution</div>
            <div className="text-sm font-bold text-zinc-200 mt-0.5">{diagnostics.stats.resolution}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-100 border border-surface-border">
            <div className="text-zinc-500 text-[10px] uppercase font-semibold">JSON Size</div>
            <div className="text-sm font-bold text-zinc-200 mt-0.5">{diagnostics.stats.estimatedSizeKb} KB</div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-100 border border-surface-border">
            <div className="text-zinc-500 text-[10px] uppercase font-semibold">Browser Capabilities</div>
            <div className="text-sm font-bold text-cyan-400 mt-0.5">{diagnostics.stats.deviceScore || 100}%</div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-100 border border-surface-border">
            <div className="text-zinc-500 text-[10px] uppercase font-semibold">App Version</div>
            <div className="text-sm font-bold text-purple-400 mt-0.5">v1.0.0 (PWA)</div>
          </div>
        </div>

        {/* Findings List */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-3">
          {/* Critical Issues */}
          {diagnostics.issues.map((iss, i) => (
            <div
              key={`iss_${i}`}
              className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs flex items-start gap-3"
            >
              <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-red-200">{iss.message}</div>
                <div className="text-zinc-400 mt-1 text-[11px]">Fix: {iss.recommendation}</div>
              </div>
            </div>
          ))}

          {/* Warnings */}
          {diagnostics.warnings.map((w, i) => (
            <div
              key={`w_${i}`}
              className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-3"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-amber-200">{w.message}</div>
                <div className="text-zinc-400 mt-1 text-[11px]">Suggestion: {w.recommendation}</div>
              </div>
            </div>
          ))}

          {/* Passed Checks */}
          {diagnostics.passed.map((p, i) => (
            <div
              key={`p_${i}`}
              className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs flex items-center gap-2.5 text-zinc-300"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{p}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-surface-border bg-surface-100 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Diagnostics are non-destructive and do not alter project files automatically
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-surface-200 hover:bg-surface-border text-zinc-200 transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
