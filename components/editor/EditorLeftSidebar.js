"use client";

import { useState } from "react";
import {
  Plus,
  Layers,
  Type,
  Square,
  Circle,
  Star,
  Hexagon,
  Minus,
  Image as ImageIcon,
  Compass,
  Upload,
  Heart,
  Sparkles,
  Volume2,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { useAssetManager } from "@/hooks/assets/useAssetManager";
import { formatBytes } from "@/lib/storage/db";
import EditorLayersPanel from "./EditorLayersPanel";

const SVG_PRESETS = [
  {
    name: "Triangle",
    data: "M 50,0 L 100,100 L 0,100 Z",
    icon: "▲",
  },
  {
    name: "Diamond",
    data: "M 50,0 L 100,50 L 50,100 L 0,50 Z",
    icon: "◆",
  },
  {
    name: "Arrow Right",
    data: "M 0,35 L 60,35 L 60,10 L 100,50 L 60,90 L 60,65 L 0,65 Z",
    icon: "➔",
  },
  {
    name: "Heart",
    data: "M 50,25 C 50,25 40,0 20,0 C 5,0 0,15 0,30 C 0,60 50,90 50,90 C 50,90 100,60 100,30 C 100,15 95,0 80,0 C 60,0 50,25 50,25 Z",
    icon: "♥",
  },
];

export default function EditorLeftSidebar({ onClose, onOpenAssetVault }) {
  const [activeTab, setActiveTab] = useState("tools"); // 'tools' | 'layers' | 'assets'
  const { addLayer, addAssetLayer, layers } = useEditorStore();
  const { assets, handleImportFiles, isLoading } = useAssetManager();

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result;
      if (!src) return;

      const img = new Image();
      img.onload = () => {
        // Scale to reasonable fit
        const maxDim = 600;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        addLayer("image", {
          name: file.name.replace(/\.[^/.]+$/, ""),
          src,
          width: w,
          height: h,
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <aside className="w-64 h-full bg-surface-200 border-r border-surface-border flex flex-col z-20 select-none shadow-xl md:shadow-none">
      {/* Top Tab Switcher */}
      <div className="flex items-center border-b border-surface-border bg-surface-100">
        <button
          onClick={() => setActiveTab("tools")}
          className={`flex-1 py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors border-b-2 ${
            activeTab === "tools"
              ? "text-brand-400 border-brand-500 bg-surface-200"
              : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-surface-50"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>

        <button
          onClick={() => setActiveTab("layers")}
          className={`flex-1 py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors border-b-2 ${
            activeTab === "layers"
              ? "text-brand-400 border-brand-500 bg-surface-200"
              : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-surface-50"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers</span>
        </button>

        <button
          onClick={() => setActiveTab("assets")}
          className={`flex-1 py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors border-b-2 ${
            activeTab === "assets"
              ? "text-brand-400 border-brand-500 bg-surface-200"
              : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-surface-50"
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Vault</span>
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white md:hidden"
            title="Close"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tools Content */}
      {activeTab === "tools" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* Typography Section */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-brand-400" />
              <span>Typography</span>
            </span>

            <div className="grid grid-cols-1 gap-1.5">
              <button
                onClick={() =>
                  addLayer("text", {
                    name: "Title Heading",
                    text: "MOTIONLAB TITLE",
                    fontSize: 84,
                    fontWeight: "bold",
                    fill: "#ffffff",
                    width: 550,
                  })
                }
                className="w-full text-left p-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border hover:border-brand-500/40 text-zinc-200 font-bold text-sm transition-all"
              >
                Add Heading
              </button>

              <button
                onClick={() =>
                  addLayer("text", {
                    name: "Subtitle",
                    text: "Professional Motion Graphics",
                    fontSize: 42,
                    fontWeight: "600",
                    fill: "#818cf8",
                    width: 450,
                  })
                }
                className="w-full text-left p-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border hover:border-brand-500/40 text-zinc-300 font-semibold text-xs transition-all"
              >
                Add Subheading
              </button>

              <button
                onClick={() =>
                  addLayer("text", {
                    name: "Body Text",
                    text: "Hardware accelerated canvas generator with precision timing.",
                    fontSize: 24,
                    fontWeight: "normal",
                    fill: "#a1a1aa",
                    width: 400,
                  })
                }
                className="w-full text-left p-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border hover:border-brand-500/40 text-zinc-400 text-xs transition-all"
              >
                Add Body Text
              </button>
            </div>
          </div>

          {/* Shapes Section */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Square className="w-3.5 h-3.5 text-purple-400" />
              <span>Basic Shapes</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addLayer("rect", { cornerRadius: 0 })}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border hover:border-brand-500/40 text-zinc-300 transition-all"
              >
                <Square className="w-4 h-4 text-brand-400" />
                <span>Rectangle</span>
              </button>

              <button
                onClick={() => addLayer("rect", { cornerRadius: 20 })}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border hover:border-brand-500/40 text-zinc-300 transition-all"
              >
                <Square className="w-4 h-4 text-indigo-400 rounded-md" />
                <span>Rounded</span>
              </button>

              <button
                onClick={() => addLayer("circle")}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border hover:border-brand-500/40 text-zinc-300 transition-all"
              >
                <Circle className="w-4 h-4 text-purple-400" />
                <span>Circle</span>
              </button>

              <button
                onClick={() => addLayer("ellipse")}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border hover:border-brand-500/40 text-zinc-300 transition-all"
              >
                <Circle className="w-4 h-4 text-cyan-400 scale-x-125" />
                <span>Ellipse</span>
              </button>

              <button
                onClick={() => addLayer("star")}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border hover:border-brand-500/40 text-zinc-300 transition-all"
              >
                <Star className="w-4 h-4 text-amber-400" />
                <span>Star</span>
              </button>

              <button
                onClick={() => addLayer("polygon")}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border hover:border-brand-500/40 text-zinc-300 transition-all"
              >
                <Hexagon className="w-4 h-4 text-emerald-400" />
                <span>Polygon</span>
              </button>

              <button
                onClick={() => addLayer("line")}
                className="col-span-2 flex items-center justify-center gap-2 p-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border hover:border-brand-500/40 text-zinc-300 transition-all"
              >
                <Minus className="w-4 h-4 text-sky-400" />
                <span>Line / Separator</span>
              </button>
            </div>
          </div>

          {/* SVG Vector Paths */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-pink-400" />
              <span>SVG Vector Shapes</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              {SVG_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() =>
                    addLayer("svg", {
                      name: preset.name,
                      data: preset.data,
                    })
                  }
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border hover:border-pink-500/40 text-zinc-300 transition-all"
                >
                  <span className="text-pink-400 font-bold text-sm w-4 text-center">
                    {preset.icon}
                  </span>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Media / Image Upload */}
          <div className="space-y-2 pt-2 border-t border-surface-border/60">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Media & Image</span>
            </span>

            <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-zinc-700 hover:border-brand-500 bg-surface-100 hover:bg-surface-50 cursor-pointer transition-all">
              <Upload className="w-5 h-5 text-zinc-400" />
              <div className="text-center">
                <span className="font-semibold text-zinc-200 block text-xs">
                  Upload Image
                </span>
                <span className="text-[10px] text-zinc-500">
                  PNG, JPG, WebP, SVG
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Special Timeline Tracks */}
          <div className="space-y-2 pt-2 border-t border-surface-border/60">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Special Tracks</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addLayer("audio")}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border hover:border-emerald-500/40 text-zinc-300 transition-all text-xs"
              >
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Audio</span>
              </button>

              <button
                onClick={() => addLayer("effect")}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border hover:border-purple-500/40 text-zinc-300 transition-all text-xs"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Effect</span>
              </button>

              <button
                onClick={() => addLayer("group")}
                className="col-span-2 flex items-center justify-center gap-2 p-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border hover:border-blue-500/40 text-zinc-300 transition-all text-xs"
              >
                <Folder className="w-4 h-4 text-blue-400" />
                <span>Group Track</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layers Content */}
      {activeTab === "layers" && <EditorLayersPanel />}

      {/* Assets Vault Content */}
      {activeTab === "assets" && (
        <div className="flex-1 flex flex-col overflow-hidden text-xs">
          {/* Quick Actions Header */}
          <div className="p-3 border-b border-surface-border space-y-2 bg-surface-150">
            {onOpenAssetVault && (
              <button
                onClick={onOpenAssetVault}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-glow transition-all min-h-[38px]"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Open Full Asset Vault</span>
              </button>
            )}

            <label className="w-full flex items-center justify-center gap-2 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-border border border-surface-border text-zinc-300 font-medium cursor-pointer transition-colors min-h-[38px]">
              <Upload className="w-3.5 h-3.5 text-brand-400" />
              <span>Import Media</span>
              <input
                type="file"
                multiple
                accept="image/*,video/mp4,video/webm,audio/*,.ttf,.otf,.woff,.woff2,.svg"
                onChange={(e) => {
                  if (e.target.files) handleImportFiles(e.target.files);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </label>
          </div>

          {/* Asset List with 1-Tap Add or Drag-to-Canvas */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {assets.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 space-y-2">
                <FolderOpen className="w-8 h-8 mx-auto text-zinc-600" />
                <p className="text-xs">Vault is empty.</p>
                <p className="text-[10px]">Import media files or click "Open Full Asset Vault".</p>
              </div>
            ) : (
              assets.map((asset) => (
                <div
                  key={asset.id}
                  draggable
                  onDragStart={(e) => {
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
                  }}
                  onClick={() => addAssetLayer(asset)}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-100 hover:bg-surface-border border border-surface-border/60 hover:border-brand-500/40 cursor-pointer transition-all group min-h-[44px]"
                  title="Click to add to canvas, or drag directly onto the canvas"
                >
                  <div className="w-9 h-9 rounded-lg bg-surface-200 overflow-hidden flex items-center justify-center flex-shrink-0 border border-surface-border">
                    {asset.thumbnail || asset.liveUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.thumbnail || asset.liveUrl}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-mono uppercase text-zinc-500">
                        {asset.category[0]}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-xs text-zinc-200 truncate block group-hover:text-white">
                      {asset.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {formatBytes(asset.size)}
                    </span>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-zinc-500 group-hover:text-brand-400 flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
