"use client";

import React, { useState } from "react";
import {
  Image as ImageIcon,
  Film,
  Music,
  Type,
  Compass,
  Star,
  MoreVertical,
  Plus,
  Eye,
  Edit2,
  Copy,
  Trash2,
  Play,
  FileText,
} from "lucide-react";
import { formatBytes } from "@/lib/storage/db";

export default function AssetCard({
  asset,
  viewMode = "grid", // 'grid' | 'list'
  onSelect,
  onPreview,
  onEdit,
  onToggleFavorite,
  onDuplicate,
  onDelete,
  onAddToCanvas,
}) {
  const [showMenu, setShowMenu] = useState(false);

  // Drag-and-drop payload for desktop
  const handleDragStart = (e) => {
    const payload = {
      type: "asset",
      assetId: asset.id,
      name: asset.name,
      category: asset.category,
      src: asset.liveUrl || asset.thumbnail,
      width: asset.metadata?.width,
      height: asset.metadata?.height,
      duration: asset.metadata?.duration,
      paths: asset.metadata?.paths,
      fontFamily: asset.metadata?.fontFamily,
      waveform: asset.metadata?.waveform,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  };

  // Icon based on category
  const getCategoryIcon = () => {
    switch (asset.category) {
      case "image":
        return <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />;
      case "video":
        return <Film className="w-3.5 h-3.5 text-purple-400" />;
      case "audio":
        return <Music className="w-3.5 h-3.5 text-amber-400" />;
      case "font":
        return <Type className="w-3.5 h-3.5 text-cyan-400" />;
      case "svg":
        return <Compass className="w-3.5 h-3.5 text-pink-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  // Thumbnail Renderer
  const renderThumbnail = () => {
    if (asset.category === "image" || asset.category === "svg") {
      const src = asset.thumbnail || asset.liveUrl;
      if (src) {
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={asset.name}
            className="w-full h-full object-contain p-2 select-none pointer-events-none"
            loading="lazy"
          />
        );
      }
    }

    if (asset.category === "video") {
      if (asset.thumbnail) {
        return (
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.thumbnail}
              alt={asset.name}
              className="w-full h-full object-cover select-none pointer-events-none"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="p-2 rounded-full bg-black/60 text-white backdrop-blur-sm">
                <Play className="w-4 h-4 fill-white" />
              </div>
            </div>
            {asset.metadata?.duration && (
              <span className="absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono text-zinc-200">
                {asset.metadata.duration}s
              </span>
            )}
          </div>
        );
      }
    }

    if (asset.category === "audio") {
      const peaks = asset.metadata?.waveform || Array(30).fill(0.4);
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-br from-amber-500/10 to-orange-500/10 relative">
          <div className="flex items-center gap-0.5 h-10 w-full justify-center">
            {peaks.slice(0, 24).map((p, i) => (
              <div
                key={i}
                className="w-1 bg-amber-400/80 rounded-full"
                style={{ height: `${Math.max(15, p * 100)}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-amber-300">
            <Music className="w-3 h-3" />
            <span>{asset.metadata?.duration ? `${asset.metadata.duration}s` : "Audio"}</span>
          </div>
        </div>
      );
    }

    if (asset.category === "font") {
      const family = asset.metadata?.fontFamily || "sans-serif";
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
          <span
            className="text-2xl font-bold text-zinc-100 truncate max-w-full"
            style={{ fontFamily: family }}
          >
            Aa Bb 123
          </span>
          <span className="mt-1 text-[10px] font-mono text-cyan-300 truncate max-w-full">
            {family}
          </span>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-surface-100 text-zinc-500">
        {getCategoryIcon()}
      </div>
    );
  };

  /* ================= LIST VIEW ================= */
  if (viewMode === "list") {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        className="flex items-center justify-between p-2.5 rounded-xl bg-surface-100 hover:bg-surface-border border border-surface-border/60 transition-all select-none group"
      >
        <div
          onClick={() => onSelect && onSelect(asset)}
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        >
          {/* Mini Thumbnail */}
          <div className="w-10 h-10 rounded-lg bg-surface-200 overflow-hidden flex items-center justify-center flex-shrink-0 border border-surface-border">
            {renderThumbnail()}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-zinc-200 truncate group-hover:text-white">
                {asset.name}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-surface-200 text-zinc-400">
                {asset.category}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-0.5 font-mono">
              <span>{formatBytes(asset.size)}</span>
              {asset.metadata?.width && asset.metadata?.height && (
                <span>
                  {asset.metadata.width}×{asset.metadata.height}
                </span>
              )}
              {asset.metadata?.duration && <span>{asset.metadata.duration}s</span>}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleFavorite && onToggleFavorite(asset.id, asset.isFavorite)}
            className={`p-2 rounded-lg hover:bg-surface-200 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
              asset.isFavorite ? "text-amber-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
            title={asset.isFavorite ? "Remove favorite" : "Favorite"}
          >
            <Star className={`w-4 h-4 ${asset.isFavorite ? "fill-amber-400" : ""}`} />
          </button>

          {onAddToCanvas && (
            <button
              onClick={() => onAddToCanvas(asset)}
              className="p-2 rounded-lg bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Add to Canvas / Timeline"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-surface-200 text-zinc-400 hover:text-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-surface-100 border border-surface-border shadow-2xl py-1 z-30 select-none text-xs"
                onClick={() => setShowMenu(false)}
              >
                {onPreview && (
                  <button
                    onClick={() => onPreview(asset)}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-surface-border text-zinc-300 hover:text-white"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                )}
                {asset.category === "image" && onEdit && (
                  <button
                    onClick={() => onEdit(asset)}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-surface-border text-zinc-300 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Image</span>
                  </button>
                )}
                {onDuplicate && (
                  <button
                    onClick={() => onDuplicate(asset.id)}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-surface-border text-zinc-300 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(asset.id, asset.name)}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-red-500/20 text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ================= GRID VIEW ================= */
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group relative flex flex-col rounded-2xl bg-surface-100 hover:bg-surface-border border border-surface-border/70 hover:border-brand-500/50 transition-all overflow-hidden select-none shadow-sm hover:shadow-glow"
    >
      {/* Thumbnail Area */}
      <div
        onClick={() => onSelect && onSelect(asset)}
        className="w-full h-32 bg-[#09090d] flex items-center justify-center overflow-hidden cursor-pointer relative"
      >
        {renderThumbnail()}

        {/* Category Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-zinc-300">
          {getCategoryIcon()}
          <span className="capitalize">{asset.category}</span>
        </div>

        {/* Favorite Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleFavorite) onToggleFavorite(asset.id, asset.isFavorite);
          }}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all min-w-[32px] min-h-[32px] flex items-center justify-center ${
            asset.isFavorite
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "bg-black/40 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100"
          }`}
          title={asset.isFavorite ? "Remove favorite" : "Favorite"}
        >
          <Star className={`w-3.5 h-3.5 ${asset.isFavorite ? "fill-amber-400" : ""}`} />
        </button>

        {/* Desktop Hover Quick Actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
          {onPreview && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview(asset);
              }}
              className="p-2 rounded-xl bg-surface-100 hover:bg-surface-border text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
              title="Preview Asset"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}

          {asset.category === "image" && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(asset);
              }}
              className="p-2 rounded-xl bg-surface-100 hover:bg-surface-border text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
              title="Edit Image"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {onAddToCanvas && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCanvas(asset);
              }}
              className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
              title="Add to Canvas / Timeline"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Info Area */}
      <div className="p-3 space-y-1">
        <div className="flex items-center justify-between gap-1">
          <span
            onClick={() => onSelect && onSelect(asset)}
            className="font-semibold text-xs text-zinc-200 truncate cursor-pointer hover:text-white"
            title={asset.name}
          >
            {asset.name}
          </span>

          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-surface-200 transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 bottom-full mb-1 w-36 rounded-xl bg-surface-200 border border-surface-border shadow-2xl py-1 z-30 select-none text-xs"
                onClick={() => setShowMenu(false)}
              >
                {onSelect && (
                  <button
                    onClick={() => onSelect(asset)}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-surface-border text-zinc-300 hover:text-white"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </button>
                )}
                {onPreview && (
                  <button
                    onClick={() => onPreview(asset)}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-surface-border text-zinc-300 hover:text-white"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                )}
                {asset.category === "image" && onEdit && (
                  <button
                    onClick={() => onEdit(asset)}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-surface-border text-zinc-300 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Image</span>
                  </button>
                )}
                {onDuplicate && (
                  <button
                    onClick={() => onDuplicate(asset.id)}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-surface-border text-zinc-300 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(asset.id, asset.name)}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-red-500/20 text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>{formatBytes(asset.size)}</span>
          {asset.metadata?.width && asset.metadata?.height && (
            <span>
              {asset.metadata.width}×{asset.metadata.height}
            </span>
          )}
          {asset.metadata?.duration && <span>{asset.metadata.duration}s</span>}
        </div>
      </div>
    </div>
  );
}
