"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Search,
  Sparkles,
  Check,
  Plus,
  Flame,
  Zap,
  Layers,
} from "lucide-react";
import { EFFECT_REGISTRY, EFFECT_CATEGORIES } from "@/engine/effects/definitions";
import { useEditorStore } from "@/store/useEditorStore";

export default function EffectsLibraryModal({ isOpen, onClose, targetLayerId }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [addedEffectId, setAddedEffectId] = useState(null);

  const { addEffectToLayer, layers } = useEditorStore();
  const targetLayer = layers.find((l) => l.id === targetLayerId);

  const filteredEffects = useMemo(() => {
    return Object.values(EFFECT_REGISTRY).filter((fx) => {
      const matchesCategory =
        selectedCategory === "all" || fx.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        fx.name.toLowerCase().includes(q) ||
        fx.description.toLowerCase().includes(q) ||
        fx.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleApply = (effectType) => {
    if (!targetLayerId) return;
    addEffectToLayer(targetLayerId, effectType);
    setAddedEffectId(effectType);
    setTimeout(() => setAddedEffectId(null), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-3xl h-[88vh] sm:h-[80vh] bg-surface-200 border border-surface-border rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-xs text-zinc-200 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Grab Handle */}
        <div className="w-12 h-1.5 bg-zinc-600 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Effects Library</h3>
              <p className="text-zinc-400 text-xs">
                {targetLayer ? (
                  <span>
                    Adding to: <span className="text-purple-300 font-semibold">{targetLayer.name}</span>
                  </span>
                ) : (
                  "Select a layer to apply effects"
                )}
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

        {/* Search Bar & Category Filters */}
        <div className="p-4 border-b border-surface-border space-y-3 bg-surface-100/50">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search 16+ visual effects (Glow, Glitch, Blur, Ripple, Wave, Particles)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-100 border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 min-h-[44px]"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {EFFECT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-medium text-xs whitespace-nowrap transition-colors min-h-[36px] ${
                  selectedCategory === cat.id
                    ? "bg-purple-600 text-white font-semibold shadow-glow"
                    : "bg-surface-100 text-zinc-400 hover:text-zinc-200 border border-surface-border"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Effects Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredEffects.map((fx) => {
            const isJustAdded = addedEffectId === fx.type;

            return (
              <div
                key={fx.type}
                className="flex flex-col justify-between p-4 rounded-2xl bg-surface-100 border border-surface-border hover:border-purple-500/50 transition-all group shadow-sm hover:shadow-xl"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-lg bg-surface-200 text-zinc-400 font-mono text-[10px] uppercase font-semibold">
                      {fx.category}
                    </span>
                    <Sparkles className="w-4 h-4 text-purple-400/60 group-hover:text-purple-400 transition-colors" />
                  </div>

                  <h4 className="font-bold text-zinc-100 text-sm">{fx.name}</h4>
                  <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed">
                    {fx.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-surface-border/60">
                  <button
                    onClick={() => handleApply(fx.type)}
                    disabled={!targetLayerId}
                    className={`w-full min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all active:scale-95 ${
                      isJustAdded
                        ? "bg-emerald-600 text-white shadow-glow"
                        : "bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30"
                    } ${!targetLayerId ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isJustAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Layer</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add Effect</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
