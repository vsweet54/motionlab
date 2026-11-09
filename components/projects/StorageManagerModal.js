"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  HardDrive,
  Trash2,
  RefreshCw,
  FolderKanban,
  Sparkles,
  Layers,
  History,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { getDetailedStorageStats, cleanStaleRecoveryData } from "@/engine/projects/storageManager";
import { cleanupUnusedAssets, requestPersistentStorage } from "@/lib/storage/db";
import { useProjectStore } from "@/store/useProjectStore";

export default function StorageManagerModal({ isOpen, onClose }) {
  const { showToast } = useProjectStore();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);

  const loadStats = async () => {
    setIsLoading(true);
    const data = await getDetailedStorageStats();
    setStats(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCleanAssets = async () => {
    setIsCleaning(true);
    try {
      const res = await cleanupUnusedAssets();
      await cleanStaleRecoveryData();
      showToast(`Cleaned ${res.count} unused files (${res.reclaimedFormatted} freed)`);
      await loadStats();
    } catch (err) {
      console.error(err);
      showToast("Cleanup operation failed");
    } finally {
      setIsCleaning(false);
    }
  };

  const handleRequestPersistence = async () => {
    const persisted = await requestPersistentStorage();
    if (persisted) {
      showToast("Persistent storage granted by browser!");
    } else {
      showToast("Persistence request completed");
    }
    await loadStats();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-surface-200 border border-surface-border rounded-3xl p-5 shadow-2xl space-y-5 text-xs text-zinc-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Local Storage & Quota Manager</h3>
              <p className="text-[11px] text-zinc-400">
                Inspect local IndexedDB disk consumption & optimize offline cache
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

        {/* Quota Progress */}
        {stats && (
          <div className="p-4 rounded-2xl bg-surface-100 border border-surface-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-200">Storage Usage</span>
              <span className="font-mono text-zinc-400 font-semibold">
                {stats.usageFormatted} / {stats.quotaFormatted} ({stats.usagePercent}%)
              </span>
            </div>
            <div className="w-full bg-surface-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, stats.usagePercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span>Browser estimate based on device free disk capacity</span>
              {stats.isPersisted ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Persisted
                </span>
              ) : (
                <button
                  onClick={handleRequestPersistence}
                  className="text-brand-400 font-semibold hover:underline"
                >
                  Request Persistent Storage
                </button>
              )}
            </div>
          </div>
        )}

        {/* Breakdown Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-surface-100 border border-surface-border">
            <span className="text-[10px] text-zinc-500 block mb-0.5">Projects</span>
            <div className="flex items-center gap-1.5 text-sm font-bold text-white font-mono">
              <FolderKanban className="w-3.5 h-3.5 text-brand-400" />
              <span>{stats?.projectCount || 0}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-surface-100 border border-surface-border">
            <span className="text-[10px] text-zinc-500 block mb-0.5">Templates</span>
            <div className="flex items-center gap-1.5 text-sm font-bold text-white font-mono">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>{stats?.templateCount || 0}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-surface-100 border border-surface-border">
            <span className="text-[10px] text-zinc-500 block mb-0.5">Media Assets</span>
            <div className="flex items-center gap-1.5 text-sm font-bold text-white font-mono">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>{stats?.assetCount || 0}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-surface-100 border border-surface-border">
            <span className="text-[10px] text-zinc-500 block mb-0.5">Snapshots</span>
            <div className="flex items-center gap-1.5 text-sm font-bold text-white font-mono">
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>{stats?.snapshotCount || 0}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-surface-100 border border-surface-border col-span-2 sm:col-span-1">
            <span className="text-[10px] text-zinc-500 block mb-0.5">Crash Recovery Buffers</span>
            <span className="text-sm font-bold text-white font-mono">
              {stats?.recoveryCount || 0} Active
            </span>
          </div>
        </div>

        {/* Maintenance Actions */}
        <div className="p-4 rounded-2xl bg-surface-100 border border-surface-border space-y-3">
          <span className="font-bold text-zinc-200 block">Safe Storage Optimization</span>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Clean up unreferenced media thumbnails and purge stale recovery buffers. Your saved projects and active templates are protected and will never be deleted.
          </p>

          <button
            onClick={handleCleanAssets}
            disabled={isCleaning}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-surface-200 hover:bg-surface-border border border-surface-border text-zinc-200 font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isCleaning ? "animate-spin" : ""}`} />
            <span>{isCleaning ? "Optimizing Storage..." : "Clean Unused Assets & Stale Caches"}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-surface-border flex justify-end">
          <button
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-surface-100 hover:bg-surface-border border border-surface-border font-semibold text-zinc-300 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
