"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Download,
  Star,
  Check,
} from "lucide-react";
import { formatBytes } from "@/lib/storage/db";

export default function AssetDetailModal({
  asset,
  onClose,
  onRename,
  onToggleFavorite,
  onDuplicate,
  onDelete,
  onPreview,
  onEditImage,
  onAddToCanvas,
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(asset?.name || "");

  if (!asset) return null;

  const handleNameSave = () => {
    setIsEditingName(false);
    if (nameInput.trim() && nameInput.trim() !== asset.name) {
      if (onRename) onRename(asset.id, nameInput.trim());
    }
  };

  const src = asset.liveUrl || asset.thumbnail;

  const handleDownload = () => {
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = asset.originalName || `${asset.name}.${asset.metadata?.format || "bin"}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full sm:max-w-lg bg-surface-200 border-t sm:border border-surface-border rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-100">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-brand-500/20 text-brand-400">
              {asset.category}
            </span>
            <h3 className="font-semibold text-sm text-zinc-100">Asset Details</h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleFavorite && onToggleFavorite(asset.id, asset.isFavorite)}
              className={`p-2 rounded-lg hover:bg-surface-200 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center ${
                asset.isFavorite ? "text-amber-400" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Star className={`w-4 h-4 ${asset.isFavorite ? "fill-amber-400" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-200 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Thumbnail preview banner */}
          <div
            onClick={() => onPreview && onPreview(asset)}
            className="w-full h-44 rounded-xl bg-[#09090d] border border-surface-border flex items-center justify-center overflow-hidden cursor-pointer relative group"
          >
            {src && (asset.category === "image" || asset.category === "svg" || asset.category === "video") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={asset.name}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="text-zinc-500 text-xs font-mono">
                Click to preview {asset.category}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Eye className="w-5 h-5 text-white" />
              <span className="text-xs text-white font-medium">Click to Full Preview</span>
            </div>
          </div>

          {/* Asset Name Edit */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Asset Name
            </label>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleNameSave();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  autoFocus
                  className="flex-1 bg-surface-100 border border-brand-500 rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none"
                />
                <button
                  onClick={handleNameSave}
                  className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white min-w-[40px] min-h-[40px] flex items-center justify-center"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 bg-surface-100 rounded-xl border border-surface-border">
                <span className="font-semibold text-xs text-white truncate mr-2">
                  {asset.name}
                </span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-xs text-brand-400 hover:text-brand-300 font-medium px-2 py-1 rounded hover:bg-surface-border transition-colors"
                >
                  Rename
                </button>
              </div>
            )}
          </div>

          {/* Metadata Table */}
          <div className="p-3.5 bg-surface-100 rounded-xl border border-surface-border space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Original File</span>
              <span className="text-zinc-200 font-mono truncate max-w-[200px]">
                {asset.originalName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">MIME Type</span>
              <span className="text-zinc-200 font-mono">{asset.type}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">File Size</span>
              <span className="text-zinc-200 font-mono">{formatBytes(asset.size)}</span>
            </div>
            {asset.metadata?.width && asset.metadata?.height && (
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Dimensions</span>
                <span className="text-brand-400 font-mono">
                  {asset.metadata.width} × {asset.metadata.height} px
                </span>
              </div>
            )}
            {asset.metadata?.duration && (
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Duration</span>
                <span className="text-amber-400 font-mono">{asset.metadata.duration} s</span>
              </div>
            )}
            {asset.metadata?.fontFamily && (
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Font Family</span>
                <span className="text-cyan-400 font-mono">{asset.metadata.fontFamily}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Date Added</span>
              <span className="text-zinc-400 font-mono">
                {new Date(asset.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-surface-border bg-surface-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {onDelete && (
              <button
                onClick={() => {
                  onDelete(asset.id, asset.name);
                  onClose();
                }}
                className="p-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Delete Asset"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {onDuplicate && (
              <button
                onClick={() => onDuplicate(asset.id)}
                className="p-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-surface-200 border border-surface-border transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Duplicate Asset"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleDownload}
              className="p-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-surface-200 border border-surface-border transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>

            {asset.category === "image" && onEditImage && (
              <button
                onClick={() => {
                  onClose();
                  onEditImage(asset);
                }}
                className="p-2.5 rounded-xl text-purple-300 hover:text-white hover:bg-purple-500/20 border border-purple-500/30 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Edit Image"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {onAddToCanvas && (
            <button
              onClick={() => {
                onAddToCanvas(asset);
                onClose();
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-glow transition-all min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Composition</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
