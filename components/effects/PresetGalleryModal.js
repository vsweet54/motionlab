"use client";

import React, { useState } from "react";
import { X, Sparkles, Check, Clock, Wand2, Tag } from "lucide-react";
import { MOTION_PRESETS } from "@/engine/presets/library";
import { useEditorStore } from "@/store/useEditorStore";

export default function PresetGalleryModal({ isOpen, onClose }) {
  const { applyProjectPreset } = useEditorStore();
  const [appliedPresetId, setAppliedPresetId] = useState(null);

  if (!isOpen) return null;

  const handleApply = (presetId) => {
    applyProjectPreset(presetId);
    setAppliedPresetId(presetId);
    setTimeout(() => {
      setAppliedPresetId(null);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-4xl h-[90vh] sm:h-[84vh] bg-surface-200 border border-surface-border rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-xs text-zinc-200 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Grab Handle */}
        <div className="w-12 h-1.5 bg-zinc-600 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Motion Graphics Preset Library</h3>
              <p className="text-zinc-400 text-xs">
                9 complete motion design templates with real editable layers, keyframes & effects
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] p-2 text-zinc-400 hover:text-white rounded-xl flex items-center justify-center"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOTION_PRESETS.map((preset) => {
            const isApplied = appliedPresetId === preset.id;

            return (
              <div
                key={preset.id}
                className="flex flex-col justify-between rounded-2xl bg-surface-100 border border-surface-border hover:border-brand-500/60 transition-all overflow-hidden group shadow-md hover:shadow-2xl"
              >
                {/* Visual Thumbnail Banner */}
                <div
                  className={`h-28 w-full bg-gradient-to-br ${preset.thumbnailBg} border-b border-surface-border/50 p-3.5 flex flex-col justify-between relative overflow-hidden`}
                >
                  <div className="flex justify-between items-center z-10">
                    <span className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-zinc-300 font-mono text-[10px] uppercase font-semibold">
                      {preset.category}
                    </span>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-zinc-300 font-mono text-[10px]">
                      <Clock className="w-3 h-3 text-brand-400" />
                      <span>{preset.duration}s</span>
                    </div>
                  </div>

                  <h4 className="font-bold text-white text-base z-10 drop-shadow">
                    {preset.name}
                  </h4>
                </div>

                {/* Body & Tags */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">
                      {preset.description}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {preset.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-surface-200 text-zinc-400 text-[10px]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleApply(preset.id)}
                      className={`w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all active:scale-95 ${
                        isApplied
                          ? "bg-emerald-600 text-white shadow-glow"
                          : "bg-brand-600 hover:bg-brand-500 text-white shadow-glow"
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Applied to Project</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          <span>Apply Preset</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
