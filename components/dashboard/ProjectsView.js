"use client";

import React, { useRef, useState } from "react";
import {
  FolderKanban,
  Search,
  Grid,
  List,
  Plus,
  Heart,
  Archive,
  Download,
  Upload,
  Copy,
  Trash2,
  Clock,
  Sparkles,
  ArrowRight,
  HardDrive,
  MoreVertical,
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { exportProjectBackup, validateAndParseBackup } from "@/engine/projects/backupManager";
import StorageManagerModal from "@/components/projects/StorageManagerModal";

export default function ProjectsView() {
  const {
    projects,
    openProject,
    removeProject,
    duplicateProject,
    toggleFavoriteProject,
    toggleArchiveProject,
    openNewProjectModal,
    showToast,
    loadProjects,
  } = useProjectStore();

  const fileInputRef = useRef(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'favorites' | 'archived' | 'recent'
  const [viewMode, setViewMode] = useState("grid");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  // Filter Pipeline
  const filtered = projects.filter((p) => {
    if (filter === "favorites" && !p.isFavorite) return false;
    if (filter === "archived" && !p.isArchived) return false;
    if (filter !== "archived" && p.isArchived) return false; // Hide archived from all/favorites
    if (filter === "recent") {
      const isRecent =
        Date.now() - new Date(p.updatedAt || p.createdAt).getTime() <
        7 * 24 * 60 * 60 * 1000;
      if (!isRecent) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (p.name || "").toLowerCase().includes(q);
      const matchTag = (p.tags || []).some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchTag) return false;
    }

    return true;
  });

  const handleBackupExport = (project, e) => {
    e.stopPropagation();
    const { url, filename } = exportProjectBackup(project);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Exported backup "${filename}"`);
  };

  const handleBackupImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const restored = await validateAndParseBackup(file);
      await useProjectStore.getState().createProject(restored);
      showToast(`Imported project "${restored.name}" from backup!`);
      await loadProjects();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to import backup");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-brand-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Projects Manager
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-surface-100 text-zinc-400 border border-surface-border">
              {projects.length} Projects
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Organize, backup, restore, and manage offline motion graphics projects
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleBackupImport}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-surface-100 hover:bg-surface-border border border-surface-border text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition-colors"
            title="Import Project Backup"
          >
            <Upload className="w-4 h-4 text-brand-400" />
            <span className="hidden sm:inline">Import Backup</span>
          </button>

          <button
            onClick={() => setIsStorageModalOpen(true)}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-surface-100 hover:bg-surface-border border border-surface-border text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition-colors"
            title="Manage Storage Quota"
          >
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Storage</span>
          </button>

          <button
            onClick={() => openNewProjectModal()}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-glow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Subtabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: "all", label: "All Projects" },
            { id: "recent", label: "Recent" },
            { id: "favorites", label: "Favorites" },
            { id: "archived", label: "Archived" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filter === tab.id
                  ? "bg-brand-600 text-white shadow-glow"
                  : "bg-surface-100 text-zinc-400 hover:text-zinc-200 border border-surface-border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & View Mode */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full min-h-[40px] bg-surface-100 border border-surface-border rounded-xl pl-9 pr-3 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center bg-surface-100 border border-surface-border rounded-xl p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`min-h-[36px] min-w-[36px] p-2 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === "grid" ? "bg-brand-600 text-white shadow-glow" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`min-h-[36px] min-w-[36px] p-2 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === "list" ? "bg-brand-600 text-white shadow-glow" : "text-zinc-400 hover:text-white"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid / List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-surface-100/40 border border-surface-border space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 border border-surface-border flex items-center justify-center mx-auto text-zinc-500">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Projects Found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {filter === "archived"
              ? "You have no archived projects."
              : "Create a new project or import a backup to get started."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((proj) => {
            const isFav = !!proj.isFavorite;
            const isArchived = !!proj.isArchived;

            return (
              <div
                key={proj.id}
                onClick={() => openProject(proj)}
                className="group rounded-3xl bg-surface-100 border border-surface-border hover:border-brand-500/50 shadow-card hover:shadow-glow transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
              >
                {/* Card Thumbnail */}
                <div
                  className={`h-36 w-full bg-gradient-to-tr ${
                    proj.thumbnailGradient || "from-brand-600 via-indigo-600 to-purple-600"
                  } relative p-4 flex flex-col justify-between overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20">
                      {proj.aspectRatio || "16:9"}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteProject(proj.id);
                      }}
                      className={`min-w-[32px] min-h-[32px] rounded-full p-1.5 flex items-center justify-center backdrop-blur-md transition-transform active:scale-90 ${
                        isFav ? "bg-rose-500 text-white" : "bg-black/50 text-white/70 hover:text-white"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
                    </button>
                  </div>

                  <div className="relative z-10 text-white drop-shadow font-mono text-[10px]">
                    <span>{proj.width}×{proj.height}</span>
                    <span> • </span>
                    <span>{proj.duration}s @ {proj.fps}fps</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-brand-300 transition-colors truncate">
                      {proj.name}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Edited: {new Date(proj.updatedAt || proj.createdAt).toLocaleString()}</span>
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-surface-border/50 text-xs">
                    <span className="text-[10px] font-mono text-zinc-400">
                      {proj.layers?.length || 0} Layers
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Duplicate */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateProject(proj.id);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-200 transition-colors"
                        title="Duplicate Project"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Export Backup */}
                      <button
                        onClick={(e) => handleBackupExport(proj, e)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-200 transition-colors"
                        title="Export Backup JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* Archive */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleArchiveProject(proj.id);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isArchived ? "text-amber-400" : "text-zinc-400 hover:text-white hover:bg-surface-200"
                        }`}
                        title={isArchived ? "Restore Project" : "Archive Project"}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (deleteConfirmId === proj.id) {
                            removeProject(proj.id);
                            setDeleteConfirmId(null);
                          } else {
                            setDeleteConfirmId(proj.id);
                          }
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          deleteConfirmId === proj.id
                            ? "bg-red-600 text-white"
                            : "text-zinc-400 hover:text-red-400 hover:bg-surface-200"
                        }`}
                        title={deleteConfirmId === proj.id ? "Click again to confirm delete" : "Delete Project"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2.5">
          {filtered.map((proj) => (
            <div
              key={proj.id}
              onClick={() => openProject(proj)}
              className="p-3.5 rounded-2xl bg-surface-100 border border-surface-border hover:border-brand-500/50 flex items-center justify-between gap-4 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${
                    proj.thumbnailGradient || "from-brand-600 to-purple-600"
                  } shrink-0 flex items-center justify-center font-bold text-white text-xs`}
                >
                  {proj.aspectRatio || "16:9"}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-white text-sm truncate">{proj.name}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-0.5">
                    <span>{new Date(proj.updatedAt || proj.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{proj.layers?.length || 0} Layers</span>
                    <span>•</span>
                    <span>{proj.duration}s</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => handleBackupExport(proj, e)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-surface-200 transition-colors"
                  title="Export Backup"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavoriteProject(proj.id);
                  }}
                  className={`p-2 rounded-xl transition-colors ${
                    proj.isFavorite ? "text-rose-400 bg-rose-500/20" : "text-zinc-500 hover:text-white"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${proj.isFavorite ? "fill-current" : ""}`} />
                </button>
                <button
                  onClick={() => openProject(proj)}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Storage Manager Modal */}
      <StorageManagerModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
      />
    </div>
  );
}
