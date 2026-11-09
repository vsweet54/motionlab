"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Check,
  Save,
  Maximize2,
  Sliders,
} from "lucide-react";
import {
  rotateImage,
  flipImage,
  cropImage,
  resizeImage,
} from "@/lib/media/imageProcessor";

export default function AssetImageEditor({
  asset,
  onClose,
  onSave, // (assetId, newBlob, newThumbnail, newDimensions, asCopy) => void
}) {
  const [currentBlob, setCurrentBlob] = useState(asset?.blob || null);
  const [previewUrl, setPreviewUrl] = useState(asset?.liveUrl || asset?.thumbnail || null);
  const [width, setWidth] = useState(asset?.metadata?.width || 800);
  const [height, setHeight] = useState(asset?.metadata?.height || 600);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveAsCopy, setSaveAsCopy] = useState(false);

  // Resize Inputs
  const [targetWidth, setTargetWidth] = useState(width);
  const [targetHeight, setTargetHeight] = useState(height);
  const [lockAspect, setLockAspect] = useState(true);

  // Active Tool Mode
  const [activeTab, setActiveTab] = useState("transform"); // 'transform' | 'resize' | 'crop'

  // Crop State
  const [cropAspect, setCropAspect] = useState("free"); // 'free' | '1:1' | '16:9' | '4:3'

  useEffect(() => {
    if (asset?.blob) {
      setCurrentBlob(asset.blob);
      const url = URL.createObjectURL(asset.blob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [asset]);

  if (!asset) return null;

  const updateBlobAndPreview = (newBlob, newThumbnail, newW, newH) => {
    setCurrentBlob(newBlob);
    setWidth(newW);
    setHeight(newH);
    setTargetWidth(newW);
    setTargetHeight(newH);

    const newUrl = URL.createObjectURL(newBlob);
    setPreviewUrl(newUrl);
  };

  // 1. Rotate 90 deg
  const handleRotate = async (degrees) => {
    if (!currentBlob) return;
    setIsProcessing(true);
    try {
      const res = await rotateImage(currentBlob, degrees, asset.type || "image/png");
      updateBlobAndPreview(res.blob, res.thumbnail, res.width, res.height);
    } catch (err) {
      console.error("Rotate error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Flip
  const handleFlip = async (flipH, flipV) => {
    if (!currentBlob) return;
    setIsProcessing(true);
    try {
      const res = await flipImage(currentBlob, flipH, flipV, asset.type || "image/png");
      updateBlobAndPreview(res.blob, res.thumbnail, res.width, res.height);
    } catch (err) {
      console.error("Flip error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Resize apply
  const handleApplyResize = async () => {
    if (!currentBlob || targetWidth <= 0 || targetHeight <= 0) return;
    setIsProcessing(true);
    try {
      const res = await resizeImage(
        currentBlob,
        targetWidth,
        targetHeight,
        asset.type || "image/png"
      );
      updateBlobAndPreview(res.blob, res.thumbnail, res.width, res.height);
    } catch (err) {
      console.error("Resize error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Quick Crop Presets (Center Crop)
  const handleApplyCrop = async () => {
    if (!currentBlob) return;
    setIsProcessing(true);
    try {
      let cropW = width;
      let cropH = height;

      if (cropAspect === "1:1") {
        const side = Math.min(width, height);
        cropW = side;
        cropH = side;
      } else if (cropAspect === "16:9") {
        if (width / height > 16 / 9) {
          cropH = height;
          cropW = Math.round((height * 16) / 9);
        } else {
          cropW = width;
          cropH = Math.round((width * 9) / 16);
        }
      } else if (cropAspect === "4:3") {
        if (width / height > 4 / 3) {
          cropH = height;
          cropW = Math.round((height * 4) / 3);
        } else {
          cropW = width;
          cropH = Math.round((width * 3) / 4);
        }
      }

      const cropX = Math.round((width - cropW) / 2);
      const cropY = Math.round((height - cropH) / 2);

      const res = await cropImage(
        currentBlob,
        { x: cropX, y: cropY, width: cropW, height: cropH },
        asset.type || "image/png"
      );
      updateBlobAndPreview(res.blob, res.thumbnail, res.width, res.height);
    } catch (err) {
      console.error("Crop error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Final Save
  const handleFinalSave = async () => {
    if (!currentBlob || !onSave) return;
    setIsProcessing(true);
    try {
      const { generateThumbnail } = await import("@/lib/media/imageProcessor");
      const thumb = await generateThumbnail(currentBlob, 256);
      onSave(asset.id, currentBlob, thumb, { width, height }, saveAsCopy);
      onClose();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none animate-fade-in">
      <div className="w-full max-w-4xl max-h-[92vh] bg-surface-200 border border-surface-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border bg-surface-100">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-zinc-100">
              Image Editor: {asset.name}
            </span>
            <span className="font-mono text-xs text-brand-400">
              ({width} × {height} px)
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace Canvas & Toolbar */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Preview */}
          <div className="flex-1 p-6 bg-[#08080c] flex items-center justify-center overflow-hidden relative">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Edited Preview"
                className="max-w-full max-h-[50vh] md:max-h-[60vh] object-contain shadow-2xl rounded-lg border border-surface-border"
              />
            )}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-xs text-white font-semibold">
                Processing Pixels...
              </div>
            )}
          </div>

          {/* Right Editing Control Panel */}
          <div className="w-full md:w-80 bg-surface-100 border-t md:border-t-0 md:border-l border-surface-border p-4 flex flex-col justify-between overflow-y-auto space-y-4">
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="flex items-center rounded-xl bg-surface-200 p-1 border border-surface-border text-xs">
                <button
                  onClick={() => setActiveTab("transform")}
                  className={`flex-1 py-1.5 rounded-lg font-semibold text-center transition-colors ${
                    activeTab === "transform"
                      ? "bg-brand-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Transform
                </button>
                <button
                  onClick={() => setActiveTab("resize")}
                  className={`flex-1 py-1.5 rounded-lg font-semibold text-center transition-colors ${
                    activeTab === "resize"
                      ? "bg-brand-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Resize
                </button>
                <button
                  onClick={() => setActiveTab("crop")}
                  className={`flex-1 py-1.5 rounded-lg font-semibold text-center transition-colors ${
                    activeTab === "crop"
                      ? "bg-brand-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Crop
                </button>
              </div>

              {/* 1. Transform Tab */}
              {activeTab === "transform" && (
                <div className="space-y-3">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                    Rotate & Flip
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleRotate(-90)}
                      className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-surface-200 hover:bg-surface-border border border-surface-border text-zinc-200 text-xs font-medium transition-colors min-h-[44px]"
                    >
                      <RotateCcw className="w-4 h-4 text-brand-400" />
                      <span>Rotate -90°</span>
                    </button>
                    <button
                      onClick={() => handleRotate(90)}
                      className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-surface-200 hover:bg-surface-border border border-surface-border text-zinc-200 text-xs font-medium transition-colors min-h-[44px]"
                    >
                      <RotateCw className="w-4 h-4 text-brand-400" />
                      <span>Rotate +90°</span>
                    </button>
                    <button
                      onClick={() => handleFlip(true, false)}
                      className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-surface-200 hover:bg-surface-border border border-surface-border text-zinc-200 text-xs font-medium transition-colors min-h-[44px]"
                    >
                      <FlipHorizontal className="w-4 h-4 text-cyan-400" />
                      <span>Flip Horiz</span>
                    </button>
                    <button
                      onClick={() => handleFlip(false, true)}
                      className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-surface-200 hover:bg-surface-border border border-surface-border text-zinc-200 text-xs font-medium transition-colors min-h-[44px]"
                    >
                      <FlipVertical className="w-4 h-4 text-cyan-400" />
                      <span>Flip Vert</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Resize Tab */}
              {activeTab === "resize" && (
                <div className="space-y-3 text-xs">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                    Custom Dimensions
                  </span>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-1">Width (px)</label>
                      <input
                        type="number"
                        min="10"
                        max="8000"
                        value={targetWidth}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setTargetWidth(val);
                          if (lockAspect && width > 0) {
                            setTargetHeight(Math.round((val * height) / width));
                          }
                        }}
                        className="w-full bg-surface-200 border border-surface-border rounded-lg px-2.5 py-1.5 font-mono text-white outline-none focus:border-brand-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-1">Height (px)</label>
                      <input
                        type="number"
                        min="10"
                        max="8000"
                        value={targetHeight}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setTargetHeight(val);
                          if (lockAspect && height > 0) {
                            setTargetWidth(Math.round((val * width) / height));
                          }
                        }}
                        className="w-full bg-surface-200 border border-surface-border rounded-lg px-2.5 py-1.5 font-mono text-white outline-none focus:border-brand-500"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-zinc-400 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={lockAspect}
                        onChange={(e) => setLockAspect(e.target.checked)}
                        className="accent-brand-500 rounded"
                      />
                      <span>Maintain Aspect Ratio</span>
                    </label>

                    <button
                      onClick={handleApplyResize}
                      className="w-full mt-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors min-h-[44px]"
                    >
                      Apply Resize
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Crop Tab */}
              {activeTab === "crop" && (
                <div className="space-y-3 text-xs">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                    Aspect Ratio Preset
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "free", label: "Original" },
                      { key: "1:1", label: "Square (1:1)" },
                      { key: "16:9", label: "Widescreen (16:9)" },
                      { key: "4:3", label: "Standard (4:3)" },
                    ].map((asp) => (
                      <button
                        key={asp.key}
                        onClick={() => setCropAspect(asp.key)}
                        className={`p-2 rounded-xl border text-xs font-medium transition-colors min-h-[40px] ${
                          cropAspect === asp.key
                            ? "bg-brand-600 text-white border-brand-500"
                            : "bg-surface-200 text-zinc-300 border-surface-border hover:bg-surface-border"
                        }`}
                      >
                        {asp.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleApplyCrop}
                    className="w-full mt-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors min-h-[44px] flex items-center justify-center gap-2"
                  >
                    <Crop className="w-4 h-4" />
                    <span>Apply Center Crop</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Save Action */}
            <div className="space-y-3 pt-3 border-t border-surface-border text-xs">
              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsCopy}
                  onChange={(e) => setSaveAsCopy(e.target.checked)}
                  className="accent-brand-500 rounded"
                />
                <span>Save as new asset copy</span>
              </label>

              <button
                onClick={handleFinalSave}
                disabled={isProcessing}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold shadow-glow transition-all flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Save className="w-4 h-4" />
                <span>{saveAsCopy ? "Save Copy" : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
