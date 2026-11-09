import { create } from "zustand";
import { studioAnimation } from "@/engine/animation";
import { createKeyframe } from "@/engine/keyframes";
import { ANIMATION_PRESETS } from "@/engine/presets";
import { studioAudioPlayback } from "@/engine/audio";

export const useAnimationStore = create((set, get) => ({
  isPlaying: false,
  currentTime: 0.0,
  duration: 5.0,
  fps: 60,
  playbackSpeed: 1.0,
  isLoop: false,
  isReverse: false,
  isSnapToFrame: true,

  // Timeline Scale & Workspace
  timelineZoom: 80, // pixels per second (30 - 400)
  scrollLeft: 0,
  timelineHeight: 280, // resizable panel height (160 - 600)

  // Audio Sync & Beat Markers
  beatMarkers: [],
  showBeatMarkers: true,
  isMixerOpen: false,
  isAudioSyncOpen: false,
  setBeatMarkers: (beats) => set({ beatMarkers: Array.isArray(beats) ? beats : [] }),
  toggleShowBeatMarkers: () => set((s) => ({ showBeatMarkers: !s.showBeatMarkers })),
  setIsMixerOpen: (val) => set({ isMixerOpen: !!val }),
  setIsAudioSyncOpen: (val) => set({ isAudioSyncOpen: !!val }),

  // All keyframes across the project: Array of Keyframe objects
  keyframes: [],
  selectedKeyframeId: null,
  selectedKeyframeIds: [],
  copiedKeyframes: [],

  // Track Expanded sub-lanes
  expandedTrackIds: [],

  // Context Menu state
  contextMenu: {
    isOpen: false,
    x: 0,
    y: 0,
    type: null, // 'clip' | 'track' | 'timeline'
    targetId: null,
    clickTime: 0,
  },

  // Active clip for Mobile Bottom Sheet / Clip Properties
  editingClipId: null,

  // UI state
  isTimelineCollapsed: false,
  isInspectorOpen: false, // Mobile bottom sheet / Desktop panel
  activeInspectorLayerId: null,

  // Initialize from active project
  initAnimationFromProject: (project) => {
    studioAnimation.kill();

    studioAudioPlayback.stopAll();

    const duration = Number(project?.duration) || 5.0;
    const fps = Number(project?.fps) || 60;
    const initialKeyframes = Array.isArray(project?.keyframes)
      ? project.keyframes
      : [];
    const initialBeats = Array.isArray(project?.beatMarkers)
      ? project.beatMarkers
      : [];

    studioAnimation.init({
      duration,
      fps,
      onTick: (time) => set({ currentTime: time }),
      onComplete: () => {
        const state = get();
        if (state.isPingPong) {
          const nextRev = !state.isReverse;
          set({ isReverse: nextRev });
          studioAnimation.isReverse = nextRev;
          state.play();
        } else {
          studioAudioPlayback.stopAll();
          set({ isPlaying: false });
        }
      },
    });

    set({
      isPlaying: false,
      currentTime: 0.0,
      duration,
      fps,
      playbackSpeed: 1.0,
      isLoop: false,
      isReverse: false,
      isPingPong: false,
      isSnapToFrame: true,
      timelineZoom: 80,
      scrollLeft: 0,
      keyframes: initialKeyframes,
      beatMarkers: initialBeats,
      selectedKeyframeId: null,
      selectedKeyframeIds: [],
      copiedKeyframes: [],
      expandedTrackIds: [],
      isInspectorOpen: false,
      editingClipId: null,
      contextMenu: { isOpen: false, x: 0, y: 0, type: null, targetId: null, clickTime: 0 },
    });
  },

  // Snapping helper: snaps time to nearest 1/fps
  snapTime: (time) => {
    const { fps, duration } = get();
    const frameRate = fps || 60;
    const snapped = Math.round(time * frameRate) / frameRate;
    return Math.max(0, Math.min(duration, Number(snapped.toFixed(3))));
  },

  toggleSnapToFrame: () => set((state) => ({ isSnapToFrame: !state.isSnapToFrame })),

  // Step Frame forward / backward
  stepFrame: (direction = 1) => {
    const { currentTime, fps, duration, isSnapToFrame, snapTime, seek } = get();
    const frameRate = fps || 60;
    const delta = (direction > 0 ? 1 : -1) / frameRate;
    const rawTarget = currentTime + delta;
    const target = isSnapToFrame ? snapTime(rawTarget) : Math.max(0, Math.min(duration, rawTarget));
    seek(target);
  },

  // Timeline Zoom and Scroll
  setTimelineZoom: (val) => {
    const clamped = Math.max(30, Math.min(400, Number(val)));
    set({ timelineZoom: clamped });
  },

  zoomIn: () => {
    set((state) => ({
      timelineZoom: Math.min(400, Math.round(state.timelineZoom * 1.25)),
    }));
  },

  zoomOut: () => {
    set((state) => ({
      timelineZoom: Math.max(30, Math.round(state.timelineZoom * 0.8)),
    }));
  },

  fitTimelineToScreen: (availableWidth) => {
    const { duration } = get();
    if (!availableWidth || !duration) return;
    const fit = Math.max(30, Math.min(300, Math.floor((availableWidth - 40) / duration)));
    set({ timelineZoom: fit, scrollLeft: 0 });
  },

  setScrollLeft: (scrollLeft) => set({ scrollLeft }),

  setTimelineHeight: (val) => {
    const clamped = Math.max(160, Math.min(600, Number(val)));
    set({ timelineHeight: clamped });
  },

  // Playback Controls
  play: () => {
    const { currentTime, duration, playbackSpeed, isLoop, isReverse } = get();
    studioAnimation.play({
      fromTime: currentTime,
      duration,
      speed: playbackSpeed,
      loop: isLoop,
      reverse: isReverse,
    });
    set({ isPlaying: true });

    // Synchronize Audio Playback
    try {
      const { useEditorStore } = require("@/store/useEditorStore");
      const audioLayers = useEditorStore.getState().layers.filter((l) => l.type === "audio");
      if (audioLayers.length > 0) {
        studioAudioPlayback.syncAndPlay(audioLayers, currentTime, playbackSpeed);
      }
    } catch {
      // ignore
    }
  },

  pause: () => {
    studioAnimation.pause();
    studioAudioPlayback.stopAll();
    set({ isPlaying: false });
  },

  stop: () => {
    studioAnimation.stop();
    studioAudioPlayback.stopAll();
    set({ isPlaying: false, currentTime: 0.0 });
  },

  restart: () => {
    const { duration, playbackSpeed, isLoop, isReverse } = get();
    studioAnimation.restart();
    set({ isPlaying: true, currentTime: 0.0 });

    try {
      const { useEditorStore } = require("@/store/useEditorStore");
      const audioLayers = useEditorStore.getState().layers.filter((l) => l.type === "audio");
      if (audioLayers.length > 0) {
        studioAudioPlayback.syncAndPlay(audioLayers, 0.0, playbackSpeed);
      }
    } catch {
      // ignore
    }
  },

  seek: (time) => {
    const { duration, isSnapToFrame, snapTime, isPlaying, playbackSpeed } = get();
    const target = isSnapToFrame ? snapTime(time) : Math.max(0, Math.min(duration, Number(time)));
    studioAnimation.seek(target);
    set({ currentTime: Number(target.toFixed(3)) });

    if (isPlaying) {
      try {
        const { useEditorStore } = require("@/store/useEditorStore");
        const audioLayers = useEditorStore.getState().layers.filter((l) => l.type === "audio");
        studioAudioPlayback.syncAndPlay(audioLayers, target, playbackSpeed);
      } catch {
        // ignore
      }
    }
  },

  setPlaybackSpeed: (speed) => {
    studioAnimation.setSpeed(speed);
    set({ playbackSpeed: speed });
  },

  toggleLoop: () => {
    const next = !get().isLoop;
    studioAnimation.isLoop = next;
    set({ isLoop: next });
  },

  toggleReverse: () => {
    const next = !get().isReverse;
    studioAnimation.isReverse = next;
    set({ isReverse: next });
  },

  togglePingPong: () => {
    set((state) => ({ isPingPong: !state.isPingPong }));
  },

  setFps: (newFps) => {
    const fpsVal = Number(newFps) || 60;
    studioAnimation.setFps(fpsVal);
    set({ fps: fpsVal });
  },

  setProjectDuration: (newDuration) => {
    const durVal = Math.max(0.5, Number(newDuration) || 5.0);
    studioAnimation.setDuration(durVal);
    set({ duration: durVal });
  },

  // Track Sub-lanes
  toggleTrackExpanded: (layerId) => {
    set((state) => {
      const exists = state.expandedTrackIds.includes(layerId);
      return {
        expandedTrackIds: exists
          ? state.expandedTrackIds.filter((id) => id !== layerId)
          : [...state.expandedTrackIds, layerId],
      };
    });
  },

  // Context Menu
  openContextMenu: (menu) => set({ contextMenu: { isOpen: true, ...menu } }),
  closeContextMenu: () =>
    set({
      contextMenu: {
        isOpen: false,
        x: 0,
        y: 0,
        type: null,
        targetId: null,
        clickTime: 0,
      },
    }),

  // Clip Properties / Mobile Sheet
  setEditingClipId: (id) => set({ editingClipId: id }),

  // UI Toggles
  setTimelineCollapsed: (val) =>
    set((state) => ({
      isTimelineCollapsed:
        typeof val === "boolean" ? val : !state.isTimelineCollapsed,
    })),

  setIsInspectorOpen: (val) => set({ isInspectorOpen: val }),
  setActiveInspectorLayerId: (id) =>
    set({ activeInspectorLayerId: id, isInspectorOpen: !!id }),

  // Keyframe Selection
  selectKeyframe: (id, isMulti = false) => {
    set((state) => {
      if (!id) {
        return { selectedKeyframeId: null, selectedKeyframeIds: [] };
      }
      if (isMulti) {
        const isAlreadySelected = state.selectedKeyframeIds.includes(id);
        const nextIds = isAlreadySelected
          ? state.selectedKeyframeIds.filter((item) => item !== id)
          : [...state.selectedKeyframeIds, id];
        return {
          selectedKeyframeIds: nextIds,
          selectedKeyframeId: nextIds[0] || null,
        };
      }
      return {
        selectedKeyframeId: id,
        selectedKeyframeIds: [id],
      };
    });
  },

  deselectAllKeyframes: () =>
    set({ selectedKeyframeId: null, selectedKeyframeIds: [] }),

  selectAllKeyframesForLayer: (layerId) => {
    const ids = get()
      .keyframes.filter((k) => k.objectId === layerId)
      .map((k) => k.id);
    set({
      selectedKeyframeIds: ids,
      selectedKeyframeId: ids[0] || null,
    });
  },

  // Keyframe CRUD
  addKeyframe: ({ objectId, property, time, value, easing = "power2Out" }) => {
    const { keyframes, isSnapToFrame, snapTime } = get();
    const targetTime = isSnapToFrame ? snapTime(time) : Number(Number(time).toFixed(3));

    const existingIndex = keyframes.findIndex(
      (kf) =>
        kf.objectId === objectId &&
        kf.property === property &&
        Math.abs(kf.time - targetTime) < 0.03
    );

    let nextKeyframes;
    let createdOrUpdated;

    if (existingIndex >= 0) {
      createdOrUpdated = {
        ...keyframes[existingIndex],
        time: targetTime,
        value,
        easing,
      };
      nextKeyframes = [...keyframes];
      nextKeyframes[existingIndex] = createdOrUpdated;
    } else {
      createdOrUpdated = createKeyframe({
        objectId,
        property,
        time: targetTime,
        value,
        easing,
      });
      nextKeyframes = [...keyframes, createdOrUpdated];
    }

    set({
      keyframes: nextKeyframes,
      selectedKeyframeId: createdOrUpdated.id,
      selectedKeyframeIds: [createdOrUpdated.id],
    });

    return createdOrUpdated;
  },

  updateKeyframe: (id, updates) => {
    set((state) => ({
      keyframes: state.keyframes.map((kf) =>
        kf.id === id ? { ...kf, ...updates } : kf
      ),
    }));
  },

  removeKeyframe: (id) => {
    set((state) => ({
      keyframes: state.keyframes.filter((kf) => kf.id !== id),
      selectedKeyframeId:
        state.selectedKeyframeId === id ? null : state.selectedKeyframeId,
      selectedKeyframeIds: state.selectedKeyframeIds.filter((item) => item !== id),
    }));
  },

  deleteSelectedKeyframes: () => {
    const { selectedKeyframeIds, keyframes } = get();
    if (selectedKeyframeIds.length === 0) return;

    set({
      keyframes: keyframes.filter((kf) => !selectedKeyframeIds.includes(kf.id)),
      selectedKeyframeId: null,
      selectedKeyframeIds: [],
    });
  },

  moveKeyframes: (keyframeIds, deltaSec) => {
    const { keyframes, duration, isSnapToFrame, snapTime } = get();
    if (!keyframeIds || keyframeIds.length === 0 || deltaSec === 0) return;

    const updated = keyframes.map((kf) => {
      if (keyframeIds.includes(kf.id)) {
        const rawTime = kf.time + deltaSec;
        const clamped = Math.max(0, Math.min(duration, rawTime));
        const finalTime = isSnapToFrame ? snapTime(clamped) : Number(clamped.toFixed(3));
        return { ...kf, time: finalTime };
      }
      return kf;
    });

    set({ keyframes: updated });
  },

  duplicateKeyframe: (id) => {
    const { keyframes, duration, fps } = get();
    const target = keyframes.find((kf) => kf.id === id);
    if (!target) return;

    const frameStep = 1 / (fps || 60);
    const newTime = Math.min(duration, Number((target.time + Math.max(0.1, frameStep * 5)).toFixed(3)));
    const duplicated = createKeyframe({
      objectId: target.objectId,
      property: target.property,
      time: newTime,
      value: target.value,
      easing: target.easing,
    });

    set({
      keyframes: [...keyframes, duplicated],
      selectedKeyframeId: duplicated.id,
      selectedKeyframeIds: [duplicated.id],
    });
  },

  duplicateSelectedKeyframes: () => {
    const { selectedKeyframeIds, keyframes, duration, fps } = get();
    if (selectedKeyframeIds.length === 0) return;

    const frameStep = 1 / (fps || 60);
    const offset = Math.max(0.1, frameStep * 5);
    const duplicates = [];
    const newIds = [];

    keyframes.forEach((kf) => {
      if (selectedKeyframeIds.includes(kf.id)) {
        const newTime = Math.min(duration, Number((kf.time + offset).toFixed(3)));
        const dup = createKeyframe({
          objectId: kf.objectId,
          property: kf.property,
          time: newTime,
          value: kf.value,
          easing: kf.easing,
        });
        duplicates.push(dup);
        newIds.push(dup.id);
      }
    });

    set({
      keyframes: [...keyframes, ...duplicates],
      selectedKeyframeId: newIds[0] || null,
      selectedKeyframeIds: newIds,
    });
  },

  // Clipboard operations for keyframes
  copySelectedKeyframes: () => {
    const { selectedKeyframeIds, keyframes } = get();
    if (selectedKeyframeIds.length === 0) return;

    const selected = keyframes.filter((kf) => selectedKeyframeIds.includes(kf.id));
    if (selected.length === 0) return;

    // Find earliest timestamp to preserve relative offsets
    const minTime = Math.min(...selected.map((k) => k.time));
    const copied = selected.map((k) => ({
      ...k,
      offset: k.time - minTime,
    }));

    set({ copiedKeyframes: copied });
  },

  pasteKeyframesAtCurrentTime: (targetLayerId = null) => {
    const { copiedKeyframes, currentTime, keyframes, duration, isSnapToFrame, snapTime } = get();
    if (copiedKeyframes.length === 0) return;

    const newKeyframes = [];
    const newIds = [];

    copiedKeyframes.forEach((item) => {
      const rawTarget = currentTime + item.offset;
      const targetTime = isSnapToFrame ? snapTime(rawTarget) : Math.min(duration, Number(rawTarget.toFixed(3)));
      const objId = targetLayerId || item.objectId;

      const dup = createKeyframe({
        objectId: objId,
        property: item.property,
        time: targetTime,
        value: item.value,
        easing: item.easing,
      });

      newKeyframes.push(dup);
      newIds.push(dup.id);
    });

    // Merge with deduplication
    let merged = [...keyframes];
    for (const newKf of newKeyframes) {
      const idx = merged.findIndex(
        (k) =>
          k.objectId === newKf.objectId &&
          k.property === newKf.property &&
          Math.abs(k.time - newKf.time) < 0.03
      );
      if (idx >= 0) {
        merged[idx] = newKf;
      } else {
        merged.push(newKf);
      }
    }

    set({
      keyframes: merged,
      selectedKeyframeId: newIds[0] || null,
      selectedKeyframeIds: newIds,
    });
  },

  // Apply Animation Preset
  applyPreset: (presetId, layer, startTime = null) => {
    const preset = ANIMATION_PRESETS.find((p) => p.id === presetId);
    if (!preset || !layer) return;

    const { currentTime, keyframes } = get();
    const start = startTime !== null ? startTime : currentTime;
    const generated = preset.generate(layer, start, 1.0);

    let merged = [...keyframes];
    for (const newKf of generated) {
      const idx = merged.findIndex(
        (k) =>
          k.objectId === newKf.objectId &&
          k.property === newKf.property &&
          Math.abs(k.time - newKf.time) < 0.03
      );
      if (idx >= 0) {
        merged[idx] = newKf;
      } else {
        merged.push(newKf);
      }
    }

    set({ keyframes: merged });
  },

  // Clear all keyframes for a specific layer
  clearLayerKeyframes: (layerId) => {
    set((state) => ({
      keyframes: state.keyframes.filter((kf) => kf.objectId !== layerId),
      selectedKeyframeId: null,
      selectedKeyframeIds: [],
    }));
  },

  // Update easing or custom cubic bezier curve on keyframe
  setKeyframeEasing: (keyframeId, easing, bezierPoints = null) => {
    set((state) => ({
      keyframes: state.keyframes.map((kf) =>
        kf.id === keyframeId ? { ...kf, easing, bezierPoints: bezierPoints || kf.bezierPoints } : kf
      ),
    }));
  },

  // Offset keyframes in time by deltaSeconds (+ or -)
  offsetKeyframes: (targetIds, deltaSeconds) => {
    const { keyframes, duration, isSnapToFrame, snapTime } = get();
    const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
    const updated = keyframes.map((kf) => {
      if (ids.includes(kf.id)) {
        const rawTime = kf.time + deltaSeconds;
        const newTime = isSnapToFrame ? snapTime(rawTime) : Math.max(0, Math.min(duration, Number(rawTime.toFixed(3))));
        return { ...kf, time: newTime };
      }
      return kf;
    });
    set({ keyframes: updated });
  },

  // Stagger keyframes across different objects by stepTime
  staggerKeyframes: (targetIds, stepTime = 0.1) => {
    const { keyframes, duration, isSnapToFrame, snapTime } = get();
    const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
    const selected = keyframes.filter((k) => ids.includes(k.id));
    if (selected.length === 0) return;

    // Group selected keyframes by objectId
    const objIds = Array.from(new Set(selected.map((k) => k.objectId)));
    const updated = keyframes.map((kf) => {
      if (ids.includes(kf.id)) {
        const order = objIds.indexOf(kf.objectId);
        const shift = order * stepTime;
        const rawTime = kf.time + shift;
        const newTime = isSnapToFrame ? snapTime(rawTime) : Math.max(0, Math.min(duration, Number(rawTime.toFixed(3))));
        return { ...kf, time: newTime };
      }
      return kf;
    });
    set({ keyframes: updated });
  },

  // Reverse keyframes in time around their local bounding range
  reverseKeyframes: (targetIds) => {
    const { keyframes } = get();
    const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
    const selected = keyframes.filter((k) => ids.includes(k.id));
    if (selected.length < 2) return;

    const minTime = Math.min(...selected.map((k) => k.time));
    const maxTime = Math.max(...selected.map((k) => k.time));

    const updated = keyframes.map((kf) => {
      if (ids.includes(kf.id)) {
        const reversedTime = Number((maxTime - (kf.time - minTime)).toFixed(3));
        return { ...kf, time: reversedTime };
      }
      return kf;
    });
    set({ keyframes: updated });
  },

  // Scale playback speed of selected keyframes
  scaleKeyframeSpeed: (targetIds, speedFactor = 1.0) => {
    const { keyframes, duration } = get();
    const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
    const selected = keyframes.filter((k) => ids.includes(k.id));
    if (selected.length === 0 || speedFactor <= 0) return;

    const minTime = Math.min(...selected.map((k) => k.time));
    const updated = keyframes.map((kf) => {
      if (ids.includes(kf.id)) {
        const offset = (kf.time - minTime) / speedFactor;
        const newTime = Math.min(duration, Number((minTime + offset).toFixed(3)));
        return { ...kf, time: newTime };
      }
      return kf;
    });
    set({ keyframes: updated });
  },

  // Clone keyframes with time offset
  cloneKeyframes: (targetIds, offsetTime = 0.5) => {
    const { keyframes, duration } = get();
    const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
    const selected = keyframes.filter((k) => ids.includes(k.id));
    if (selected.length === 0) return;

    const clones = selected.map((kf) =>
      createKeyframe({
        objectId: kf.objectId,
        property: kf.property,
        time: Math.min(duration, Number((kf.time + offsetTime).toFixed(3))),
        value: kf.value,
        easing: kf.easing,
      })
    );

    set({
      keyframes: [...keyframes, ...clones],
      selectedKeyframeIds: clones.map((c) => c.id),
      selectedKeyframeId: clones[0]?.id || null,
    });
  },
}));
