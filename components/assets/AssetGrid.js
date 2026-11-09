"use client";

import React from "react";
import AssetCard from "./AssetCard";
import { Upload, FolderOpen } from "lucide-react";

export default function AssetGrid({
  assets,
  viewMode = "grid",
  onSelect,
  onPreview,
  onEdit,
  onToggleFavorite,
  onDuplicate,
  onDelete,
  onAddToCanvas,
  onImportClick,
}) {
  if (assets.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-zinc-800 bg-surface-100/40 select-none min-h-[260px]">
        <FolderOpen className="w-12 h-12 text-zinc-600 mb-3" />
        <h3 className="text-sm font-semibold text-zinc-300">No assets found</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
          No files match your current search or category filter. Import new media to build your motion graphics library.
        </p>
        {onImportClick && (
          <button
            onClick={onImportClick}
            className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Import Media</span>
          </button>
        )}
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-2">
        {assets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            viewMode="list"
            onSelect={onSelect}
            onPreview={onPreview}
            onEdit={onEdit}
            onToggleFavorite={onToggleFavorite}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onAddToCanvas={onAddToCanvas}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          viewMode="grid"
          onSelect={onSelect}
          onPreview={onPreview}
          onEdit={onEdit}
          onToggleFavorite={onToggleFavorite}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onAddToCanvas={onAddToCanvas}
        />
      ))}
    </div>
  );
}
