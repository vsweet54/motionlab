"use client";

import { X, Sparkles, Clock, Monitor, Layers, Play } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";

export default function TemplatePreviewModal() {
  const { previewTemplate, setPreviewTemplate, openNewProjectModal } =
    useProjectStore();

  if (!previewTemplate) return null;

  const handleUseTemplate = () => {
    const template = previewTemplate;
    setPreviewTemplate(null);
    openNewProjectModal({
      name: `${template.title} (Draft)`,
      aspectRatio: template.aspectRatio,
      width: template.width,
      height: template.height,
      fps: template.fps,
      duration: template.duration,
      defaultLayers: template.defaultLayers,
      templateId: template.id,
      gradient: template.gradient,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-surface-200 border border-surface-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview Banner */}
        <div
          className={`h-48 w-full bg-gradient-to-tr ${previewTemplate.gradient} relative p-6 flex flex-col justify-between overflow-hidden`}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-black/60 text-white backdrop-blur-md border border-white/20">
              {previewTemplate.category}
            </span>
            <button
              onClick={() => setPreviewTemplate(null)}
              className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white drop-shadow-md">
              {previewTemplate.title}
            </h3>
            <p className="text-xs text-white/80 line-clamp-2 max-w-lg mt-1">
              {previewTemplate.description}
            </p>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Metadata Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-surface-100 border border-surface-border">
              <span className="text-[10px] text-zinc-500 block mb-1">Aspect Ratio</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                <Monitor className="w-3.5 h-3.5 text-brand-400" />
                <span>{previewTemplate.aspectRatio}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-100 border border-surface-border">
              <span className="text-[10px] text-zinc-500 block mb-1">Resolution</span>
              <div className="text-xs font-mono font-semibold text-zinc-200">
                {previewTemplate.width} × {previewTemplate.height}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-100 border border-surface-border">
              <span className="text-[10px] text-zinc-500 block mb-1">Duration & FPS</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {previewTemplate.duration}s @ {previewTemplate.fps}fps
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-100 border border-surface-border">
              <span className="text-[10px] text-zinc-500 block mb-1">Preset Layers</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>{previewTemplate.defaultLayers?.length || 0} Layers</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <span className="text-xs font-medium text-zinc-400 block mb-2">
              Tags & Key Attributes
            </span>
            <div className="flex flex-wrap gap-1.5">
              {previewTemplate.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg text-xs bg-surface-100 border border-surface-border text-zinc-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
            <button
              onClick={() => setPreviewTemplate(null)}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleUseTemplate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium shadow-glow transition-all duration-150 hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>Use this Template</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
