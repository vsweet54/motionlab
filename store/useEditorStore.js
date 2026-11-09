import { create } from "zustand";
import { saveProject as saveDbProject } from "@/lib/db";
import { useAnimationStore } from "@/store/useAnimationStore";
import { createEffect, EFFECT_REGISTRY } from "@/engine/effects/definitions";
import { MOTION_PRESETS } from "@/engine/presets/library";
import { restoreProjectLayerAssets } from "@/engine/assets/registry";
import { initializeStoredFonts } from "@/engine/assets/fontManager";
import { studioAutosave } from "@/engine/projects/autosaveManager";
import {
  groupLayers,
  ungroupLayer,
  alignLayers as alignLayersTransform,
  distributeLayers as distributeLayersTransform,
} from "@/engine/advanced/transformHierarchy";

const MAX_HISTORY = 50;

export const useEditorStore = create((set, get) => ({
  project: null,
  canvasWidth: 1920,
  canvasHeight: 1080,
  backgroundColor: "#0a0a0f",
  layers: [],
  selectedLayerIds: [],
  editingTextId: null,

  // Viewport / Workspace state
  zoom: 0.5,
  panX: 0,
  panY: 0,
  isGridVisible: true,
  isSnapToGrid: false,
  showCenterGuides: true,
  gridSize: 40,
  activeTool: "select", // 'select' | 'pan'
  isPanning: false,
  isDirty: false,
  isSaving: false,
  saveStatus: "saved", // 'saving' | 'saved' | 'failed'
  lastSavedAt: null,

  // History stacks
  past: [],
  future: [],

  // Helper to record history snapshot and trigger debounced autosave
  _pushSnapshot: (newLayers) => {
    const { past, layers, project, backgroundColor, canvasWidth, canvasHeight } = get();
    // Deep clone layers for immutable history
    const currentSnapshot = JSON.parse(JSON.stringify(layers));
    const nextPast = [...past, currentSnapshot].slice(-MAX_HISTORY);
    set({
      past: nextPast,
      future: [],
      layers: newLayers,
      isDirty: true,
      saveStatus: "saving",
    });

    // Dispatch debounced autosave with complete state
    if (project) {
      const keyframes = useAnimationStore.getState().keyframes || [];
      const beatMarkers = useAnimationStore.getState().beatMarkers || [];
      studioAutosave.requestAutosave({
        ...project,
        layers: newLayers,
        keyframes,
        beatMarkers,
        backgroundColor,
        width: canvasWidth,
        height: canvasHeight,
      });
    }
  },

  // Initialize editor from a project object
  initProject: (project) => {
    let initialLayers = [];
    if (project?.layers && Array.isArray(project.layers)) {
      initialLayers = project.layers.map((l, index) => ({
        id: l.id || `layer_${Date.now()}_${index}`,
        name: l.name || (l.type === "text" ? l.text || "Text" : `${l.type || "Shape"} ${index + 1}`),
        type: l.type || "rect",
        visible: l.visible !== false,
        isLocked: !!l.isLocked,
        x: Number(l.x ?? 960),
        y: Number(l.y ?? 540),
        width: Number(l.width ?? 300),
        height: Number(l.height ?? 200),
        rotation: Number(l.rotation ?? 0),
        opacity: Number(l.opacity ?? 1),
        fill: l.fill || l.color || "#6366f1",
        stroke: l.stroke || "transparent",
        strokeWidth: Number(l.strokeWidth ?? 0),
        // text specific
        text: l.text || "MotionLab Title",
        fontSize: Number(l.fontSize ?? 64),
        fontFamily: l.fontFamily || "Inter",
        fontWeight: l.fontWeight || "bold",
        fontStyle: l.fontStyle || "normal",
        align: l.align || "center",
        letterSpacing: Number(l.letterSpacing ?? 0),
        lineHeight: Number(l.lineHeight ?? 1.2),
        // shape specific
        cornerRadius: Number(l.cornerRadius ?? 0),
        radius: Number(l.radius ?? 100),
        radiusX: Number(l.radiusX ?? 150),
        radiusY: Number(l.radiusY ?? 100),
        numPoints: Number(l.numPoints ?? 5),
        innerRadius: Number(l.innerRadius ?? 40),
        outerRadius: Number(l.outerRadius ?? 100),
        sides: Number(l.sides ?? 6),
        points: l.points || [0, 0, 200, 100],
        src: l.src || null,
        assetId: l.assetId || null,
        data: l.data || null,
        // Clip & Track timing
        startTime: Number(l.startTime ?? 0),
        duration: Number(l.duration ?? (project?.duration || 5.0)),
        isMuted: !!l.isMuted,
        waveform: l.waveform || null,
        scaleX: Number(l.scaleX ?? 1),
        scaleY: Number(l.scaleY ?? 1),
        effects: Array.isArray(l.effects) ? l.effects : [],
        transitionIn: l.transitionIn || null,
        transitionOut: l.transitionOut || null,
      }));
    }

    const width = Number(project?.width) || 1920;
    const height = Number(project?.height) || 1080;

    set({
      project,
      canvasWidth: width,
      canvasHeight: height,
      backgroundColor: project?.backgroundColor || "#0a0a0f",
      layers: initialLayers,
      selectedLayerIds: initialLayers.length > 0 ? [initialLayers[initialLayers.length - 1].id] : [],
      past: [],
      future: [],
      editingTextId: null,
      isDirty: false,
    });

    // Also initialize animation store with project keyframes & duration
    useAnimationStore.getState().initAnimationFromProject(project);

    // Asynchronously resolve stored asset URLs and fonts on startup
    if (typeof window !== "undefined") {
      restoreProjectLayerAssets(initialLayers).then((restored) => {
        set({ layers: restored });
      }).catch((err) => console.warn("Asset restoration notice:", err));

      initializeStoredFonts().catch((err) => console.warn("Font initialization notice:", err));
    }
  },

  // Save current project and layers to IndexedDB
  saveProjectToDB: async (isSnapshot = false) => {
    const { project, layers, backgroundColor, canvasWidth, canvasHeight } = get();
    if (!project) return;

    try {
      set({ isSaving: true, saveStatus: "saving" });
      const keyframes = useAnimationStore.getState().keyframes || [];
      const beatMarkers = useAnimationStore.getState().beatMarkers || [];
      const updatedProject = {
        ...project,
        layers,
        keyframes,
        beatMarkers,
        backgroundColor,
        width: canvasWidth,
        height: canvasHeight,
        updatedAt: new Date().toISOString(),
      };
      await studioAutosave.saveImmediately(updatedProject, isSnapshot);
      set({
        project: updatedProject,
        isDirty: false,
        isSaving: false,
        saveStatus: "saved",
        lastSavedAt: new Date().toLocaleTimeString(),
      });
      return updatedProject;
    } catch (err) {
      console.error("Failed to save to IndexedDB:", err);
      set({ isSaving: false, saveStatus: "failed" });
    }
  },

  // Viewport Actions
  setZoom: (zoom) => {
    // Clamp zoom between 0.1 and 3.0
    const clamped = Math.max(0.1, Math.min(3.0, zoom));
    set({ zoom: Number(clamped.toFixed(2)) });
  },

  setPan: (panX, panY) => set({ panX, panY }),

  fitToScreen: (containerWidth, containerHeight) => {
    const { canvasWidth, canvasHeight } = get();
    if (!containerWidth || !containerHeight) return;

    const padding = 80;
    const availableW = containerWidth - padding;
    const availableH = containerHeight - padding;

    const scaleW = availableW / canvasWidth;
    const scaleH = availableH / canvasHeight;
    const fitScale = Math.min(scaleW, scaleH);

    const clamped = Math.max(0.1, Math.min(1.5, fitScale));
    set({
      zoom: Number(clamped.toFixed(2)),
      panX: 0,
      panY: 0,
    });
  },

  toggleGrid: () => set((state) => ({ isGridVisible: !state.isGridVisible })),
  toggleSnap: () => set((state) => ({ isSnapToGrid: !state.isSnapToGrid })),
  toggleCenterGuides: () => set((state) => ({ showCenterGuides: !state.showCenterGuides })),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setIsPanning: (isPanning) => set({ isPanning }),

  // Selection Actions
  selectLayer: (id, isMulti = false) => {
    set((state) => {
      if (!id) return { selectedLayerIds: [], editingTextId: null };

      if (isMulti) {
        if (state.selectedLayerIds.includes(id)) {
          return {
            selectedLayerIds: state.selectedLayerIds.filter((item) => item !== id),
            editingTextId: null,
          };
        } else {
          return {
            selectedLayerIds: [...state.selectedLayerIds, id],
            editingTextId: null,
          };
        }
      } else {
        return {
          selectedLayerIds: [id],
          editingTextId: null,
        };
      }
    });
  },

  selectAll: () => {
    const unlockedIds = get()
      .layers.filter((l) => !l.isLocked && l.visible)
      .map((l) => l.id);
    set({ selectedLayerIds: unlockedIds, editingTextId: null });
  },

  deselectAll: () => set({ selectedLayerIds: [], editingTextId: null }),

  setEditingTextId: (id) => set({ editingTextId: id }),

  // Add Object
  addLayer: (type, customProps = {}) => {
    const { canvasWidth, canvasHeight, layers, _pushSnapshot } = get();
    const id = `layer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const count = layers.filter((l) => l.type === type).length + 1;

    // Centered coordinates with gentle offset for stacked objects
    const offset = (layers.length % 5) * 20;
    const centerX = Math.round(canvasWidth / 2 + offset);
    const centerY = Math.round(canvasHeight / 2 + offset);

    const projectDuration = useAnimationStore.getState().duration || 5.0;

    let defaultLayer = {
      id,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${count}`,
      type,
      visible: true,
      isLocked: false,
      isMuted: false,
      startTime: 0,
      duration: projectDuration,
      scaleX: 1,
      scaleY: 1,
      x: centerX - 150,
      y: centerY - 100,
      width: 300,
      height: 200,
      rotation: 0,
      opacity: 1,
      fill: "#6366f1",
      stroke: "transparent",
      strokeWidth: 0,
      cornerRadius: 0,
      effects: customProps.effects || [],
      transitionIn: customProps.transitionIn || null,
      transitionOut: customProps.transitionOut || null,
    };

    switch (type) {
      case "text":
        defaultLayer = {
          ...defaultLayer,
          name: `Text ${count}`,
          text: "Motion Title",
          fontSize: 72,
          fontFamily: "Inter",
          fontWeight: "bold",
          fontStyle: "normal",
          align: "center",
          letterSpacing: 0,
          lineHeight: 1.2,
          fill: "#ffffff",
          width: 450,
          height: 100,
          x: centerX - 225,
          y: centerY - 50,
        };
        break;

      case "rect":
        defaultLayer = {
          ...defaultLayer,
          name: `Rectangle ${count}`,
          width: 320,
          height: 220,
          fill: "#6366f1",
          stroke: "#818cf8",
          strokeWidth: 0,
          cornerRadius: 16,
          x: centerX - 160,
          y: centerY - 110,
        };
        break;

      case "circle":
        defaultLayer = {
          ...defaultLayer,
          name: `Circle ${count}`,
          radius: 100,
          width: 200,
          height: 200,
          fill: "#a855f7",
          stroke: "#c084fc",
          strokeWidth: 0,
          x: centerX,
          y: centerY,
        };
        break;

      case "ellipse":
        defaultLayer = {
          ...defaultLayer,
          name: `Ellipse ${count}`,
          radiusX: 160,
          radiusY: 100,
          width: 320,
          height: 200,
          fill: "#06b6d4",
          stroke: "#22d3ee",
          strokeWidth: 0,
          x: centerX,
          y: centerY,
        };
        break;

      case "star":
        defaultLayer = {
          ...defaultLayer,
          name: `Star ${count}`,
          numPoints: 5,
          innerRadius: 50,
          outerRadius: 110,
          width: 220,
          height: 220,
          fill: "#eab308",
          stroke: "#facc15",
          strokeWidth: 0,
          x: centerX,
          y: centerY,
        };
        break;

      case "polygon":
        defaultLayer = {
          ...defaultLayer,
          name: `Hexagon ${count}`,
          sides: 6,
          radius: 110,
          width: 220,
          height: 220,
          fill: "#10b981",
          stroke: "#34d399",
          strokeWidth: 0,
          x: centerX,
          y: centerY,
        };
        break;

      case "line":
        defaultLayer = {
          ...defaultLayer,
          name: `Line ${count}`,
          points: [0, 0, 300, 0],
          width: 300,
          height: 4,
          stroke: "#38bdf8",
          strokeWidth: 6,
          fill: "transparent",
          x: centerX - 150,
          y: centerY,
        };
        break;

      case "image":
        defaultLayer = {
          ...defaultLayer,
          name: customProps.name || `Image ${count}`,
          width: customProps.width || 400,
          height: customProps.height || 300,
          src: customProps.src,
          fill: "transparent",
          stroke: "transparent",
          x: centerX - (customProps.width ? customProps.width / 2 : 200),
          y: centerY - (customProps.height ? customProps.height / 2 : 150),
        };
        break;

      case "svg":
        defaultLayer = {
          ...defaultLayer,
          name: `SVG Vector ${count}`,
          data:
            customProps.data ||
            "M 50,0 L 100,100 L 0,100 Z",
          width: 200,
          height: 200,
          fill: "#ec4899",
          stroke: "#f472b6",
          strokeWidth: 0,
          x: centerX - 100,
          y: centerY - 100,
        };
        break;

      case "audio":
        defaultLayer = {
          ...defaultLayer,
          name: `Audio ${count}`,
          type: "audio",
          width: 0,
          height: 0,
          fill: "#10b981",
          src: customProps.src || null,
          assetId: customProps.assetId || null,
          waveform: customProps.waveform || null,
        };
        break;

      case "video":
        defaultLayer = {
          ...defaultLayer,
          name: customProps.name || `Video ${count}`,
          type: "video",
          width: customProps.width || 640,
          height: customProps.height || 360,
          src: customProps.src || null,
          assetId: customProps.assetId || null,
          thumbnail: customProps.thumbnail || null,
          fill: "transparent",
          stroke: "transparent",
          x: centerX - (customProps.width ? customProps.width / 2 : 320),
          y: centerY - (customProps.height ? customProps.height / 2 : 180),
        };
        break;

      case "effect":
        defaultLayer = {
          ...defaultLayer,
          name: `Effect ${count}`,
          type: "effect",
          effectType: "blur",
          intensity: 10,
          width: canvasWidth,
          height: canvasHeight,
          fill: "#8b5cf6",
          opacity: 0.8,
        };
        break;

      case "group":
        defaultLayer = {
          ...defaultLayer,
          name: `Group ${count}`,
          type: "group",
          childrenIds: customProps.childrenIds || [],
          width: 400,
          height: 300,
          fill: "#3b82f6",
        };
        break;
    }

    const merged = { ...defaultLayer, ...customProps };
    const nextLayers = [...layers, merged];
    _pushSnapshot(nextLayers);
    set({ selectedLayerIds: [id] });

    // Auto-save debounced
    get().saveProjectToDB();
    return merged;
  },

  // Add Asset directly to Canvas / Timeline with smart aspect ratio calculation
  addAssetLayer: (asset, customCoords = null) => {
    const { canvasWidth, canvasHeight, addLayer } = get();
    const centerX = customCoords?.x ?? canvasWidth / 2;
    const centerY = customCoords?.y ?? canvasHeight / 2;

    const maxDim = 800;
    let w = asset.metadata?.width || 400;
    let h = asset.metadata?.height || 300;

    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }

    if (asset.category === "image") {
      return addLayer("image", {
        name: asset.name,
        src: asset.liveUrl || asset.thumbnail,
        assetId: asset.id,
        width: w,
        height: h,
        x: Math.round(centerX - w / 2),
        y: Math.round(centerY - h / 2),
      });
    }

    if (asset.category === "svg") {
      if (asset.metadata?.paths && asset.metadata.paths.length > 0) {
        return addLayer("svg", {
          name: asset.name,
          data: asset.metadata.paths[0],
          assetId: asset.id,
          width: w,
          height: h,
          x: Math.round(centerX - w / 2),
          y: Math.round(centerY - h / 2),
        });
      }
      return addLayer("image", {
        name: asset.name,
        src: asset.liveUrl || asset.thumbnail,
        assetId: asset.id,
        width: w,
        height: h,
        x: Math.round(centerX - w / 2),
        y: Math.round(centerY - h / 2),
      });
    }

    if (asset.category === "video") {
      return addLayer("video", {
        name: asset.name,
        src: asset.liveUrl,
        thumbnail: asset.thumbnail,
        assetId: asset.id,
        duration: asset.metadata?.duration || 5,
        width: w,
        height: h,
        x: Math.round(centerX - w / 2),
        y: Math.round(centerY - h / 2),
      });
    }

    if (asset.category === "audio") {
      return addLayer("audio", {
        name: asset.name,
        src: asset.liveUrl,
        assetId: asset.id,
        duration: asset.metadata?.duration || 5,
        waveform: asset.metadata?.waveform || null,
      });
    }

    if (asset.category === "font") {
      const family = asset.metadata?.fontFamily || "Inter";
      return addLayer("text", {
        name: `${asset.name} Sample`,
        text: `Typography with ${family}`,
        fontFamily: family,
        fontSize: 72,
        x: Math.round(centerX - 300),
        y: Math.round(centerY - 50),
      });
    }
  },

  // Replace existing layer with another asset (e.g. replace image/svg)
  replaceLayerAsset: (layerId, asset) => {
    const { layers, _pushSnapshot, saveProjectToDB } = get();
    const index = layers.findIndex((l) => l.id === layerId);
    if (index === -1) return;

    const layer = layers[index];
    const newLayers = [...layers];

    let newWidth = layer.width;
    let newHeight = layer.height;

    if (asset.metadata?.width && asset.metadata?.height) {
      const aspect = asset.metadata.width / asset.metadata.height;
      newHeight = Math.round(newWidth / aspect);
    }

    newLayers[index] = {
      ...layer,
      assetId: asset.id,
      src: asset.liveUrl || asset.thumbnail,
      width: newWidth,
      height: newHeight,
    };

    _pushSnapshot(newLayers);
    saveProjectToDB();
  },

  // Clip & Track Operations
  updateClipTiming: (layerId, { startTime, duration }) => {
    const { layers, _pushSnapshot } = get();
    const updated = layers.map((l) => {
      if (l.id === layerId) {
        const nextStart = startTime !== undefined ? Math.max(0, Number(startTime)) : l.startTime;
        const nextDur = duration !== undefined ? Math.max(0.1, Number(duration)) : l.duration;
        return {
          ...l,
          startTime: Number(nextStart.toFixed(3)),
          duration: Number(nextDur.toFixed(3)),
        };
      }
      return l;
    });
    _pushSnapshot(updated);
    get().saveProjectToDB();
  },

  moveClip: (layerId, newStartTime) => {
    const { layers, _pushSnapshot } = get();
    const target = layers.find((l) => l.id === layerId);
    if (!target) return;

    const clampedStart = Math.max(0, Number(newStartTime));
    const updated = layers.map((l) =>
      l.id === layerId
        ? { ...l, startTime: Number(clampedStart.toFixed(3)) }
        : l
    );
    _pushSnapshot(updated);
    get().saveProjectToDB();
  },

  trimClipStart: (layerId, newStartTime) => {
    const { layers, _pushSnapshot } = get();
    const target = layers.find((l) => l.id === layerId);
    if (!target) return;

    const currentEnd = (target.startTime ?? 0) + (target.duration ?? 5.0);
    const clampedStart = Math.max(0, Math.min(currentEnd - 0.1, Number(newStartTime)));
    const newDuration = Math.max(0.1, currentEnd - clampedStart);

    const updated = layers.map((l) =>
      l.id === layerId
        ? {
            ...l,
            startTime: Number(clampedStart.toFixed(3)),
            duration: Number(newDuration.toFixed(3)),
          }
        : l
    );
    _pushSnapshot(updated);
    get().saveProjectToDB();
  },

  trimClipEnd: (layerId, newDuration) => {
    const { layers, _pushSnapshot } = get();
    const clampedDur = Math.max(0.1, Number(newDuration));
    const updated = layers.map((l) =>
      l.id === layerId
        ? { ...l, duration: Number(clampedDur.toFixed(3)) }
        : l
    );
    _pushSnapshot(updated);
    get().saveProjectToDB();
  },

  splitClip: (layerId, splitTime = null) => {
    const { layers, _pushSnapshot } = get();
    const animState = useAnimationStore.getState();
    const cutTime = splitTime !== null ? Number(splitTime) : animState.currentTime;

    const clipIndex = layers.findIndex((l) => l.id === layerId);
    if (clipIndex === -1) return;

    const clip = layers[clipIndex];
    const clipStart = Number(clip.startTime ?? 0);
    const clipDuration = Number(clip.duration ?? animState.duration);
    const clipEnd = clipStart + clipDuration;

    if (cutTime <= clipStart + 0.05 || cutTime >= clipEnd - 0.05) {
      return;
    }

    const duration1 = Number((cutTime - clipStart).toFixed(3));
    const duration2 = Number((clipEnd - cutTime).toFixed(3));

    const newId = `layer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const clip1 = { ...clip, duration: duration1 };
    const clip2 = {
      ...JSON.parse(JSON.stringify(clip)),
      id: newId,
      name: `${clip.name} (Part 2)`,
      startTime: Number(cutTime.toFixed(3)),
      duration: duration2,
    };

    const currentKeyframes = animState.keyframes || [];
    const updatedKeyframes = currentKeyframes.map((kf) => {
      if (kf.objectId === clip.id && kf.time >= cutTime) {
        return { ...kf, objectId: newId };
      }
      return kf;
    });
    useAnimationStore.setState({ keyframes: updatedKeyframes });

    const nextLayers = [...layers];
    nextLayers[clipIndex] = clip1;
    nextLayers.splice(clipIndex + 1, 0, clip2);

    _pushSnapshot(nextLayers);
    set({ selectedLayerIds: [newId] });
    get().saveProjectToDB();
  },

  duplicateClip: (layerId) => {
    const { layers, _pushSnapshot } = get();
    const clip = layers.find((l) => l.id === layerId);
    if (!clip) return;

    const animState = useAnimationStore.getState();
    const newId = `layer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newStartTime = Number(((clip.startTime ?? 0) + (clip.duration ?? 1.0)).toFixed(3));

    const clone = {
      ...JSON.parse(JSON.stringify(clip)),
      id: newId,
      name: `${clip.name} (Copy)`,
      startTime: newStartTime <= animState.duration ? newStartTime : (clip.startTime ?? 0),
    };

    const clipKeyframes = animState.keyframes.filter((k) => k.objectId === clip.id);
    if (clipKeyframes.length > 0) {
      const timeOffset = clone.startTime - (clip.startTime ?? 0);
      const newKfs = clipKeyframes.map((k) => ({
        ...k,
        id: `kf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        objectId: newId,
        time: Number(Math.min(animState.duration, Math.max(0, k.time + timeOffset)).toFixed(3)),
      }));
      useAnimationStore.setState({
        keyframes: [...animState.keyframes, ...newKfs],
      });
    }

    const nextLayers = [...layers, clone];
    _pushSnapshot(nextLayers);
    set({ selectedLayerIds: [newId] });
    get().saveProjectToDB();
  },

  deleteClip: (layerId) => {
    const { layers, _pushSnapshot } = get();
    const remaining = layers.filter((l) => l.id !== layerId);
    _pushSnapshot(remaining);
    set((state) => ({
      selectedLayerIds: state.selectedLayerIds.filter((id) => id !== layerId),
      editingTextId: null,
    }));
    useAnimationStore.getState().clearLayerKeyframes(layerId);
    get().saveProjectToDB();
  },

  reorderTrack: (fromIndex, toIndex) => {
    const { layers, _pushSnapshot } = get();
    if (fromIndex < 0 || fromIndex >= layers.length || toIndex < 0 || toIndex >= layers.length) return;
    const reordered = [...layers];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    _pushSnapshot(reordered);
    get().saveProjectToDB();
  },

  // Effects Stack Management
  addEffectToLayer: (layerId, effectType, initialParams = {}) => {
    const { layers, _pushSnapshot } = get();
    const newFx = createEffect(effectType, initialParams);

    const updated = layers.map((layer) => {
      if (layer.id === layerId) {
        const currentEffects = layer.effects || [];
        return {
          ...layer,
          effects: [...currentEffects, newFx],
        };
      }
      return layer;
    });

    _pushSnapshot(updated);
    get().saveProjectToDB();
    return newFx;
  },

  removeEffectFromLayer: (layerId, effectId) => {
    const { layers, _pushSnapshot } = get();
    const updated = layers.map((layer) => {
      if (layer.id === layerId) {
        return {
          ...layer,
          effects: (layer.effects || []).filter((fx) => fx.id !== effectId),
        };
      }
      return layer;
    });

    _pushSnapshot(updated);
    get().saveProjectToDB();
  },

  toggleEffect: (layerId, effectId) => {
    const { layers, _pushSnapshot } = get();
    const updated = layers.map((layer) => {
      if (layer.id === layerId) {
        return {
          ...layer,
          effects: (layer.effects || []).map((fx) =>
            fx.id === effectId ? { ...fx, enabled: !fx.enabled } : fx
          ),
        };
      }
      return layer;
    });

    _pushSnapshot(updated);
    get().saveProjectToDB();
  },

  updateEffectParams: (layerId, effectId, updates) => {
    const { layers, _pushSnapshot } = get();
    const updated = layers.map((layer) => {
      if (layer.id === layerId) {
        return {
          ...layer,
          effects: (layer.effects || []).map((fx) => {
            if (fx.id === effectId) {
              const nextIntensity = updates.intensity !== undefined ? updates.intensity : fx.intensity;
              const nextParams = updates.params || (updates.intensity !== undefined ? fx.params : { ...fx.params, ...updates });
              return {
                ...fx,
                intensity: nextIntensity,
                params: nextParams,
              };
            }
            return fx;
          }),
        };
      }
      return layer;
    });

    _pushSnapshot(updated);
    get().saveProjectToDB();
  },

  reorderEffect: (layerId, effectId, direction) => {
    const { layers, _pushSnapshot } = get();
    const targetLayer = layers.find((l) => l.id === layerId);
    if (!targetLayer || !targetLayer.effects) return;

    const effects = [...targetLayer.effects];
    const idx = effects.findIndex((fx) => fx.id === effectId);
    if (idx === -1) return;

    if (direction === "up" && idx > 0) {
      const [moved] = effects.splice(idx, 1);
      effects.splice(idx - 1, 0, moved);
    } else if (direction === "down" && idx < effects.length - 1) {
      const [moved] = effects.splice(idx, 1);
      effects.splice(idx + 1, 0, moved);
    } else {
      return;
    }

    const updated = layers.map((l) =>
      l.id === layerId ? { ...l, effects } : l
    );
    _pushSnapshot(updated);
    get().saveProjectToDB();
  },

  duplicateEffect: (layerId, effectId) => {
    const { layers, _pushSnapshot } = get();
    const targetLayer = layers.find((l) => l.id === layerId);
    if (!targetLayer || !targetLayer.effects) return;

    const source = targetLayer.effects.find((fx) => fx.id === effectId);
    if (!source) return;

    const cloned = {
      ...JSON.parse(JSON.stringify(source)),
      id: `fx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${source.name} (Copy)`,
    };

    const updated = layers.map((l) =>
      l.id === layerId ? { ...l, effects: [...l.effects, cloned] } : l
    );
    _pushSnapshot(updated);
    get().saveProjectToDB();
  },

  resetEffectParams: (layerId, effectId) => {
    const { layers, _pushSnapshot } = get();
    const targetLayer = layers.find((l) => l.id === layerId);
    if (!targetLayer || !targetLayer.effects) return;

    const source = targetLayer.effects.find((fx) => fx.id === effectId);
    if (!source) return;

    const definition = EFFECT_REGISTRY[source.type];
    if (!definition) return;

    const updated = layers.map((l) => {
      if (l.id === layerId) {
        return {
          ...l,
          effects: l.effects.map((fx) =>
            fx.id === effectId
              ? {
                  ...fx,
                  intensity: definition.defaultIntensity,
                  params: { ...definition.defaultParams },
                }
              : fx
          ),
        };
      }
      return l;
    });

    _pushSnapshot(updated);
    get().saveProjectToDB();
  },

  // Transitions Management
  setLayerTransitionIn: (layerId, transition) => {
    const { layers, _pushSnapshot } = get();
    const updated = layers.map((l) =>
      l.id === layerId ? { ...l, transitionIn: transition } : l
    );
    _pushSnapshot(updated);
    get().saveProjectToDB();
  },

  setLayerTransitionOut: (layerId, transition) => {
    const { layers, _pushSnapshot } = get();
    const updated = layers.map((l) =>
      l.id === layerId ? { ...l, transitionOut: transition } : l
    );
    _pushSnapshot(updated);
    get().saveProjectToDB();
  },

  // Apply Full Motion Graphics Project Preset
  applyProjectPreset: (presetId) => {
    const preset = MOTION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const { canvasWidth, canvasHeight, _pushSnapshot } = get();
    const generated = preset.generate(canvasWidth, canvasHeight);

    useAnimationStore.getState().setProjectDuration(generated.duration || 5.0);
    useAnimationStore.setState({
      keyframes: generated.keyframes || [],
      selectedKeyframeId: null,
      selectedKeyframeIds: [],
    });

    _pushSnapshot(generated.layers || []);
    set({
      selectedLayerIds: generated.layers.length > 0 ? [generated.layers[0].id] : [],
    });
    get().saveProjectToDB();
  },

  // Update a specific layer
  updateLayer: (id, updates, addToHistory = true) => {
    const { layers, _pushSnapshot } = get();
    const updated = layers.map((layer) => {
      if (layer.id === id) {
        return { ...layer, ...updates };
      }
      return layer;
    });

    if (addToHistory) {
      _pushSnapshot(updated);
      get().saveProjectToDB();
    } else {
      set({ layers: updated, isDirty: true });
    }
  },

  // Update multiple selected layers simultaneously
  updateSelectedLayers: (updates, addToHistory = true) => {
    const { layers, selectedLayerIds, _pushSnapshot } = get();
    if (selectedLayerIds.length === 0) return;

    const updated = layers.map((layer) => {
      if (selectedLayerIds.includes(layer.id)) {
        return { ...layer, ...updates };
      }
      return layer;
    });

    if (addToHistory) {
      _pushSnapshot(updated);
      get().saveProjectToDB();
    } else {
      set({ layers: updated, isDirty: true });
    }
  },

  // Delete selected layers
  deleteSelectedLayers: () => {
    const { layers, selectedLayerIds, _pushSnapshot } = get();
    if (selectedLayerIds.length === 0) return;

    // Filter out locked layers from deletion
    const canDelete = selectedLayerIds.filter((id) => {
      const target = layers.find((l) => l.id === id);
      return target && !target.isLocked;
    });

    if (canDelete.length === 0) return;

    const remaining = layers.filter((l) => !canDelete.includes(l.id));
    _pushSnapshot(remaining);
    set({ selectedLayerIds: [], editingTextId: null });
    get().saveProjectToDB();
  },

  // Duplicate selected layers
  duplicateSelectedLayers: () => {
    const { layers, selectedLayerIds, _pushSnapshot } = get();
    if (selectedLayerIds.length === 0) return;

    const duplicates = [];
    const newSelectedIds = [];

    layers.forEach((layer) => {
      if (selectedLayerIds.includes(layer.id)) {
        const newId = `layer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const clone = {
          ...JSON.parse(JSON.stringify(layer)),
          id: newId,
          name: `${layer.name} (Copy)`,
          x: layer.x + 30,
          y: layer.y + 30,
        };
        duplicates.push(clone);
        newSelectedIds.push(newId);
      }
    });

    if (duplicates.length === 0) return;

    const nextLayers = [...layers, ...duplicates];
    _pushSnapshot(nextLayers);
    set({ selectedLayerIds: newSelectedIds });
    get().saveProjectToDB();
  },

  // Layer ordering & hierarchy
  reorderLayer: (id, direction) => {
    const { layers, _pushSnapshot } = get();
    const index = layers.findIndex((l) => l.id === id);
    if (index === -1) return;

    const newLayers = [...layers];
    const [target] = newLayers.splice(index, 1);

    if (direction === "up" && index < layers.length - 1) {
      newLayers.splice(index + 1, 0, target);
    } else if (direction === "down" && index > 0) {
      newLayers.splice(index - 1, 0, target);
    } else if (direction === "top") {
      newLayers.push(target);
    } else if (direction === "bottom") {
      newLayers.unshift(target);
    } else {
      return; // No change
    }

    _pushSnapshot(newLayers);
    get().saveProjectToDB();
  },

  reorderLayers: (newOrderedLayers) => {
    get()._pushSnapshot(newOrderedLayers);
    get().saveProjectToDB();
  },

  toggleLayerVisibility: (id) => {
    const { layers, _pushSnapshot } = get();
    const updated = layers.map((layer) =>
      layer.id === id ? { ...layer, visible: !layer.visible } : layer
    );
    _pushSnapshot(updated);
    get().saveProjectToDB();
  },

  toggleLayerLock: (id) => {
    const { layers, _pushSnapshot } = get();
    const updated = layers.map((layer) =>
      layer.id === id ? { ...layer, isLocked: !layer.isLocked } : layer
    );
    _pushSnapshot(updated);
    // If locking, remove from selection
    set((state) => ({
      selectedLayerIds: state.selectedLayerIds.filter((selId) => selId !== id),
    }));
    get().saveProjectToDB();
  },

  renameLayer: (id, name) => {
    const { layers, _pushSnapshot } = get();
    const updated = layers.map((layer) =>
      layer.id === id ? { ...layer, name: name.trim() || layer.name } : layer
    );
    _pushSnapshot(updated);
    get().saveProjectToDB();
  },

  // Alignment helpers
  alignSelected: (alignment) => {
    const { layers, selectedLayerIds, canvasWidth, canvasHeight, _pushSnapshot } = get();
    if (selectedLayerIds.length === 0) return;

    const selectedLayers = layers.filter((l) => selectedLayerIds.includes(l.id));

    let updated = [...layers];

    if (selectedLayers.length === 1) {
      // Align to canvas
      const target = selectedLayers[0];
      let newX = target.x;
      let newY = target.y;

      const w = target.width || (target.radius ? target.radius * 2 : 100);
      const h = target.height || (target.radius ? target.radius * 2 : 100);

      switch (alignment) {
        case "left":
          newX = 0;
          break;
        case "center":
          newX = Math.round((canvasWidth - w) / 2);
          break;
        case "right":
          newX = canvasWidth - w;
          break;
        case "top":
          newY = 0;
          break;
        case "middle":
          newY = Math.round((canvasHeight - h) / 2);
          break;
        case "bottom":
          newY = canvasHeight - h;
          break;
      }

      updated = layers.map((l) => (l.id === target.id ? { ...l, x: newX, y: newY } : l));
    } else {
      // Align relative to selection bounds
      const minX = Math.min(...selectedLayers.map((l) => l.x));
      const maxX = Math.max(...selectedLayers.map((l) => l.x + (l.width || 0)));
      const minY = Math.min(...selectedLayers.map((l) => l.y));
      const maxY = Math.max(...selectedLayers.map((l) => l.y + (l.height || 0)));

      updated = layers.map((l) => {
        if (!selectedLayerIds.includes(l.id)) return l;
        const w = l.width || 0;
        const h = l.height || 0;

        switch (alignment) {
          case "left":
            return { ...l, x: minX };
          case "center":
            return { ...l, x: Math.round(minX + (maxX - minX - w) / 2) };
          case "right":
            return { ...l, x: maxX - w };
          case "top":
            return { ...l, y: minY };
          case "middle":
            return { ...l, y: Math.round(minY + (maxY - minY - h) / 2) };
          case "bottom":
            return { ...l, y: maxY - h };
          default:
            return l;
        }
      });
    }

    _pushSnapshot(updated);
    get().saveProjectToDB();
  },

  // --- STAGE 11 ADVANCED TRANSFORM & HIERARCHY ACTIONS ---
  groupSelectedLayers: () => {
    const { selectedLayerIds, layers, _pushSnapshot, saveProjectToDB } = get();
    if (selectedLayerIds.length < 2) return null;
    const res = groupLayers(selectedLayerIds, layers);
    if (!res) return null;

    _pushSnapshot(res.updatedLayers);
    set({ selectedLayerIds: [res.groupLayer.id] });
    saveProjectToDB();
    return res.groupLayer;
  },

  ungroupSelectedLayers: (targetGroupId = null) => {
    const { selectedLayerIds, layers, _pushSnapshot, saveProjectToDB } = get();
    const gId = targetGroupId || selectedLayerIds.find((id) => layers.find((l) => l.id === id)?.type === "group");
    if (!gId) return;

    const updated = ungroupLayer(gId, layers);
    if (!updated) return;

    _pushSnapshot(updated);
    set({ selectedLayerIds: [] });
    saveProjectToDB();
  },

  alignSelectedLayers: (mode = "centerH") => {
    const { selectedLayerIds, layers, canvasWidth, canvasHeight, _pushSnapshot, saveProjectToDB } = get();
    if (selectedLayerIds.length === 0) return;

    const selected = layers.filter((l) => selectedLayerIds.includes(l.id));
    const aligned = alignLayersTransform(selected, mode, { width: canvasWidth, height: canvasHeight });
    const alignedMap = new Map(aligned.map((l) => [l.id, l]));

    const updated = layers.map((l) => alignedMap.get(l.id) || l);
    _pushSnapshot(updated);
    saveProjectToDB();
  },

  distributeSelectedLayers: (axis = "horizontal") => {
    const { selectedLayerIds, layers, _pushSnapshot, saveProjectToDB } = get();
    if (selectedLayerIds.length < 3) return;

    const selected = layers.filter((l) => selectedLayerIds.includes(l.id));
    const distributed = distributeLayersTransform(selected, axis);
    const distMap = new Map(distributed.map((l) => [l.id, l]));

    const updated = layers.map((l) => distMap.get(l.id) || l);
    _pushSnapshot(updated);
    saveProjectToDB();
  },

  duplicateWithOffset: (offsetX = 30, offsetY = 30) => {
    const { selectedLayerIds, layers, _pushSnapshot, saveProjectToDB } = get();
    if (selectedLayerIds.length === 0) return;

    const newLayers = [];
    const newIds = [];

    layers.forEach((l) => {
      if (selectedLayerIds.includes(l.id)) {
        const newId = `layer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        newIds.push(newId);
        newLayers.push({
          ...JSON.parse(JSON.stringify(l)),
          id: newId,
          name: `${l.name} (Copy)`,
          x: Number(l.x ?? 0) + offsetX,
          y: Number(l.y ?? 0) + offsetY,
        });
      }
    });

    const updated = [...layers, ...newLayers];
    _pushSnapshot(updated);
    set({ selectedLayerIds: newIds });
    saveProjectToDB();
  },

  setLayerAnchor: (layerId, anchorX, anchorY) => {
    const { layers, _pushSnapshot, saveProjectToDB } = get();
    const updated = layers.map((l) =>
      l.id === layerId
        ? { ...l, anchorX: Number(anchorX), anchorY: Number(anchorY) }
        : l
    );
    _pushSnapshot(updated);
    saveProjectToDB();
  },

  setLayerParent: (layerId, parentId) => {
    const { layers, _pushSnapshot, saveProjectToDB } = get();
    const updated = layers.map((l) =>
      l.id === layerId ? { ...l, parentId: parentId || null } : l
    );
    _pushSnapshot(updated);
    saveProjectToDB();
  },

  setLayerExpression: (layerId, expression) => {
    const { layers, _pushSnapshot, saveProjectToDB } = get();
    const updated = layers.map((l) =>
      l.id === layerId ? { ...l, expression } : l
    );
    _pushSnapshot(updated);
    saveProjectToDB();
  },

  setLayerMotionPath: (layerId, motionPath) => {
    const { layers, _pushSnapshot, saveProjectToDB } = get();
    const updated = layers.map((l) =>
      l.id === layerId ? { ...l, motionPath } : l
    );
    _pushSnapshot(updated);
    saveProjectToDB();
  },

  // --- ADVANCED EFFECTS CONTROLS ---
  duplicateLayerEffect: (layerId, effectIndex) => {
    const { layers, _pushSnapshot, saveProjectToDB } = get();
    const updated = layers.map((l) => {
      if (l.id === layerId && Array.isArray(l.effects) && l.effects[effectIndex]) {
        const effToDup = l.effects[effectIndex];
        const dup = {
          ...JSON.parse(JSON.stringify(effToDup)),
          id: `eff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: `${effToDup.name} (Copy)`,
        };
        const nextEffects = [...l.effects];
        nextEffects.splice(effectIndex + 1, 0, dup);
        return { ...l, effects: nextEffects };
      }
      return l;
    });
    _pushSnapshot(updated);
    saveProjectToDB();
  },

  reorderLayerEffects: (layerId, fromIndex, toIndex) => {
    const { layers, _pushSnapshot, saveProjectToDB } = get();
    const updated = layers.map((l) => {
      if (l.id === layerId && Array.isArray(l.effects)) {
        const nextEffects = [...l.effects];
        const [moved] = nextEffects.splice(fromIndex, 1);
        nextEffects.splice(toIndex, 0, moved);
        return { ...l, effects: nextEffects };
      }
      return l;
    });
    _pushSnapshot(updated);
    saveProjectToDB();
  },

  toggleLayerEffect: (layerId, effectIndex) => {
    const { layers, _pushSnapshot, saveProjectToDB } = get();
    const updated = layers.map((l) => {
      if (l.id === layerId && Array.isArray(l.effects) && l.effects[effectIndex]) {
        const nextEffects = [...l.effects];
        const current = nextEffects[effectIndex];
        nextEffects[effectIndex] = { ...current, enabled: current.enabled === false ? true : false };
        return { ...l, effects: nextEffects };
      }
      return l;
    });
    _pushSnapshot(updated);
    saveProjectToDB();
  },

  // Undo / Redo
  undo: () => {
    const { past, future, layers } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const newFuture = [JSON.parse(JSON.stringify(layers)), ...future];

    set({
      past: newPast,
      future: newFuture,
      layers: previous,
      isDirty: true,
      selectedLayerIds: [],
    });
    get().saveProjectToDB();
  },

  redo: () => {
    const { past, future, layers } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const newPast = [...past, JSON.parse(JSON.stringify(layers))];

    set({
      past: newPast,
      future: newFuture,
      layers: next,
      isDirty: true,
      selectedLayerIds: [],
    });
    get().saveProjectToDB();
  },
}));
