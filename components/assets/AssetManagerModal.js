"use client";

import React, { useRef, useState } from "react";
import {
  X,
  Search,
  Upload,
  Grid,
  List,
  Star,
  Filter,
  ArrowUpDown,
  RefreshCw,
  FolderOpen,
  Image as ImageIcon,
  Film,
  Music,
  Type,
  Compass,
} from "lucide-react";
import { useAssetManager } from "@/hooks/assets/useAssetManager";
import AssetGrid from "./AssetGrid";
import AssetDetailModal from "./AssetDetailModal";
import AssetPreviewModal from "./AssetPreviewModal";
import AssetImageEditor from "./AssetImageEditor";
import StorageUsageBar from "./StorageUsageBar";

const CATEGORIES = [
  { key: "all", label: "All Assets", icon: FolderOpen },
  { key: "image", label: "Images", icon: ImageIcon },
  { key: "video", label: "Videos", icon: Film },
  { key: "audio", label: "Audio", icon: Music },
  { key: "font", label: "Fonts", icon: Type },
  { key: "svg", label: "Vector SVG", icon: Compass },
];

export default function AssetManagerModal({
  isOpen = true,
  isModal = true,
  onClose,
  onAddToCanvas,
}) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    assets,
    allAssetsCount,
    isLoading,
    importProgress,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    favoritesOnly,
    setFavoritesOnly,
    viewMode,
    setViewMode,
    selectedAsset,
    setSelectedAsset,
    previewAsset,
    setPreviewAsset,
    editingAsset,
    setEditingAsset,
    storageInfo,
    handleImportFiles,
    handleDeleteAsset,
    handleRenameAsset,
    handleToggleFavorite,
    handleDuplicateAsset,
    handleSaveEditedImage,
    handleCleanUnused,
    refreshAssets,
  } = useAssetManager();

  if (!isOpen && isModal) return null;

  // File input change
  const onFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImportFiles(files);
      e.target.value = "";
    }
  };

  // Desktop Drag and drop files to import
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleImportFiles(files);
    }
  };

  const content = (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col h-full bg-surface-200 text-zinc-100 select-none relative ${
        isModal
          ? "w-full max-w-6xl max-h-[92vh] rounded-3xl border border-surface-border shadow-2xl overflow-hidden"
          : "w-full rounded-2xl border border-surface-border"
      }`}
    >
      {/* Hidden File Input for Native Android / Desktop Picker */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/mp4,video/webm,audio/*,.ttf,.otf,.woff,.woff2,.svg"
        onChange={onFileInputChange}
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-surface-border bg-surface-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/30">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-white tracking-tight">
                Asset Vault & Media Library
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-200 text-zinc-400 border border-surface-border">
                {allAssetsCount} files
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Locally cached in IndexedDB: images, videos, audio, fonts, and vector SVGs
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all active:scale-95 min-h-[44px]"
          >
            <Upload className="w-4 h-4" />
            <span>Import Media</span>
          </button>

          <button
            onClick={refreshAssets}
            className="p-2.5 rounded-xl bg-surface-200 hover:bg-surface-border border border-surface-border text-zinc-300 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Refresh assets"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-surface-200 hover:bg-surface-border border border-surface-border text-zinc-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Close Asset Vault"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter, Search & View Controls Bar */}
      <div className="p-4 border-b border-surface-border bg-surface-150 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-100 border border-surface-border rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-brand-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right Filter Chips & Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Favorite Toggle */}
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors min-h-[38px] ${
              favoritesOnly
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : "bg-surface-100 border-surface-border text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoritesOnly ? "fill-amber-400" : ""}`} />
            <span>Favorites</span>
          </button>

          {/* Sort By Dropdown */}
          <div className="flex items-center rounded-xl bg-surface-100 border border-surface-border p-0.5 text-xs">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-zinc-300 px-2 py-1.5 outline-none cursor-pointer"
            >
              <option value="date" className="bg-surface-200">Date Added</option>
              <option value="name" className="bg-surface-200">Name</option>
              <option value="size" className="bg-surface-200">File Size</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-1.5 text-zinc-400 hover:text-white"
              title={sortOrder === "asc" ? "Ascending" : "Descending"}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center rounded-xl bg-surface-100 border border-surface-border p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === "grid"
                  ? "bg-brand-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === "list"
                  ? "bg-brand-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="px-5 py-2.5 border-b border-surface-border bg-surface-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[36px] ${
                isActive
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-surface-200 text-zinc-400 hover:text-zinc-200 hover:bg-surface-border border border-surface-border/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Import Progress Indicator */}
      {importProgress && (
        <div className="p-3 bg-brand-600/10 border-b border-brand-500/20 px-5 flex items-center justify-between text-xs text-brand-300">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 animate-bounce" />
            <span>
              Importing {importProgress.current} of {importProgress.total}:{" "}
              <strong className="text-white">{importProgress.currentFileName}</strong>
            </span>
          </div>
          <div className="w-32 h-1.5 bg-surface-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all duration-200"
              style={{
                width: `${(importProgress.current / importProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Drag & Drop Overlay Indicator */}
      {isDragOver && (
        <div className="absolute inset-0 bg-brand-900/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center border-4 border-dashed border-brand-400 m-2 rounded-2xl pointer-events-none">
          <Upload className="w-12 h-12 text-brand-400 animate-pulse mb-3" />
          <h3 className="text-base font-bold text-white">Drop files here to import</h3>
          <p className="text-xs text-zinc-300 mt-1">
            Accepts PNG, JPG, WebP, SVG, MP4, WebM, MP3, WAV, TTF, WOFF
          </p>
        </div>
      )}

      {/* Main Asset Grid / List Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        <AssetGrid
          assets={assets}
          viewMode={viewMode}
          onSelect={(asset) => setSelectedAsset(asset)}
          onPreview={(asset) => setPreviewAsset(asset)}
          onEdit={(asset) => setEditingAsset(asset)}
          onToggleFavorite={handleToggleFavorite}
          onDuplicate={handleDuplicateAsset}
          onDelete={handleDeleteAsset}
          onAddToCanvas={onAddToCanvas}
          onImportClick={() => fileInputRef.current?.click()}
        />
      </div>

      {/* Footer Storage Indicator */}
      <div className="p-4 border-t border-surface-border bg-surface-100">
        <StorageUsageBar
          storageInfo={storageInfo}
          onCleanUnused={handleCleanUnused}
          onRefresh={refreshAssets}
        />
      </div>

      {/* Sub-modals & Sheets */}
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onRename={handleRenameAsset}
          onToggleFavorite={handleToggleFavorite}
          onDuplicate={handleDuplicateAsset}
          onDelete={handleDeleteAsset}
          onPreview={(a) => setPreviewAsset(a)}
          onEditImage={(a) => setEditingAsset(a)}
          onAddToCanvas={onAddToCanvas}
        />
      )}

      {previewAsset && (
        <AssetPreviewModal
          asset={previewAsset}
          onClose={() => setPreviewAsset(null)}
          onAddToCanvas={onAddToCanvas}
          onEditImage={(a) => setEditingAsset(a)}
        />
      )}

      {editingAsset && (
        <AssetImageEditor
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onSave={handleSaveEditedImage}
        />
      )}
    </div>
  );

  if (!isModal) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none animate-fade-in">
      {content}
    </div>
  );
}
