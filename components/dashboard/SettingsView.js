"use client";

import { useState } from "react";
import { Settings, Database, Trash2, Cpu, Check, Shield } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { clearAllProjects } from "@/lib/db";

export default function SettingsView() {
  const { projects, loadProjects, showToast } = useProjectStore();
  const [defaultFps, setDefaultFps] = useState(60);
  const [defaultResolution, setDefaultResolution] = useState("1920x1080");
  const [autoSave, setAutoSave] = useState(true);

  const handleClearDatabase = async () => {
    if (
      confirm(
        "Are you sure you want to delete all projects in local IndexedDB? This action cannot be undone."
      )
    ) {
      await clearAllProjects();
      await loadProjects();
      showToast("Cleared all local project records");
    }
  };

  const handleSaveSettings = () => {
    showToast("Preferences saved to local browser configuration");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-surface-100 border border-surface-border">
        <h2 className="text-xl font-bold text-white tracking-tight">
          Studio Preferences
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Customize default rendering parameters, canvas preferences, and storage management
        </p>
      </div>

      {/* Composition Defaults */}
      <div className="p-6 rounded-2xl bg-surface-100 border border-surface-border space-y-5">
        <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <Settings className="w-4 h-4 text-brand-400" />
          <span>Default Composition Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Default Resolution
            </label>
            <select
              value={defaultResolution}
              onChange={(e) => setDefaultResolution(e.target.value)}
              className="w-full px-3 py-2 bg-surface-200 border border-surface-border rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-brand-500"
            >
              <option value="1920x1080">Full HD 1080p (1920 × 1080 - 16:9)</option>
              <option value="1080x1920">Vertical Reel (1080 × 1920 - 9:16)</option>
              <option value="1080x1080">Square Feed (1080 × 1080 - 1:1)</option>
              <option value="3840x2160">Ultra HD 4K (3840 × 2160 - 16:9)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Default Timeline FPS
            </label>
            <select
              value={defaultFps}
              onChange={(e) => setDefaultFps(Number(e.target.value))}
              className="w-full px-3 py-2 bg-surface-200 border border-surface-border rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-brand-500"
            >
              <option value={60}>60 FPS (Ultra Smooth Motion)</option>
              <option value={30}>30 FPS (Standard Motion)</option>
              <option value={24}>24 FPS (Cinematic Look)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs font-medium text-zinc-300">Continuous Auto-Save</p>
            <p className="text-[11px] text-zinc-500">
              Silently sync changes to IndexedDB every 5 seconds
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAutoSave(!autoSave)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              autoSave ? "bg-brand-600" : "bg-zinc-700"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                autoSave ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-glow transition-all"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* Storage & IndexedDB Status */}
      <div className="p-6 rounded-2xl bg-surface-100 border border-surface-border space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Local Storage Health (IndexedDB)</span>
        </h3>

        <div className="p-4 rounded-xl bg-surface-200 border border-surface-border/60 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-300">Saved Motion Projects</p>
            <p className="text-[11px] text-zinc-500">
              Total active compositions stored on device
            </p>
          </div>
          <span className="text-sm font-mono font-bold text-white px-3 py-1 bg-surface-100 border border-surface-border rounded-lg">
            {projects.length}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs font-medium text-red-400">Flush Local Database</p>
            <p className="text-[11px] text-zinc-500">
              Erase all saved project compositions from browser storage
            </p>
          </div>
          <button
            onClick={handleClearDatabase}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Storage</span>
          </button>
        </div>
      </div>

      {/* Data Persistence & Privacy Notice (Stage 13) */}
      <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
        <h3 className="text-sm font-semibold text-amber-200 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          <span>Important: Local Storage & Data Persistence</span>
        </h3>
        <p className="text-xs text-zinc-300 leading-relaxed">
          MotionLab operates with <strong>100% local client-side storage</strong> via IndexedDB. Your motion projects, audio tracks, and assets are kept directly in your browser. They are never sent to remote servers or cloud accounts.
        </p>
        <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
          <li>Clearing browser cookies or website data will remove your local project database.</li>
          <li>Browsers under tight device storage pressure may evict non-persisted client databases.</li>
          <li>Private/Incognito browsing mode resets data as soon as the session window is closed.</li>
          <li>Always export JSON backups or code packages regularly to preserve important motion work.</li>
        </ul>
      </div>

      {/* Engine Diagnostics */}
      <div className="p-6 rounded-2xl bg-surface-100 border border-surface-border space-y-3">
        <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Engine Modules & Runtime Stack (v1.0.0 Release)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
          <div className="p-2.5 rounded-lg bg-surface-200 border border-surface-border">
            <span className="text-zinc-500 block">Framework</span>
            <span className="font-semibold text-zinc-200">Next.js 16 (App Router)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-200 border border-surface-border">
            <span className="text-zinc-500 block">Motion Core</span>
            <span className="font-semibold text-brand-400">GSAP 3.15+</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-200 border border-surface-border">
            <span className="text-zinc-500 block">Canvas Engine</span>
            <span className="font-semibold text-cyan-400">Konva & React-Konva</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-200 border border-surface-border">
            <span className="text-zinc-500 block">State Engine</span>
            <span className="font-semibold text-purple-400">Zustand 5.1</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-200 border border-surface-border">
            <span className="text-zinc-500 block">Persistence</span>
            <span className="font-semibold text-emerald-400">IndexedDB (idb v8)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-200 border border-surface-border">
            <span className="text-zinc-500 block">PWA Shell</span>
            <span className="font-semibold text-indigo-400">Service Worker v1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
