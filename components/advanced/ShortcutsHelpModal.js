"use client";

import React from "react";
import { X, Keyboard, Smartphone, Command } from "lucide-react";

const SHORTCUT_GROUPS = [
  {
    title: "General & Project",
    items: [
      { keys: ["Ctrl", "S"], desc: "Save project to IndexedDB" },
      { keys: ["Ctrl", "Z"], desc: "Undo last change" },
      { keys: ["Ctrl", "Shift", "Z"], desc: "Redo change (or Ctrl+Y)" },
      { keys: ["Space"], desc: "Toggle Play / Pause" },
      { keys: ["K"], desc: "Toggle Play / Pause (Alt)" },
    ],
  },
  {
    title: "Canvas & Viewport",
    items: [
      { keys: ["Ctrl", "+"], desc: "Zoom In canvas" },
      { keys: ["Ctrl", "-"], desc: "Zoom Out canvas" },
      { keys: ["Ctrl", "0"], desc: "Fit canvas to screen" },
      { keys: ["H"], desc: "Pan Hand Tool" },
      { keys: ["V"], desc: "Selection Tool" },
    ],
  },
  {
    title: "Layer & Object Management",
    items: [
      { keys: ["Ctrl", "D"], desc: "Duplicate selected layer / keyframe" },
      { keys: ["Delete"], desc: "Delete selected objects" },
      { keys: ["Ctrl", "G"], desc: "Group selected layers" },
      { keys: ["Ctrl", "Shift", "G"], desc: "Ungroup group container" },
      { keys: ["Ctrl", "A"], desc: "Select all layers" },
      { keys: ["Esc"], desc: "Deselect all / Exit text edit" },
    ],
  },
  {
    title: "Timeline & Keyframes",
    items: [
      { keys: ["J"], desc: "Step 1 frame backward" },
      { keys: ["L"], desc: "Step 1 frame forward" },
      { keys: ["S"], desc: "Split clip at current playhead" },
      { keys: ["Ctrl", "C"], desc: "Copy selected keyframes" },
      { keys: ["Ctrl", "V"], desc: "Paste keyframes at playhead" },
    ],
  },
  {
    title: "Android Touch Gestures",
    touch: true,
    items: [
      { gesture: "Tap Object", desc: "Select layer & open properties sheet" },
      { gesture: "Pinch Canvas", desc: "Smooth zoom in & out" },
      { gesture: "Two-Finger Drag", desc: "Pan canvas workspace freely" },
      { gesture: "Scrub Ruler", desc: "Seek playhead directly to timestamp" },
      { gesture: "Floating Toolbar", desc: "Quick Group, Align, Duplicate & Tools" },
    ],
  },
];

export default function ShortcutsHelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-surface-200 border border-surface-border rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Shortcuts & Touch Reference
              </h2>
              <p className="text-xs text-zinc-400">
                Speed up your motion workflow with keyboard hotkeys & touchscreen gestures
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

        {/* Content */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-5">
          {SHORTCUT_GROUPS.map((grp) => (
            <div key={grp.title}>
              <div className="flex items-center gap-2 mb-2">
                {grp.touch ? (
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Command className="w-3.5 h-3.5 text-brand-400" />
                )}
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  {grp.title}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {grp.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface-100 border border-surface-border text-xs"
                  >
                    <span className="text-zinc-300">{item.desc}</span>
                    {item.keys ? (
                      <div className="flex items-center gap-1">
                        {item.keys.map((k) => (
                          <kbd
                            key={k}
                            className="px-2 py-0.5 rounded bg-surface-200 border border-surface-border/80 text-[10px] font-mono text-zinc-200 shadow-sm"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] font-medium text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {item.gesture}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-surface-border bg-surface-100 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Shortcuts are automatically bypassed while editing text fields
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-surface-200 hover:bg-surface-border text-zinc-200 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
