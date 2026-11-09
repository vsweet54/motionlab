"use client";

import React, { useState } from "react";
import {
  X,
  BookmarkPlus,
  Sparkles,
  Info,
  Check,
} from "lucide-react";
import { useTemplateStore } from "@/store/useTemplateStore";
import { useEditorStore } from "@/store/useEditorStore";
import { useAnimationStore } from "@/store/useAnimationStore";
import { useProjectStore } from "@/store/useProjectStore";
import { TEMPLATE_CATEGORIES } from "@/engine/templates";

export default function SaveAsTemplateModal({ isOpen, onClose }) {
  const { project, layers } = useEditorStore();
  const { keyframes, beatMarkers, duration, fps } = useAnimationStore();
  const { saveProjectAsTemplate } = useTemplateStore();
  const { showToast } = useProjectStore();

  const [title, setTitle] = useState(project?.name || "My Motion Template");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Custom Templates");
  const [tagsStr, setTagsStr] = useState("Custom, MotionLab");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      const tags = tagsStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await saveProjectAsTemplate({
        project: project || {
          name: title,
          width: 1920,
          height: 1080,
          duration,
          fps,
          aspectRatio: "16:9",
          backgroundColor: "#09090b",
        },
        layers: layers || [],
        keyframes: keyframes || [],
        beatMarkers: beatMarkers || [],
        title: title.trim(),
        description: description.trim(),
        category,
        tags,
      });

      showToast(`Template "${title.trim()}" saved to My Templates!`);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error("Save as template failed:", err);
      showToast("Error saving template");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-surface-200 border border-surface-border rounded-3xl p-5 shadow-2xl space-y-4 text-xs text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <BookmarkPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Save as Template</h3>
              <p className="text-[11px] text-zinc-400">
                Save active project into your personal reusable template library
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] p-2 text-zinc-400 hover:text-white rounded-xl flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-zinc-300 font-semibold block">Template Name</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-[44px] bg-surface-100 border border-surface-border rounded-xl px-3 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
              placeholder="e.g. My Brand Reveal Intro"
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-300 font-semibold block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full min-h-[44px] bg-surface-100 border border-surface-border rounded-xl px-3 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
            >
              {TEMPLATE_CATEGORIES.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-zinc-300 font-semibold block">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-100 border border-surface-border rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 leading-relaxed"
              placeholder="Brief description of the template purpose, style, and use cases..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-300 font-semibold block">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              className="w-full min-h-[44px] bg-surface-100 border border-surface-border rounded-xl px-3 text-xs text-white focus:outline-none focus:border-purple-500"
              placeholder="Intro, Neon, Social Media"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-surface-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-surface-100 hover:bg-surface-border border border-surface-border text-zinc-300 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="min-h-[44px] px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold flex items-center gap-2 shadow-glow transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? "Saving..." : "Save Template"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
