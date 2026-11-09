"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  ArrowRight,
  Maximize2,
  Minimize2,
  Layers,
  Clock,
  Monitor,
  Heart,
  Share2,
  Download,
  Copy,
  Sliders,
  Type,
  Palette,
} from "lucide-react";
import { useTemplateStore } from "@/store/useTemplateStore";
import { useProjectStore } from "@/store/useProjectStore";
import TemplateAnimatedPreview from "./TemplateAnimatedPreview";

export default function TemplateDetailModal() {
  const {
    previewingTemplate,
    setPreviewingTemplate,
    toggleFavorite,
    instantiateTemplate,
    exportTemplateFile,
    duplicateTemplate,
  } = useTemplateStore();

  const { openProject, showToast } = useProjectStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickColor, setQuickColor] = useState("");
  const [showCustomize, setShowCustomize] = useState(false);

  if (!previewingTemplate) return null;

  const template = previewingTemplate;

  // Find prime customizable text and color
  const primeTextLayer = (template.layers || []).find((l) => l.type === "text");
  const primeColorLayer = (template.layers || []).find(
    (l) => l.type === "rect" || l.type === "circle" || l.fill
  );

  const handleUseTemplate = async () => {
    try {
      // Apply any quick customizations if adjusted
      let customizedTemplate = { ...template };
      if (quickTitle && primeTextLayer) {
        customizedTemplate.layers = template.layers.map((l) =>
          l.id === primeTextLayer.id ? { ...l, text: quickTitle } : l
        );
      }
      if (quickColor && primeColorLayer) {
        customizedTemplate.layers = (customizedTemplate.layers || template.layers).map((l) =>
          l.id === primeColorLayer.id ? { ...l, fill: quickColor } : l
        );
      }

      const newProject = await instantiateTemplate(customizedTemplate);
      setPreviewingTemplate(null);
      openProject(newProject);
      showToast(`Created project "${newProject.name}" from template!`);
    } catch (err) {
      console.error("Failed to use template:", err);
      showToast("Error initializing template project");
    }
  };

  const handleDuplicate = async () => {
    await duplicateTemplate(template);
    showToast(`Template duplicated to My Templates!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full bg-surface-200 border border-surface-border rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isFullscreen ? "h-[98vh] max-w-5xl" : "max-h-[92vh] max-w-3xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border bg-surface-100/60">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {template.category}
            </span>
            <h3 className="font-bold text-white text-sm sm:text-base truncate max-w-[280px] sm:max-w-md">
              {template.title || template.name}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Favorite Button */}
            <button
              onClick={() => toggleFavorite(template.id)}
              className={`min-w-[38px] min-h-[38px] p-2 rounded-xl flex items-center justify-center transition-colors ${
                template.isFavorite
                  ? "text-rose-400 bg-rose-500/20"
                  : "text-zinc-400 hover:text-white bg-surface-100"
              }`}
              title="Add to Favorites"
            >
              <Heart
                className={`w-4 h-4 ${template.isFavorite ? "fill-current" : ""}`}
              />
            </button>

            {/* Export JSON Button */}
            <button
              onClick={() => exportTemplateFile(template)}
              className="min-w-[38px] min-h-[38px] p-2 rounded-xl text-zinc-400 hover:text-white bg-surface-100 flex items-center justify-center transition-colors"
              title="Export Template as JSON"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="min-w-[38px] min-h-[38px] p-2 rounded-xl text-zinc-400 hover:text-white bg-surface-100 flex items-center justify-center transition-colors"
              title="Toggle Fullscreen Preview"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={() => setPreviewingTemplate(null)}
              className="min-w-[38px] min-h-[38px] p-2 rounded-xl text-zinc-400 hover:text-white bg-surface-100 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Live Animation Preview Stage */}
          <TemplateAnimatedPreview
            template={template}
            isFullscreen={isFullscreen}
          />

          {/* Description & Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-surface-100 border border-surface-border">
              <span className="text-[10px] text-zinc-500 block mb-0.5">Aspect Ratio</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                <Monitor className="w-3.5 h-3.5 text-brand-400" />
                <span>{template.aspectRatio || "16:9"}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-surface-100 border border-surface-border">
              <span className="text-[10px] text-zinc-500 block mb-0.5">Resolution</span>
              <div className="text-xs font-mono font-bold text-zinc-200">
                {template.width} × {template.height}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-surface-100 border border-surface-border">
              <span className="text-[10px] text-zinc-500 block mb-0.5">Duration & FPS</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{template.duration}s @ {template.fps || 60}fps</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-surface-100 border border-surface-border">
              <span className="text-[10px] text-zinc-500 block mb-0.5">Animated Layers</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>{template.layers?.length || 0} Layers</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            {template.description}
          </p>

          {/* Quick Customize Section (Optional Accordion) */}
          <div className="p-4 rounded-2xl bg-surface-100 border border-surface-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-brand-400" />
                Quick Customize Before Opening
              </span>
              <button
                onClick={() => setShowCustomize(!showCustomize)}
                className="text-[11px] text-brand-400 font-semibold hover:underline"
              >
                {showCustomize ? "Hide" : "Customize"}
              </button>
            </div>

            {showCustomize && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-surface-border">
                {primeTextLayer && (
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Type className="w-3 h-3 text-cyan-400" />
                      Headline Text
                    </label>
                    <input
                      type="text"
                      placeholder={primeTextLayer.text}
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      className="w-full bg-surface-200 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-semibold"
                    />
                  </div>
                )}

                {primeColorLayer && (
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Palette className="w-3 h-3 text-pink-400" />
                      Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={quickColor || primeColorLayer.fill || "#6366f1"}
                        onChange={(e) => setQuickColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <span className="font-mono text-xs text-zinc-300">
                        {quickColor || primeColorLayer.fill || "#6366f1"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-surface-border bg-surface-100/60 flex items-center justify-between">
          <button
            onClick={handleDuplicate}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-surface-200 hover:bg-surface-border border border-surface-border text-xs text-zinc-300 font-semibold flex items-center gap-2 transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Duplicate as My Template</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setPreviewingTemplate(null)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-surface-200 hover:bg-surface-border border border-surface-border text-xs text-zinc-300 font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleUseTemplate}
              className="min-h-[44px] px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs text-white font-bold flex items-center gap-2 shadow-glow transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-brand-200" />
              <span>Use Template in Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
