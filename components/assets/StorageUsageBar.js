"use client";

import React, { useState } from "react";
import { HardDrive, ShieldCheck, Trash2, RefreshCw } from "lucide-react";
import { requestPersistentStorage } from "@/engine/storage/assetStorage";
import { useProjectStore } from "@/store/useProjectStore";

export default function StorageUsageBar({
  storageInfo,
  onCleanUnused,
  onRefresh,
}) {
  const [isRequestingPersist, setIsRequestingPersist] = useState(false);
  const showToast = useProjectStore((s) => s.showToast);

  const handleEnablePersistence = async () => {
    setIsRequestingPersist(true);
    try {
      const granted = await requestPersistentStorage();
      if (granted) {
        showToast("Persistent storage enabled: browser won't evict assets");
      } else {
        showToast("Browser denied persistent storage request");
      }
      if (onRefresh) onRefresh();
    } catch {
      showToast("Could not request storage persistence");
    } finally {
      setIsRequestingPersist(false);
    }
  };

  const percent = Math.min(100, Math.max(0, storageInfo.usagePercent || 0));

  return (
    <div className="p-3 bg-surface-100 rounded-xl border border-surface-border space-y-2 select-none text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="w-3.5 h-3.5 text-brand-400" />
          <span className="font-semibold text-zinc-200">Local Storage</span>
          <span className="text-[11px] font-mono text-zinc-400">
            {storageInfo.usageFormatted} / {storageInfo.quotaFormatted} ({percent}%)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {storageInfo.isPersisted ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              title="Assets will not be evicted under low device storage"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Persisted</span>
            </span>
          ) : (
            <button
              onClick={handleEnablePersistence}
              disabled={isRequestingPersist}
              className="px-2 py-0.5 rounded text-[10px] font-medium text-brand-400 hover:text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 transition-colors"
              title="Request browser storage persistence"
            >
              Enable Persistence
            </button>
          )}

          {onCleanUnused && (
            <button
              onClick={onCleanUnused}
              className="p-1 rounded text-zinc-400 hover:text-amber-400 hover:bg-surface-border transition-colors"
              title="Clean unreferenced assets from IndexedDB"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-surface-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            percent > 85 ? "bg-red-500" : percent > 60 ? "bg-amber-500" : "bg-brand-500"
          }`}
          style={{ width: `${Math.max(2, percent)}%` }}
        />
      </div>
    </div>
  );
}
