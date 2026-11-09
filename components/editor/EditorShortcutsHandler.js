"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { useAnimationStore } from "@/store/useAnimationStore";

export default function EditorShortcutsHandler() {
  const {
    undo,
    redo,
    deleteSelectedLayers,
    duplicateSelectedLayers,
    selectAll,
    deselectAll,
    selectedLayerIds,
    splitClip,
    activeTool,
    setActiveTool,
    editingTextId,
    setEditingTextId,
  } = useEditorStore();

  const prevToolRef = useRef(activeTool);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputFocused =
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA" ||
          document.activeElement.isContentEditable);

      // If user is editing text in an input or textarea, let default typing happen
      if (isInputFocused) {
        if (e.key === "Escape" && editingTextId) {
          setEditingTextId(null);
        }
        return;
      }

      // Spacebar or 'K' toggles Play/Pause
      if ((e.code === "Space" || e.key.toLowerCase() === "k") && !e.repeat) {
        e.preventDefault();
        const anim = useAnimationStore.getState();
        if (anim.isPlaying) anim.pause();
        else anim.play();
        return;
      }

      // J = Frame backward, L = Frame forward
      if (e.key.toLowerCase() === "j" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        useAnimationStore.getState().stepFrame(-1);
        return;
      }
      if (e.key.toLowerCase() === "l" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        useAnimationStore.getState().stepFrame(1);
        return;
      }

      // S = Split selected clip at playhead
      if (e.key.toLowerCase() === "s" && !e.ctrlKey && !e.metaKey) {
        if (selectedLayerIds.length > 0) {
          e.preventDefault();
          splitClip(selectedLayerIds[0]);
          return;
        }
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Copy keyframes: Ctrl+C
      if (isCtrlOrCmd && e.key.toLowerCase() === "c") {
        const animState = useAnimationStore.getState();
        if (animState.selectedKeyframeIds.length > 0) {
          e.preventDefault();
          animState.copySelectedKeyframes();
          return;
        }
      }

      // Paste keyframes: Ctrl+V
      if (isCtrlOrCmd && e.key.toLowerCase() === "v") {
        const animState = useAnimationStore.getState();
        if (animState.copiedKeyframes.length > 0) {
          e.preventDefault();
          animState.pasteKeyframesAtCurrentTime(selectedLayerIds[0] || null);
          return;
        }
      }

      // Undo: Ctrl+Z / Cmd+Z
      if (isCtrlOrCmd && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y
      if (
        (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === "z") ||
        (isCtrlOrCmd && e.key.toLowerCase() === "y")
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Duplicate: Ctrl+D / Cmd+D
      if (isCtrlOrCmd && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const animState = useAnimationStore.getState();
        if (animState.selectedKeyframeIds.length > 0) {
          animState.duplicateSelectedKeyframes();
        } else {
          duplicateSelectedLayers();
        }
        return;
      }

      // Select All: Ctrl+A / Cmd+A
      if (isCtrlOrCmd && e.key.toLowerCase() === "a") {
        e.preventDefault();
        selectAll();
        return;
      }

      // Group: Ctrl+G / Cmd+G
      if (isCtrlOrCmd && e.key.toLowerCase() === "g" && !e.shiftKey) {
        e.preventDefault();
        useEditorStore.getState().groupSelectedLayers();
        return;
      }

      // Ungroup: Ctrl+Shift+G / Cmd+Shift+G
      if (isCtrlOrCmd && e.key.toLowerCase() === "g" && e.shiftKey) {
        e.preventDefault();
        useEditorStore.getState().ungroupSelectedLayers();
        return;
      }

      // Fit to Screen: Ctrl+0 / Cmd+0
      if (isCtrlOrCmd && e.key === "0") {
        e.preventDefault();
        const el = document.querySelector("#canvas-viewport-container");
        if (el) useEditorStore.getState().fitToScreen(el.clientWidth, el.clientHeight);
        return;
      }

      // Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const animState = useAnimationStore.getState();
        if (animState.selectedKeyframeIds.length > 0) {
          animState.deleteSelectedKeyframes();
        } else {
          deleteSelectedLayers();
        }
        return;
      }

      // Escape: deselect all
      if (e.key === "Escape") {
        e.preventDefault();
        useAnimationStore.getState().deselectAllKeyframes();
        deselectAll();
        return;
      }

      // Tool shortcuts: V = Select, H = Hand
      if (e.key.toLowerCase() === "v") {
        setActiveTool("select");
        return;
      }
      if (e.key.toLowerCase() === "h") {
        setActiveTool("pan");
        return;
      }

      // Arrow keys
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        if (selectedLayerIds.length === 0) {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            useAnimationStore.getState().stepFrame(-1);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            useAnimationStore.getState().stepFrame(1);
          }
          return;
        }

        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        let dx = 0;
        let dy = 0;

        if (e.key === "ArrowLeft") dx = -step;
        if (e.key === "ArrowRight") dx = step;
        if (e.key === "ArrowUp") dy = -step;
        if (e.key === "ArrowDown") dy = step;

        const currentLayers = useEditorStore.getState().layers;
        const updated = currentLayers.map((layer) => {
          if (selectedLayerIds.includes(layer.id) && !layer.isLocked) {
            return {
              ...layer,
              x: Math.round(layer.x + dx),
              y: Math.round(layer.y + dy),
            };
          }
          return layer;
        });

        useEditorStore.getState()._pushSnapshot(updated);
        useEditorStore.getState().saveProjectToDB();
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        setActiveTool(prevToolRef.current || "select");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    undo,
    redo,
    deleteSelectedLayers,
    duplicateSelectedLayers,
    selectAll,
    deselectAll,
    selectedLayerIds,
    splitClip,
    setActiveTool,
    editingTextId,
    setEditingTextId,
  ]);

  return null;
}
