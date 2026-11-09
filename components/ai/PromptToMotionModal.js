"use client";

import { useState } from "react";
import {
  Sparkles,
  X,
  Play,
  Layers,
  Clock,
  Palette,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Film,
  Zap,
  Info,
  ChevronRight,
  ArrowRight,
  Eye,
  Sliders,
  Type,
  FileText,
} from "lucide-react";
import { AI_VISUAL_STYLES, ASPECT_RATIOS } from "@/engine/ai/promptEngine";
import { convertAiResponseToProject } from "@/engine/ai/projectGenerator";
import { useProjectStore } from "@/store/useProjectStore";
import { saveProject } from "@/lib/db";

const EXAMPLE_PROMPTS = [
  {
    title: "Human Heart Anatomy",
    prompt:
      "Buat video motion graphics berdurasi 15 detik tentang cara kerja jantung manusia. Gunakan gaya modern, background gelap, animasi organ 3D-style, teks informatif, transisi halus, dan efek visual profesional.",
    style: "educational",
    duration: 15,
  },
  {
    title: "Fintech Growth Metric",
    prompt:
      "Create a sleek 10-second corporate motion graphic showcasing 300% quarterly growth with animated metric counters, glowing cyan geometric nodes, and dynamic bar charts.",
    style: "infographic",
    duration: 10,
  },
  {
    title: "Cyberpunk Title Sequence",
    prompt:
      "A 5-second futuristic cyberpunk motion graphic title sequence with neon magenta accents, glitch scanlines, bold typography, and expanding hexagonal energy rings.",
    style: "futuristic_cyber",
    duration: 5,
  },
];

export default function PromptToMotionModal({ isOpen, onClose }) {
  const { openProject, showToast, loadProjects } = useProjectStore();

  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(15);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [visualStyle, setVisualStyle] = useState("modern_corporate");
  const [language, setLanguage] = useState("id");
  const [fps, setFps] = useState(60);

  // Generation status state
  const [status, setStatus] = useState("idle"); // 'idle' | 'generating' | 'review' | 'error'
  const [stageMessage, setStageMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorHelp, setErrorHelp] = useState("");
  const [storyboard, setStoryboard] = useState(null);
  const [selectedSceneIdx, setSelectedSceneIdx] = useState(0);
  const [regeneratingSceneId, setRegeneratingSceneId] = useState(null);

  if (!isOpen) return null;

  // Handles submitting prompt to Gemini API
  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || prompt.trim().length < 3) return;

    setStatus("generating");
    setErrorMessage("");
    setErrorHelp("");
    setStageMessage("Menghubungkan ke Google Gemini API...");

    try {
      // Step 1: Request from Next.js server route
      setStageMessage("Gemini merancang storyboard & motion trajectory...");
      const res = await fetch("/api/ai/generate-motion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          duration: Number(duration),
          aspectRatio,
          fps: Number(fps),
          visualStyle,
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw {
          message: data.error || "Gagal menghasilkan motion graphics dari Gemini.",
          code: data.code,
          help: data.help,
        };
      }

      setStageMessage("Memvalidasi keyframe koordinat & animasi layer...");
      setStoryboard(data.storyboard);
      setSelectedSceneIdx(0);
      setStatus("review");
    } catch (err) {
      console.error("[PromptToMotion] Error:", err);
      setStatus("error");
      setErrorMessage(err.message || "Terjadi kesalahan saat memproses prompt.");
      setErrorHelp(err.help || "");
    }
  };

  // Handles single scene regeneration
  const handleRegenerateScene = async (scene, idx) => {
    setRegeneratingSceneId(scene.id);
    try {
      const res = await fetch("/api/ai/generate-motion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          visualStyle,
          language,
          action: "regenerate_scene",
          sceneToRegenerate: scene,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.storyboard?.scenes?.[0]) {
        const newScene = data.storyboard.scenes[0];
        setStoryboard((prev) => {
          const updatedScenes = [...prev.scenes];
          updatedScenes[idx] = newScene;
          return { ...prev, scenes: updatedScenes };
        });
        showToast(`Scene ${idx + 1} berhasil diperbarui.`);
      } else {
        showToast("Gagal memperbarui scene: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      showToast("Gagal regenerasi scene: " + (err.message || "Network error"));
    } finally {
      setRegeneratingSceneId(null);
    }
  };

  // Converts validated AI storyboard to full MotionLab project and opens in Studio Canvas
  const handleApplyToCanvas = async () => {
    if (!storyboard) return;

    try {
      // 1. Convert to Native Project
      const motionLabProject = convertAiResponseToProject(storyboard, {
        aspectRatio,
        fps,
      });

      // 2. Persist to IndexedDB
      await saveProject(motionLabProject);
      await loadProjects();

      // 3. Open in Studio Canvas Editor
      openProject(motionLabProject);
      showToast(`Project AI "${motionLabProject.name}" siap diedit di Canvas!`);
      onClose();
    } catch (err) {
      console.error("[ApplyToCanvas Error]:", err);
      showToast("Gagal membuka project: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-surface-200 border border-surface-border rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="px-5 sm:px-6 py-4 border-b border-surface-border flex items-center justify-between bg-surface-100/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Gemini AI Prompt-to-Motion
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-purple-500/10 border border-purple-500/20 text-purple-300">
                  Google GenAI
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Ubah prompt teks menjadi animasi motion graphics multi-scene siap edit.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-surface-border/50 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* STATE: GENERATING (Loading Progress) */}
          {status === "generating" && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-surface-border border-t-purple-500 animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-purple-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Merancang Motion Graphics...</h4>
                <p className="text-xs text-zinc-400 font-mono">{stageMessage}</p>
              </div>
              <p className="text-[11px] text-zinc-500 max-w-md">
                Gemini sedang menyusun layer teks, bentuk vektor, timing keyframe GSAP, dan transisi kamera.
              </p>
            </div>
          )}

          {/* STATE: ERROR */}
          {status === "error" && (
            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <h4 className="text-sm font-bold">Gagal Menghasilkan Motion</h4>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">{errorMessage}</p>
              {errorHelp && (
                <div className="text-[11px] text-zinc-400 bg-surface-100 p-3 rounded-xl border border-surface-border">
                  <span className="font-semibold text-purple-400">Panduan: </span>
                  {errorHelp}
                </div>
              )}
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white min-h-[44px] shadow-glow transition-all active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Coba Lagi Sekarang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="px-4 py-2 rounded-xl bg-surface-100 hover:bg-surface-border text-xs font-semibold text-zinc-300 min-h-[44px] transition-colors"
                >
                  Ubah Parameter / Prompt
                </button>
              </div>
            </div>
          )}

          {/* STATE: IDLE (Prompt Input Form) */}
          {status === "idle" && (
            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Prompt Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Deskripsi Motion Graphics / User Prompt</span>
                  </label>
                  <span className="text-[10px] text-zinc-500">{prompt.length}/2000</span>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ketik deskripsi animasi yang Anda inginkan... Contoh: Buat video motion graphics tentang cara kerja jantung manusia dengan gaya modern, background gelap, teks informatif..."
                  rows={4}
                  className="w-full rounded-xl bg-surface-100 border border-surface-border p-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all resize-none"
                  required
                />
              </div>

              {/* Example Prompts Pill List */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-zinc-400">Inspirasi Prompt:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {EXAMPLE_PROMPTS.map((ex, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPrompt(ex.prompt);
                        setVisualStyle(ex.style);
                        setDuration(ex.duration);
                      }}
                      className="text-left p-2.5 rounded-xl bg-surface-100 hover:bg-surface-border border border-surface-border/60 hover:border-purple-500/30 transition-all text-xs group min-h-[44px]"
                    >
                      <div className="font-semibold text-zinc-200 group-hover:text-purple-300 flex items-center justify-between">
                        <span>{ex.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{ex.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                {/* Visual Style */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Visual Style</span>
                  </label>
                  <select
                    value={visualStyle}
                    onChange={(e) => setVisualStyle(e.target.value)}
                    className="w-full rounded-xl bg-surface-100 border border-surface-border px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/60 min-h-[44px]"
                  >
                    {AI_VISUAL_STYLES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Aspect Ratio</span>
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full rounded-xl bg-surface-100 border border-surface-border px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/60 min-h-[44px]"
                  >
                    {Object.entries(ASPECT_RATIOS).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Total Durasi</span>
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full rounded-xl bg-surface-100 border border-surface-border px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/60 min-h-[44px]"
                  >
                    <option value={5}>5 Detik (Teaser / Story)</option>
                    <option value={10}>10 Detik (Short Reel)</option>
                    <option value={15}>15 Detik (Standard Motion)</option>
                    <option value={30}>30 Detik (Full Explainer)</option>
                  </select>
                </div>

                {/* Language */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bahasa Teks</span>
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-xl bg-surface-100 border border-surface-border px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/60 min-h-[44px]"
                  >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English (US)</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={!prompt.trim() || prompt.trim().length < 3}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:via-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-glow transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Motion Graphics with Gemini</span>
                </button>
              </div>
            </form>
          )}

          {/* STATE: REVIEW STORYBOARD */}
          {status === "review" && storyboard && (
            <div className="space-y-5">
              {/* Project Summary Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-transparent border border-purple-500/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-bold text-white tracking-tight">
                    {storyboard.project?.title || "AI Motion Project"}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {storyboard.project?.description || "Rancangan multi-scene motion graphics oleh Google Gemini."}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      {storyboard.scenes?.reduce((acc, s) => acc + (Number(s.duration) || 0), 0)}s Total
                    </span>
                    <span className="flex items-center gap-1">
                      <Film className="w-3.5 h-3.5 text-cyan-400" />
                      {storyboard.scenes?.length} Scenes
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      {storyboard.scenes?.reduce((acc, s) => acc + (s.layers?.length || 0), 0)} Total Layers
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStatus("idle")}
                    className="px-3.5 py-2 rounded-xl bg-surface-100 hover:bg-surface-border text-xs font-medium text-zinc-300 border border-surface-border min-h-[44px] transition-colors"
                  >
                    Edit Prompt
                  </button>
                  <button
                    onClick={handleApplyToCanvas}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-glow min-h-[44px] transition-all hover:scale-105 active:scale-95"
                  >
                    <span>Buka di Studio Canvas</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scene Cards Carousel / Grid */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Storyboard Scenes ({storyboard.scenes?.length}):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {storyboard.scenes?.map((scene, idx) => {
                    const isSelected = selectedSceneIdx === idx;
                    const isRegenerating = regeneratingSceneId === scene.id;

                    return (
                      <div
                        key={scene.id || idx}
                        onClick={() => setSelectedSceneIdx(idx)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? "bg-surface-100 border-purple-500/60 shadow-glow"
                            : "bg-surface-100/50 border-surface-border hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] flex items-center justify-center font-mono">
                              {idx + 1}
                            </span>
                            <span>{scene.name}</span>
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface-200 text-zinc-400">
                            {scene.duration}s
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3">
                          {scene.description || "Scene animation sequence with vector layers."}
                        </p>

                        <div className="text-[10px] text-zinc-500 font-mono mb-3">
                          {scene.layers?.length || 0} Layers:{" "}
                          {scene.layers
                            ?.map((l) => l.name || l.type)
                            .slice(0, 3)
                            .join(", ")}
                          {(scene.layers?.length || 0) > 3 ? "..." : ""}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-surface-border/50">
                          <span className="text-[10px] text-purple-400 font-medium">
                            {isSelected ? "● Terpilih" : "Klik untuk inspeksi"}
                          </span>

                          <button
                            type="button"
                            disabled={isRegenerating}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegenerateScene(scene, idx);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-200 transition-colors"
                            title="Regenerasi variasi khusus scene ini"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin text-purple-400" : ""}`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Scene Layer Inspector */}
              {storyboard.scenes?.[selectedSceneIdx] && (
                <div className="rounded-2xl bg-surface-100 border border-surface-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span>
                        Layer Inspector: Scene {selectedSceneIdx + 1} (
                        {storyboard.scenes[selectedSceneIdx].name})
                      </span>
                    </h5>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {storyboard.scenes[selectedSceneIdx].layers?.length || 0} layers di canvas
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {storyboard.scenes[selectedSceneIdx].layers?.map((layer, lIdx) => (
                      <div
                        key={layer.id || lIdx}
                        className="p-2.5 rounded-xl bg-surface-200/80 border border-surface-border flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: layer.fill || "#6366f1" }}
                          />
                          <span className="font-medium text-white">{layer.name}</span>
                          <span className="text-[10px] text-zinc-500 uppercase font-mono">
                            ({layer.type})
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
                          <span>
                            Pos: ({Math.round(layer.x)}, {Math.round(layer.y)})
                          </span>
                          {layer.animations?.length > 0 && (
                            <span className="text-purple-400">
                              {layer.animations.length} animasi keyframe
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-surface-border bg-surface-100/60 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Info className="w-3.5 h-3.5 text-purple-400" />
            <span>Hasil project dapat diedit sepenuhnya di Timeline & Canvas.</span>
          </div>

          {status === "review" && (
            <button
              onClick={handleApplyToCanvas}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-glow min-h-[44px] transition-all hover:scale-105 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply & Buka Canvas</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
