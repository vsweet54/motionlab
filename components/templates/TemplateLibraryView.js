"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Sparkles,
  Search,
  Filter,
  Grid,
  List,
  Upload,
  Download,
  Heart,
  Copy,
  Trash2,
  Clock,
  Play,
  ArrowRight,
  BookmarkPlus,
  FolderOpen,
} from "lucide-react";
import { useTemplateStore } from "@/store/useTemplateStore";
import { useProjectStore } from "@/store/useProjectStore";
import { TEMPLATE_CATEGORIES } from "@/engine/templates";
import TemplateDetailModal from "@/components/templates/TemplateDetailModal";

export default function TemplateLibraryView() {
  const {
    templates,
    isLoading,
    loadTemplates,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    setPreviewingTemplate,
    toggleFavorite,
    removeTemplate,
    duplicateTemplate,
    instantiateTemplate,
    exportTemplateFile,
    importTemplateFile,
  } = useTemplateStore();

  const { openProject, showToast } = useProjectStore();
  const fileInputRef = useRef(null);

  // Active subtab: 'all' | 'custom' | 'favorites' | 'recent'
  const [activeSubTab, setActiveSubTab] = useState("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Filter and Sort Pipeline
  const filteredTemplates = templates.filter((t) => {
    // 1. Subtab filtering
    if (activeSubTab === "custom" && !t.isCustom) return false;
    if (activeSubTab === "favorites" && !t.isFavorite) return false;
    if (activeSubTab === "recent" && !t.lastUsedAt) return false;

    // 2. Category filtering
    if (selectedCategory !== "All" && t.category !== selectedCategory) {
      return false;
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (t.title || t.name || "").toLowerCase().includes(q);
      const matchDesc = (t.description || "").toLowerCase().includes(q);
      const matchTag = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTag) return false;
    }

    return true;
  });

  // Sorting
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (sortBy === "name") {
      return (a.title || a.name).localeCompare(b.title || b.name);
    }
    if (sortBy === "duration") {
      return (b.duration || 0) - (a.duration || 0);
    }
    if (sortBy === "recently_used") {
      return new Date(b.lastUsedAt || 0) - new Date(a.lastUsedAt || 0);
    }
    // Default newest
    return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  });

  const handleUseTemplate = async (template, e) => {
    e.stopPropagation();
    try {
      const newProject = await instantiateTemplate(template);
      openProject(newProject);
      showToast(`Project created from "${template.title || template.name}"`);
    } catch (err) {
      console.error(err);
      showToast("Failed to launch template project");
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importTemplateFile(file);
      showToast(`Template "${imported.title}" imported successfully!`);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to import template JSON");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteTemplate = async (templateId, e) => {
    e.stopPropagation();
    await removeTemplate(templateId);
    setDeleteConfirmId(null);
    showToast("Template deleted from storage");
  };

  return (
    <div className="space-y-6 select-none">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Professional Template Library
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-surface-100 text-zinc-400 border border-surface-border">
              {templates.length} Templates
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Production-ready motion designs with full timeline keyframe control
          </p>
        </div>

        {/* Action Controls: Import, Grid/List view */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-surface-100 hover:bg-surface-border border border-surface-border text-xs font-semibold text-zinc-200 flex items-center gap-2 transition-colors active:scale-95"
            title="Import Template JSON"
          >
            <Upload className="w-4 h-4 text-brand-400" />
            <span>Import JSON</span>
          </button>

          <div className="flex items-center bg-surface-100 border border-surface-border rounded-xl p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`min-h-[38px] min-w-[38px] p-2 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === "grid"
                  ? "bg-brand-600 text-white shadow-glow"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`min-h-[38px] min-w-[38px] p-2 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === "list"
                  ? "bg-brand-600 text-white shadow-glow"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subtab Segmented Navigation: All / My Templates / Favorites / Recently Used */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "all", label: "All Templates" },
          { id: "custom", label: "My Templates" },
          { id: "favorites", label: "Favorites" },
          { id: "recent", label: "Recently Used" },
        ].map((sub) => (
          <button
            key={sub.id}
            onClick={() => setActiveSubTab(sub.id)}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSubTab === sub.id
                ? "bg-brand-600 text-white shadow-glow"
                : "bg-surface-100 text-zinc-400 hover:text-zinc-200 border border-surface-border"
            }`}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {/* Search, Category Filter, and Sorting Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates by title, description, or tags..."
            className="w-full min-h-[44px] bg-surface-100 border border-surface-border rounded-xl pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-zinc-400 hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="min-h-[44px] bg-surface-100 border border-surface-border rounded-xl px-3 text-xs text-white focus:outline-none focus:border-brand-500 font-medium"
          >
            <option value="newest">Newest First</option>
            <option value="name">Alphabetical (A-Z)</option>
            <option value="duration">Longest Duration</option>
            <option value="recently_used">Recently Used</option>
          </select>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-purple-600 text-white shadow-glow"
                : "bg-surface-100 text-zinc-400 hover:text-zinc-200 border border-surface-border"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template Grid / List Container */}
      {sortedTemplates.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-surface-100/40 border border-surface-border space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 border border-surface-border flex items-center justify-center mx-auto text-zinc-500">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Templates Found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Try adjusting your search query, clearing filters, or saving an active project as a template.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedTemplates.map((template) => {
            const isFav = !!template.isFavorite;

            return (
              <div
                key={template.id}
                onClick={() => setPreviewingTemplate(template)}
                className="group rounded-3xl bg-surface-100 border border-surface-border hover:border-brand-500/50 shadow-card hover:shadow-glow transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
              >
                {/* Banner Thumbnail */}
                <div
                  className={`h-40 w-full bg-gradient-to-tr ${
                    template.gradient || "from-indigo-600 via-purple-600 to-pink-600"
                  } relative p-4 flex flex-col justify-between overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors" />

                  {/* Top Badges */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-black/60 text-white backdrop-blur-md border border-white/20">
                      {template.category}
                    </span>

                    {/* Quick Favorite Icon Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(template.id);
                      }}
                      className={`min-w-[34px] min-h-[34px] rounded-full p-2 flex items-center justify-center backdrop-blur-md transition-transform active:scale-90 ${
                        isFav ? "bg-rose-500 text-white" : "bg-black/50 text-white/70 hover:text-white"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
                    </button>
                  </div>

                  {/* Bottom Duration Badge */}
                  <div className="relative z-10 flex items-center justify-between text-white drop-shadow">
                    <span className="text-[11px] font-mono font-bold bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-md">
                      {template.duration}s • {template.fps || 60}fps
                    </span>
                    <span className="text-[11px] font-mono bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-md">
                      {template.aspectRatio || "16:9"}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-brand-300 transition-colors truncate">
                      {template.title || template.name}
                    </h3>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                      {template.description}
                    </p>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-surface-border/50">
                    <span className="text-[10px] font-mono text-zinc-500">
                      {template.layers?.length || 0} Layers
                    </span>

                    <div className="flex items-center gap-1.5">
                      {template.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (deleteConfirmId === template.id) {
                              handleDeleteTemplate(template.id, e);
                            } else {
                              setDeleteConfirmId(template.id);
                            }
                          }}
                          className={`min-w-[32px] min-h-[32px] p-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center transition-colors ${
                            deleteConfirmId === template.id
                              ? "bg-red-600 text-white border-red-500"
                              : "bg-surface-200 text-zinc-400 hover:text-red-400 border-surface-border"
                          }`}
                          title={deleteConfirmId === template.id ? "Click again to confirm delete" : "Delete Template"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={(e) => handleUseTemplate(template, e)}
                        className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                      >
                        <span>Use</span>
                        <ArrowRight className="w-3.5 h-3.5" />
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
          {sortedTemplates.map((template) => {
            const isFav = !!template.isFavorite;

            return (
              <div
                key={template.id}
                onClick={() => setPreviewingTemplate(template)}
                className="group rounded-2xl bg-surface-100 border border-surface-border hover:border-brand-500/50 p-3 sm:p-4 flex items-center justify-between gap-4 cursor-pointer transition-all hover:bg-surface-border/20"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-tr ${
                      template.gradient || "from-indigo-600 to-purple-600"
                    } shrink-0 flex items-center justify-center shadow-sm`}
                  >
                    <Play className="w-5 h-5 text-white/80 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm truncate">
                        {template.title || template.name}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-200 text-zinc-400 font-semibold border border-surface-border">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {template.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-mono text-zinc-400 hidden md:inline">
                    {template.duration}s • {template.aspectRatio || "16:9"}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(template.id);
                    }}
                    className={`min-w-[36px] min-h-[36px] p-2 rounded-xl flex items-center justify-center transition-colors ${
                      isFav ? "text-rose-400 bg-rose-500/20" : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
                  </button>

                  <button
                    onClick={(e) => handleUseTemplate(template, e)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>Use Template</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Template Detail Modal */}
      <TemplateDetailModal />
    </div>
  );
}
