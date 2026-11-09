"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer, Rect, Transformer, Group } from "react-konva";
import RenderLayer from "./RenderLayer";
import CanvasGrid from "./CanvasGrid";
import AlignmentGuides from "./AlignmentGuides";
import { useEditorStore } from "@/store/useEditorStore";
import { useEvaluatedLayers } from "@/hooks/usePlaybackSync";

export default function KonvaCanvas() {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const trRef = useRef(null);

  const evaluatedLayers = useEvaluatedLayers();

  const [containerDimensions, setContainerDimensions] = useState({
    width: 1000,
    height: 700,
  });

  const [activeGuideH, setActiveGuideH] = useState(false);
  const [activeGuideV, setActiveGuideV] = useState(false);

  const {
    canvasWidth,
    canvasHeight,
    backgroundColor,
    layers,
    selectedLayerIds,
    editingTextId,
    setEditingTextId,
    zoom,
    panX,
    panY,
    setZoom,
    setPan,
    isGridVisible,
    isSnapToGrid,
    showCenterGuides,
    gridSize,
    activeTool,
    selectLayer,
    deselectAll,
    updateLayer,
    fitToScreen,
    addAssetLayer,
  } = useEditorStore();

  // Track parent container resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerDimensions({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Center fit on first mount
  useEffect(() => {
    if (containerDimensions.width > 100 && containerDimensions.height > 100) {
      fitToScreen(containerDimensions.width, containerDimensions.height);
    }
  }, [containerDimensions.width, containerDimensions.height, fitToScreen]);

  // Bind transformer to all selected nodes
  useEffect(() => {
    if (!trRef.current || !stageRef.current) return;

    if (selectedLayerIds.length === 0) {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
      return;
    }

    const stage = stageRef.current;
    const selectedNodes = selectedLayerIds
      .map((id) => stage.findOne(`#${id}`))
      .filter(Boolean);

    trRef.current.nodes(selectedNodes);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedLayerIds, layers]);

  // Canvas Board position in viewport
  const boardX =
    (containerDimensions.width - canvasWidth * zoom) / 2 + panX;
  const boardY =
    (containerDimensions.height - canvasHeight * zoom) / 2 + panY;

  // Zoom on wheel
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.08;
    const oldZoom = zoom;
    const pointer = stage.getPointerPosition() || {
      x: containerDimensions.width / 2,
      y: containerDimensions.height / 2,
    };

    const mousePointTo = {
      x: (pointer.x - boardX) / oldZoom,
      y: (pointer.y - boardY) / oldZoom,
    };

    const newZoom = e.evt.deltaY < 0 ? oldZoom * scaleBy : oldZoom / scaleBy;
    const clampedZoom = Math.max(0.1, Math.min(3.0, Number(newZoom.toFixed(2))));

    const newBoardX = pointer.x - mousePointTo.x * clampedZoom;
    const newBoardY = pointer.y - mousePointTo.y * clampedZoom;

    const newPanX =
      newBoardX - (containerDimensions.width - canvasWidth * clampedZoom) / 2;
    const newPanY =
      newBoardY - (containerDimensions.height - canvasHeight * clampedZoom) / 2;

    setZoom(clampedZoom);
    setPan(Math.round(newPanX), Math.round(newPanY));
  };

  // Stage click/tap
  const handleStageClick = (e) => {
    // Click on empty space
    if (e.target === stageRef.current || e.target.hasName("canvas-bg")) {
      deselectAll();
    }
  };

  // Dragging Guide detection
  const handleDragMoveGuide = useCallback(
    (newX, newY, layer) => {
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const w = layer.width || (layer.radius ? layer.radius * 2 : 100);
      const h = layer.height || (layer.radius ? layer.radius * 2 : 100);

      const objectCenterX = newX + w / 2;
      const objectCenterY = newY + h / 2;

      const threshold = 12;
      setActiveGuideV(Math.abs(objectCenterX - centerX) <= threshold || Math.abs(newX - centerX) <= threshold);
      setActiveGuideH(Math.abs(objectCenterY - centerY) <= threshold || Math.abs(newY - centerY) <= threshold);
    },
    [canvasWidth, canvasHeight]
  );

  const handleDragEndGuide = useCallback(() => {
    setActiveGuideH(false);
    setActiveGuideV(false);
  }, []);

  // Text inline editing coordinates
  const editingLayer = layers.find((l) => l.id === editingTextId);
  const textEditorStyle = editingLayer
    ? {
        position: "absolute",
        left: `${boardX + editingLayer.x * zoom}px`,
        top: `${boardY + editingLayer.y * zoom}px`,
        width: `${(editingLayer.width || 300) * zoom}px`,
        fontSize: `${(editingLayer.fontSize || 64) * zoom}px`,
        fontFamily: editingLayer.fontFamily || "Inter",
        fontWeight: editingLayer.fontWeight || "bold",
        fontStyle: editingLayer.fontStyle || "normal",
        textAlign: editingLayer.align || "center",
        color: editingLayer.fill || "#ffffff",
        lineHeight: editingLayer.lineHeight || 1.2,
        letterSpacing: `${(editingLayer.letterSpacing || 0) * zoom}px`,
        background: "rgba(10, 10, 15, 0.95)",
        border: "1px solid #6366f1",
        borderRadius: "6px",
        padding: "4px 8px",
        zIndex: 50,
        outline: "none",
        resize: "none",
        boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)",
      }
    : null;

  return (
    <div
      ref={containerRef}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(e) => {
        e.preventDefault();
        const json = e.dataTransfer.getData("application/json");
        if (!json) return;
        try {
          const payload = JSON.parse(json);
          if (payload.type === "asset") {
            const rect = containerRef.current.getBoundingClientRect();
            const clientX = e.clientX - rect.left;
            const clientY = e.clientY - rect.top;

            // Convert to canvas coordinates taking zoom and board offsets into account
            const canvasX = (clientX - boardX) / zoom;
            const canvasY = (clientY - boardY) / zoom;

            addAssetLayer(payload, { x: Math.round(canvasX), y: Math.round(canvasY) });
          }
        } catch (err) {
          console.warn("Drop handling error:", err);
        }
      }}
      className={`relative w-full h-full overflow-hidden select-none bg-[#070709] ${
        activeTool === "pan" ? "cursor-grab active:cursor-grabbing" : "cursor-default"
      }`}
    >
      {/* Interactive Stage */}
      <Stage
        ref={stageRef}
        width={containerDimensions.width}
        height={containerDimensions.height}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        draggable={activeTool === "pan"}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setPan(panX + e.target.x(), panY + e.target.y());
            e.target.position({ x: 0, y: 0 });
          }
        }}
      >
        <Layer>
          {/* Canvas Board Group (Scaled and Panned) */}
          <Group x={boardX} y={boardY} scaleX={zoom} scaleY={zoom}>
            {/* Background Canvas Rectangle */}
            <Rect
              name="canvas-bg"
              x={0}
              y={0}
              width={canvasWidth}
              height={canvasHeight}
              fill={backgroundColor}
              shadowColor="#000000"
              shadowBlur={30}
              shadowOpacity={0.7}
              shadowOffsetX={0}
              shadowOffsetY={10}
            />

            {/* Grid Overlay */}
            <CanvasGrid
              width={canvasWidth}
              height={canvasHeight}
              gridSize={gridSize}
              visible={isGridVisible}
            />

            {/* Center Guides */}
            <AlignmentGuides
              width={canvasWidth}
              height={canvasHeight}
              showHorizontal={showCenterGuides || activeGuideH}
              showVertical={showCenterGuides || activeGuideV}
            />

            {/* Object Layers (Bottom to Top) */}
            {evaluatedLayers.map((layer) => (
              <RenderLayer
                key={layer.id}
                layer={layer}
                isSelected={selectedLayerIds.includes(layer.id)}
                onSelect={(e, id) => {
                  e.cancelBubble = true;
                  const isMulti = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
                  selectLayer(id, isMulti);
                }}
                onChange={(updates) => updateLayer(layer.id, updates, true)}
                onTextDblClick={(textLayer) => setEditingTextId(textLayer.id)}
                activeTool={activeTool}
                isSnapToGrid={isSnapToGrid}
                gridSize={gridSize}
                onDragMoveGuide={handleDragMoveGuide}
                onDragEndGuide={handleDragEndGuide}
              />
            ))}

            {/* Konva Transformer for selection resize/rotate */}
            <Transformer
              ref={trRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Minimum size limit
                if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
                  return oldBox;
                }
                return newBox;
              }}
              borderStroke="#6366f1"
              borderStrokeWidth={1.5}
              anchorStroke="#6366f1"
              anchorFill="#ffffff"
              anchorSize={8}
              anchorCornerRadius={2}
              rotateAnchorOffset={24}
              padding={2}
              enabledAnchors={[
                "top-left",
                "top-center",
                "top-right",
                "middle-right",
                "middle-left",
                "bottom-left",
                "bottom-center",
                "bottom-right",
              ]}
            />
          </Group>
        </Layer>
      </Stage>

      {/* Inline Text Editor Overlay */}
      {editingLayer && textEditorStyle && (
        <textarea
          autoFocus
          style={textEditorStyle}
          value={editingLayer.text || ""}
          onChange={(e) => {
            updateLayer(editingLayer.id, { text: e.target.value }, false);
          }}
          onBlur={() => {
            updateLayer(editingLayer.id, { text: editingLayer.text }, true);
            setEditingTextId(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setEditingTextId(null);
            }
          }}
          rows={3}
        />
      )}
    </div>
  );
}
