"use client";

import { useEffect, useState } from "react";
import { AlertOctagon, RotateCcw, Home, Terminal, Copy, Check } from "lucide-react";

export default function GlobalErrorPage({ error, reset }) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error("MotionLab Studio Caught Error:", error);
  }, [error]);

  const handleCopyDiagnostics = () => {
    const errorDump = JSON.stringify(
      {
        name: error?.name || "Error",
        message: error?.message || "Unknown Studio Error",
        stack: error?.stack || "No stack trace available",
        time: new Date().toISOString(),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "N/A",
      },
      null,
      2
    );
    navigator.clipboard.writeText(errorDump);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-100 border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        {/* Error Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
          <AlertOctagon className="w-8 h-8" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Something Went Wrong
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            MotionLab encountered an unexpected runtime issue. Your local project data in IndexedDB remains safe and intact.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-glow transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.href = "/";
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-200 hover:bg-surface-border text-zinc-300 font-semibold text-xs border border-surface-border transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Reload Studio</span>
          </button>
        </div>

        {/* Developer Diagnostics Toggle */}
        <div className="pt-2 border-t border-surface-border/60">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-1.5 mx-auto"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{showDetails ? "Hide Technical Details" : "View Diagnostics"}</span>
          </button>

          {showDetails && (
            <div className="mt-3 p-3 rounded-xl bg-surface-200 border border-surface-border text-left font-mono text-[10px] text-red-300 max-h-40 overflow-y-auto space-y-2">
              <div className="font-bold">{error?.message || "Unknown error"}</div>
              <div className="text-zinc-500 break-all">{error?.stack?.slice(0, 300)}...</div>
              <button
                onClick={handleCopyDiagnostics}
                className="mt-2 flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy error trace"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
