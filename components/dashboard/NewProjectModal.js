"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Check, Monitor, Smartphone, Square, Tv, Film } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";

const ASPECT_RATIOS = [
  { id: "16:9", label: "16:9 Landscape", width: 1920, height: 1080, icon: Monitor, tag: "YouTube / TV" },
  { id: "9:16", label: "9:16 Vertical", width: 1080, height: 1920, icon: Smartphone, tag: "TikTok / Reels" },
  { id: "1:1", label: "1:1 Square", width: 1080, height: 1080, icon: Square, tag: "Social Feed" },
  { id: "4:5", label: "4:5 Portrait", width: 1080, height: 1350, icon: Tv, tag: "Instagram" },
  { id: "21:9", label: "21:9 Ultrawide", width: 2560, height: 1080, icon: Film, tag: "Cinematic" },
];

const FPS_OPTIONS = [24, 30, 60];
const DURATION_PRESETS = [3, 5, 8, 10, 15, 30];

export default function NewProjectModal() {
  const { isNewProjectModalOpen, closeNewProjectModal, createProject, modalInitialData } =
    useProjectStore();

  const [name, setName] = useState("");
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
  const [fps, setFps] = useState(60);
  const [duration, setDuration] = useState(5);
  const [bgColor, setBgColor] = useState("#0a0a0f");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (modalInitialData) {
      setName(modalInitialData.name || "");
      const matchRatio = ASPECT_RATIOS.find((r) => r.id === modalInitialData.aspectRatio);
      if (matchRatio) setSelectedRatio(matchRatio);
      if (modalInitialData.fps) setFps(modalInitialData.fps);
      if (modalInitialData.duration) setDuration(modalInitialData.duration);
    } else {
      setName("");
      setSelectedRatio(ASPECT_RATIOS[0]);
      setFps(60);
      setDuration(5);
      setBgColor("#0a0a0f");
    }
  }, [modalInitialData, isNewProjectModalOpen]);

  if (!isNewProjectModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await createProject({
        name: name.trim() || "Untitled Motion Project",
        aspectRatio: selectedRatio.id,
        width: selectedRatio.width,
        height: selectedRatio.height,
        fps,
        duration,
        layers: modalInitialData?.defaultLayers || [
          { id: "bg-layer", type: "background", color: bgColor },
        ],
        templateId: modalInitialData?.id || null,
        thumbnailGradient:
          modalInitialData?.gradient ||
          "from-brand-600 via-indigo-600 to-purple-700",
      });
      closeNewProjectModal();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-surface-200 border border-surface-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="h-16 px-6 border-b border-surface-border flex items-center justify-between bg-surface-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {modalInitialData ? `Create from ${modalInitialData.title}` : "Create New Project"}
              </h2>
              <p className="text-xs text-zinc-400">
                Configure composition resolution, timing, and frame rate
              </p>
            </div>
          </div>
          <button
            onClick={closeNewProjectModal}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-surface-border/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kinetic Title Reveal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-100 border border-surface-border rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>

          {/* Aspect Ratio Picker */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              Composition Format & Resolution
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ASPECT_RATIOS.map((ratio) => {
                const Icon = ratio.icon;
                const isSelected = selectedRatio.id === ratio.id;
                return (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => setSelectedRatio(ratio)}
                    className={`p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? "bg-brand-600/15 border-brand-500 text-white shadow-glow"
                        : "bg-surface-100 border-surface-border text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-4 h-4 ${isSelected ? "text-brand-400" : "text-zinc-500"}`} />
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-400" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">{ratio.label}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {ratio.width} × {ratio.height}
                      </p>
                      <span className="text-[9px] text-brand-400/90 font-medium">
                        {ratio.tag}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FPS & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* FPS Selector */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Frame Rate (FPS)
              </label>
              <div className="flex items-center gap-2">
                {FPS_OPTIONS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFps(val)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                      fps === val
                        ? "bg-brand-600 text-white border-brand-500 font-semibold"
                        : "bg-surface-100 border-surface-border text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {val} FPS
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Duration (Seconds)
                </label>
                <span className="text-xs font-mono text-brand-400 font-bold">
                  {duration}s ({duration * fps} frames)
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {DURATION_PRESETS.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDuration(sec)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                      duration === sec
                        ? "bg-brand-600 text-white border-brand-500 font-bold"
                        : "bg-surface-100 border-surface-border text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeNewProjectModal}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-surface-border/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-medium shadow-glow transition-all duration-150 hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Creating..." : "Create Composition"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
