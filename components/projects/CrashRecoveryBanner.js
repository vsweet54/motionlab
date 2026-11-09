"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  RotateCcw,
  Trash2,
  Clock,
  Sparkles,
} from "lucide-react";
import { getAllRecoveryRecords, clearRecoveryData } from "@/lib/storage/db";
import { useProjectStore } from "@/store/useProjectStore";

export default function CrashRecoveryBanner() {
  const { openProject, showToast, loadProjects } = useProjectStore();
  const [recoveryRecord, setRecoveryRecord] = useState(null);

  useEffect(() => {
    getAllRecoveryRecords().then((records) => {
      if (records && records.length > 0) {
        // Pick the most recent recovery item
        const sorted = records.sort(
          (a, b) => new Date(b.savedAt) - new Date(a.savedAt)
        );
        setRecoveryRecord(sorted[0]);
      }
    });
  }, []);

  if (!recoveryRecord) return null;

  const handleRecover = () => {
    const recoveredProject = recoveryRecord.data;
    clearRecoveryData(recoveryRecord.projectId).then(() => {
      setRecoveryRecord(null);
      loadProjects();
      openProject(recoveredProject);
      showToast(`Recovered unsaved session for "${recoveredProject.name}"!`);
    });
  };

  const handleDiscard = () => {
    clearRecoveryData(recoveryRecord.projectId).then(() => {
      setRecoveryRecord(null);
      showToast("Recovery data discarded");
    });
  };

  return (
    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 sm:p-4 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm">
            Unsaved Project Session Detected
          </h4>
          <p className="text-zinc-300 text-[11px] mt-0.5">
            A session for <span className="font-semibold text-amber-300">"{recoveryRecord.data?.name || "Untitled"}"</span> was interrupted unexpectedly on {new Date(recoveryRecord.savedAt).toLocaleTimeString()}.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          onClick={handleDiscard}
          className="min-h-[36px] px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-border text-zinc-400 hover:text-white border border-surface-border text-xs font-semibold transition-colors"
        >
          Discard
        </button>
        <button
          onClick={handleRecover}
          className="min-h-[36px] px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Recover Session</span>
        </button>
      </div>
    </div>
  );
}
