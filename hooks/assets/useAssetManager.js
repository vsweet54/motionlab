/**
 * React Hook for MotionLab Asset Management
 * Reactive state for searching, filtering, sorting, importing, editing, and storage monitoring.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getAllAssetsWithLiveUrls,
  deleteAssetAndRevoke,
  updateAsset,
  duplicateAsset,
  getStorageInfo,
  cleanupUnusedAssets,
} from "@/engine/storage/assetStorage";
import { importMultipleFiles } from "@/engine/assets/importer";
import { useProjectStore } from "@/store/useProjectStore";

export function useAssetManager() {
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importProgress, setImportProgress] = useState(null); // { current, total, currentFileName } | null

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all"); // 'all' | 'image' | 'video' | 'audio' | 'font' | 'svg'
  const [sortBy, setSortBy] = useState("date"); // 'date' | 'name' | 'size'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' | 'desc'
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'

  // Modal / Selection States
  const [selectedAsset, setSelectedAsset] = useState(null); // for Details modal/sheet
  const [previewAsset, setPreviewAsset] = useState(null);   // for Preview modal
  const [editingAsset, setEditingAsset] = useState(null);   // for Image Editor modal

  // Storage Stats
  const [storageInfo, setStorageInfo] = useState({
    usageFormatted: "0 B",
    quotaFormatted: "Unknown",
    usagePercent: 0,
    isPersisted: false,
  });

  const showToast = useProjectStore((s) => s.showToast);

  // Refresh assets from IndexedDB
  const refreshAssets = useCallback(async () => {
    try {
      setIsLoading(true);
      const [all, storage] = await Promise.all([
        getAllAssetsWithLiveUrls(),
        getStorageInfo(),
      ]);
      setAssets(all);
      setStorageInfo(storage);
    } catch (err) {
      console.error("Failed to load assets from IndexedDB:", err);
      showToast("Error loading local assets");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshAssets();
  }, [refreshAssets]);

  // Import files handler
  const handleImportFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    setImportProgress({ current: 0, total: fileList.length, currentFileName: "" });

    try {
      const { imported, errors } = await importMultipleFiles(
        fileList,
        (progress) => setImportProgress(progress)
      );

      if (imported.length > 0) {
        showToast(`Imported ${imported.length} asset(s) to vault`);
      }

      if (errors.length > 0) {
        const firstErr = errors[0];
        showToast(
          `Import notice: ${firstErr.fileName} (${firstErr.error})`
        );
      }

      await refreshAssets();
    } catch (err) {
      console.error("Import failed:", err);
      showToast(err.message || "Failed to import media");
    } finally {
      setImportProgress(null);
    }
  };

  // Delete asset handler
  const handleDeleteAsset = async (id, name) => {
    try {
      await deleteAssetAndRevoke(id);
      if (selectedAsset?.id === id) setSelectedAsset(null);
      if (previewAsset?.id === id) setPreviewAsset(null);
      if (editingAsset?.id === id) setEditingAsset(null);
      showToast(`Removed "${name || "Asset"}" from vault`);
      await refreshAssets();
    } catch (err) {
      console.error("Failed to delete asset:", err);
      showToast("Failed to remove asset");
    }
  };

  // Rename asset handler
  const handleRenameAsset = async (id, newName) => {
    const trimmed = (newName || "").trim();
    if (!trimmed) return;
    try {
      await updateAsset(id, { name: trimmed });
      showToast(`Renamed asset to "${trimmed}"`);
      await refreshAssets();
    } catch (err) {
      console.error("Failed to rename asset:", err);
      showToast("Failed to rename asset");
    }
  };

  // Toggle favorite handler
  const handleToggleFavorite = async (id, currentStatus) => {
    try {
      await updateAsset(id, { isFavorite: !currentStatus });
      await refreshAssets();
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  // Duplicate asset handler
  const handleDuplicateAsset = async (id) => {
    try {
      await duplicateAsset(id);
      showToast("Duplicated asset in vault");
      await refreshAssets();
    } catch (err) {
      console.error("Failed to duplicate asset:", err);
      showToast("Failed to duplicate asset");
    }
  };

  // Save edited image handler
  const handleSaveEditedImage = async (originalAssetId, newBlob, newThumbnail, newDimensions, asNewCopy = false) => {
    try {
      if (asNewCopy) {
        const original = assets.find((a) => a.id === originalAssetId);
        const copyRecord = {
          ...original,
          id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          name: `${original?.name || "Image"} (Edited)`,
          blob: newBlob,
          thumbnail: newThumbnail,
          size: newBlob.size,
          metadata: {
            ...original?.metadata,
            width: newDimensions.width,
            height: newDimensions.height,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const { saveAsset } = await import("@/engine/storage/assetStorage");
        await saveAsset(copyRecord);
        showToast("Saved edited image as new asset");
      } else {
        await updateAsset(originalAssetId, {
          blob: newBlob,
          thumbnail: newThumbnail,
          size: newBlob.size,
          metadata: {
            width: newDimensions.width,
            height: newDimensions.height,
          },
        });
        showToast("Updated original image asset");
      }

      setEditingAsset(null);
      await refreshAssets();
    } catch (err) {
      console.error("Failed to save edited image:", err);
      showToast("Failed to save edited image");
    }
  };

  // Clean unused assets handler
  const handleCleanUnused = async () => {
    try {
      const res = await cleanupUnusedAssets();
      if (res.count === 0) {
        showToast("No unused assets found to clean");
      } else {
        showToast(`Cleaned ${res.count} unused asset(s), reclaimed ${res.reclaimedFormatted}`);
        await refreshAssets();
      }
    } catch (err) {
      console.error("Failed to clean unused assets:", err);
      showToast("Error cleaning unused assets");
    }
  };

  // Filtered and sorted assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Category filter
      if (selectedCategory !== "all") {
        if (selectedCategory === "svg") {
          if (asset.category !== "svg") return false;
        } else if (asset.category !== selectedCategory) {
          return false;
        }
      }

      // Favorites filter
      if (favoritesOnly && !asset.isFavorite) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (asset.name || "").toLowerCase().includes(q);
        const matchesOriginal = (asset.originalName || "").toLowerCase().includes(q);
        const matchesCategory = (asset.category || "").toLowerCase().includes(q);
        if (!matchesName && !matchesOriginal && !matchesCategory) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = (a.name || "").localeCompare(b.name || "");
      } else if (sortBy === "size") {
        comparison = (a.size || 0) - (b.size || 0);
      } else {
        // 'date'
        comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [assets, selectedCategory, favoritesOnly, searchQuery, sortBy, sortOrder]);

  return {
    assets: filteredAssets,
    allAssetsCount: assets.length,
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
  };
}
