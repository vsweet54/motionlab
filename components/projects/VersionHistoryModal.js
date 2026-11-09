"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  History,
  RotateCcw,
  Trash2,
  Copy,
  Clock,
  Layers,
  Sparkles,
  Check,
  AlertCircle,
} from "lucide-react";
import { loadProjectSnapshots, restoreProjectFromSnapshot, deleteSnapshot } from "@/engine/projects/versionManager";
import { useEditorStore } from "@/store/useEditorStore";
import { useProjectStore } from "@/store/useProjectStore";

export default function VersionHistoryModal({ isOpen, onClose }) {
  const { project, initProject } = useEditorStore();
  const { showToast } = useProjectStore();

  const [snapshots, setSnapshots] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && project?.id) {
      setIsLoading(true);
      loadProjectSnapshots(project.id).then((snaps) => {
        setSnapshots(snaps);
        setSelectedSnapshot(snaps[0] || null);
        setIsLoading(false);
      });
    }
  }, [isOpen, project?.id]);

  if (!isOpen) return null;

  const handleRestore = () => {
    if (!selectedSnapshot) return;
    const restored = restoreProjectFromSnapshot(selectedSnapshot);
    initProject(restored);
    showToast(`Restored version from ${new Date(selectedSnapshot.createdAt).toLocaleString()}`);
    onClose();
  };

  const handleDelete = async (snapshotId) => {
    await deleteSnapshot(snapshotId);
    const updated = snapshots.filter((s) => s.id !== snapshotId);
    setSnapshots(updated);
    if (selectedSnapshot?.id === snapshotId) {
      setSelectedSnapshot(updated[0] || null);
    }
    showToast("Version snapshot deleted");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-surface-200 border border-surface-border rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-xs text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border bg-surface-100/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Version History & Snapshots</h3>
              <p className="text-[11px] text-zinc-400">
                Inspect historical saves and rollback project state safely
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

        {/* Body (Sidebar + Preview) */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Left: Snapshots List */}
          <div className="w-full sm:w-64 border-b sm:border-b-0 sm:border-r border-surface-border p-3 overflow-y-auto space-y-1.5 max-h-[35vh] sm:max-h-full">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 block mb-1">
              Snapshots ({snapshots.length})
            </span>

            {isLoading ? (
              <div className="text-center py-6 text-zinc-500 font-mono text-xs">
                Loading history...
              </div>
            ) : snapshots.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 px-3">
                No snapshots recorded yet. Manual saves create historical snapshots.
              </div>
            ) : (
              snapshots.map((snap) => (
                <div
                  key={snap.id}
                  onClick={() => setSelectedSnapshot(snap)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedSnapshot?.id === snap.id
                      ? "bg-cyan-600/20 border-cyan-500/50 text-white"
                      : "bg-surface-100 border-surface-border text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold truncate max-w-[120px]">
                      {snap.note || "Snapshot"}
                    </span>
                    <span className="font-mono text-[9px] text-zinc-500">
                      {new Date(snap.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    {new Date(snap.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: Snapshot Detail View */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {selectedSnapshot ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-white text-base">
                    {selectedSnapshot.name}
                  </h4>
                  <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Saved: {new Date(selectedSnapshot.createdAt).toLocaleString()}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-surface-100 border border-surface-border">
                    <span className="text-[10px] text-zinc-500 block mb-0.5">Layers</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {selectedSnapshot.data?.layers?.length || 0} Objects
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-surface-100 border border-surface-border">
                    <span className="text-[10px] text-zinc-500 block mb-0.5">Keyframes</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {selectedSnapshot.data?.keyframes?.length || 0} Keyframes
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-100 border border-surface-border space-y-2">
                  <span className="font-semibold text-zinc-300 block">Objects in Version:</span>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {(selectedSnapshot.data?.layers || []).map((l, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-[11px] py-1 border-b border-surface-border/40 last:border-0"
                      >
                        <span className="text-zinc-300 truncate max-w-[200px]">{l.name}</span>
                        <span className="text-zinc-500 uppercase font-mono text-[9px]">{l.type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-surface-border">
                  <button
                    onClick={() => handleDelete(selectedSnapshot.id)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Snapshot</span>
                  </button>

                  <button
                    onClick={handleRestore}
                    className="min-h-[40px] px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-2 shadow-glow transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restore This Version</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-500">
                Select a version snapshot to view details and rollback options.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
