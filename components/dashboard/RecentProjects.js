"use client";

import { useState } from "react";
import {
  Film,
  Clock,
  MoreVertical,
  Copy,
  Trash2,
  ExternalLink,
  Plus,
  ArrowRight,
  Monitor,
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import EmptyState from "./EmptyState";

export default function RecentProjects({ limit = 4, showHeader = true }) {
  const {
    projects,
    isLoading,
    searchQuery,
    openNewProjectModal,
    duplicateProject,
    removeProject,
    setActiveTab,
    showToast,
    openProject,
  } = useProjectStore();

  const [activeMenuId, setActiveMenuId] = useState(null);
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState(null);

  // Filter projects by search query if any
  const filtered = projects.filter((p) =>
    searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const displayList = limit ? filtered.slice(0, limit) : filtered;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 bg-surface-100 rounded-lg animate-pulse" />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-56 bg-surface-100 border border-surface-border rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return <EmptyState />;
  }

  const handleDelete = (id, name, e) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      removeProject(id);
      setActiveMenuId(null);
    }
  };

  const handleDuplicate = (id, e) => {
    e.stopPropagation();
    duplicateProject(id);
    setActiveMenuId(null);
  };

  const handleOpenProject = (project) => {
    openProject(project);
  };

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-brand-400" />
            <h2 className="text-base font-semibold text-white">Recent Projects</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-100 text-zinc-400 border border-surface-border">
              {projects.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {projects.length > 4 && (
              <button
                onClick={() => setActiveTab("projects")}
                className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => openNewProjectModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-border border border-surface-border text-xs text-zinc-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayList.map((project) => {
          const isMenuOpen = activeMenuId === project.id;
          const formattedDate = new Date(project.updatedAt).toLocaleDateString(
            undefined,
            { month: "short", day: "numeric" }
          );

          return (
            <div
              key={project.id}
              onClick={() => handleOpenProject(project)}
              className="group relative bg-surface-100 hover:bg-surface-50 border border-surface-border hover:border-brand-500/50 rounded-2xl p-3.5 transition-all duration-200 cursor-pointer shadow-card hover:shadow-glow flex flex-col justify-between"
            >
              {/* Thumbnail Container */}
              <div
                className={`w-full h-36 rounded-xl bg-gradient-to-tr ${
                  project.thumbnailGradient || "from-brand-600 to-indigo-800"
                } relative overflow-hidden flex flex-col justify-between p-3 mb-3 border border-white/10`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-black/50 text-[10px] font-mono text-white/90 backdrop-blur-md border border-white/10">
                    {project.aspectRatio}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-black/50 text-[10px] font-mono text-white/90 backdrop-blur-md border border-white/10">
                    {project.duration}s
                  </span>
                </div>

                <div className="text-center">
                  <span className="text-xs font-semibold text-white/90 drop-shadow truncate block px-2">
                    {project.name}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-white/70">
                  <span>{project.fps} FPS</span>
                  <span>{project.width}x{project.height}</span>
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-brand-400 transition-colors truncate">
                    {project.name}
                  </h3>

                  {/* Actions Dropdown Button */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(isMenuOpen ? null : project.id);
                      }}
                      className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-surface-border/50 transition-colors"
                      aria-label="Project actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-6 z-30 w-36 bg-surface-200 border border-surface-border rounded-xl shadow-xl py-1 text-xs text-zinc-300"
                      >
                        <button
                          onClick={(e) => handleDuplicate(project.id, e)}
                          className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-surface-50 hover:text-white"
                        >
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Duplicate</span>
                        </button>
                        <button
                          onClick={(e) => handleDelete(project.id, project.name, e)}
                          className="w-full px-3 py-2 text-left flex items-center gap-2 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Edited {formattedDate}</span>
                  </span>
                  <span>{project.layers?.length || 1} layers</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Details Modal (when clicked) */}
      {selectedProjectForDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedProjectForDetails(null)}
        >
          <div
            className="w-full max-w-lg bg-surface-200 border border-surface-border rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-brand-400" />
                <h3 className="text-lg font-bold text-white">
                  {selectedProjectForDetails.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProjectForDetails(null)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mb-6 text-xs text-zinc-300">
              <div className="p-3 bg-surface-100 rounded-xl space-y-1.5 border border-surface-border">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Resolution</span>
                  <span className="font-mono text-zinc-200">
                    {selectedProjectForDetails.width} × {selectedProjectForDetails.height} ({selectedProjectForDetails.aspectRatio})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Frame Rate</span>
                  <span className="font-mono text-zinc-200">{selectedProjectForDetails.fps} FPS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Duration</span>
                  <span className="font-mono text-zinc-200">{selectedProjectForDetails.duration} Seconds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Created</span>
                  <span className="text-zinc-400">{new Date(selectedProjectForDetails.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl text-brand-300 text-[11px]">
                Note: Animation Editor is in the upcoming phase. Project specifications and state are preserved in local IndexedDB.
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  const id = selectedProjectForDetails.id;
                  const name = selectedProjectForDetails.name;
                  if (confirm(`Delete "${name}"?`)) {
                    removeProject(id);
                    setSelectedProjectForDetails(null);
                  }
                }}
                className="text-xs text-red-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-red-500/10"
              >
                Delete Project
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    duplicateProject(selectedProjectForDetails.id);
                    setSelectedProjectForDetails(null);
                  }}
                  className="px-3.5 py-2 text-xs font-medium rounded-xl bg-surface-100 hover:bg-surface-border text-zinc-300"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    setSelectedProjectForDetails(null);
                    showToast(`Project "${selectedProjectForDetails.name}" ready`);
                  }}
                  className="px-4 py-2 text-xs font-medium rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-glow"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
