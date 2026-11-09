"use client";

import { Film, Plus, Sparkles, Zap, ShieldCheck, Gauge } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";

export default function EmptyState() {
  const { openNewProjectModal, setActiveTab } = useProjectStore();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-surface-border bg-gradient-to-b from-surface-100 to-surface-200/50 p-8 sm:p-12 text-center shadow-card">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
        {/* Glowing Icon Hub */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-purple-600/20 border border-brand-500/30 flex items-center justify-center shadow-glow">
            <Film className="w-8 h-8 text-brand-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Headings */}
        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
          Your Canvas is Waiting
        </h3>
        <p className="text-sm text-zinc-400 mb-8 leading-relaxed max-w-md">
          Start generating professional browser-based motion graphics with silky-smooth 60 FPS GSAP timing and vector canvas rendering.
        </p>

        {/* Action Buttons (100% functional) */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-10">
          <button
            onClick={() => openNewProjectModal()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm shadow-glow transition-all duration-150 hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Project</span>
          </button>

          <button
            onClick={() => setActiveTab("templates")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface-50 hover:bg-surface-border text-zinc-200 hover:text-white border border-surface-border font-medium text-sm transition-all duration-150"
          >
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>Browse Templates</span>
          </button>
        </div>

        {/* Feature badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-6 border-t border-surface-border/60 text-left">
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-200 border border-surface-border/40">
            <Gauge className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-zinc-200">60 FPS Timing</p>
              <p className="text-[10px] text-zinc-500">GSAP motion curves</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-200 border border-surface-border/40">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-zinc-200">Instant Canvas</p>
              <p className="text-[10px] text-zinc-500">Hardware accelerated</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-200 border border-surface-border/40">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-zinc-200">Local-First</p>
              <p className="text-[10px] text-zinc-500">Zero cloud latency</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
