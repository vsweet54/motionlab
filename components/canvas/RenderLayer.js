"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Rect,
  Circle,
  Ellipse,
  Text,
  Line,
  Star,
  RegularPolygon,
  Path,
  Image as KonvaImage,
  Group,
} from "react-konva";

function ImageShape({ layer, shapeProps }) {
  const [imageObj, setImageObj] = useState(null);

  useEffect(() => {
    if (!layer.src) return;
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = layer.src;
    img.onload = () => {
      setImageObj(img);
    };
  }, [layer.src]);

  return <KonvaImage image={imageObj} {...shapeProps} />;
}

export default React.memo(function RenderLayer({
  layer,
  isSelected,
  onSelect,
  onChange,
  onTextDblClick,
  activeTool = "select",
  isSnapToGrid = false,
  gridSize = 40,
  onDragMoveGuide,
  onDragEndGuide,
}) {
  const shapeRef = useRef(null);

  if (!layer.visible) return null;

  const isDraggable = !layer.isLocked && activeTool === "select";

  const handleDragMove = (e) => {
    const node = e.target;
    let newX = node.x();
    let newY = node.y();

    if (isSnapToGrid) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
      node.position({ x: newX, y: newY });
    }

    if (onDragMoveGuide) {
      onDragMoveGuide(newX, newY, layer);
    }
  };

  const handleDragEnd = (e) => {
    const node = e.target;
    let newX = node.x();
    let newY = node.y();

    if (isSnapToGrid) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
      node.position({ x: newX, y: newY });
    }

    if (onDragEndGuide) {
      onDragEndGuide();
    }

    onChange({
      x: Math.round(newX),
      y: Math.round(newY),
    });
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    const newWidth = Math.max(10, Math.round((layer.width || 100) * scaleX));
    const newHeight = Math.max(10, Math.round((layer.height || 100) * scaleY));

    const updates = {
      x: Math.round(node.x()),
      y: Math.round(node.y()),
      rotation: Math.round(node.rotation()),
      width: newWidth,
      height: newHeight,
    };

    if (layer.type === "circle") {
      updates.radius = Math.max(5, Math.round((layer.radius || 50) * Math.max(scaleX, scaleY)));
    } else if (layer.type === "ellipse") {
      updates.radiusX = Math.max(5, Math.round((layer.radiusX || 80) * scaleX));
      updates.radiusY = Math.max(5, Math.round((layer.radiusY || 50) * scaleY));
    } else if (layer.type === "star") {
      updates.innerRadius = Math.max(5, Math.round((layer.innerRadius || 30) * scaleX));
      updates.outerRadius = Math.max(10, Math.round((layer.outerRadius || 70) * scaleX));
    } else if (layer.type === "polygon") {
      updates.radius = Math.max(10, Math.round((layer.radius || 70) * Math.max(scaleX, scaleY)));
    } else if (layer.type === "text") {
      updates.fontSize = Math.max(8, Math.round((layer.fontSize || 64) * scaleY));
    }

    onChange(updates);
  };

  // Attach and execute custom pixel filters via Konva caching
  useEffect(() => {
    const node = shapeRef.current;
    if (!node) return;

    if (layer._hasFilters && layer._customFilterFn) {
      try {
        node.filters([layer._customFilterFn]);
        node.cache();
      } catch (err) {
        // Caching requires positive dimensions
      }
    } else {
      try {
        if (node.isCached && node.isCached()) {
          node.clearCache();
        }
        node.filters([]);
      } catch (err) {}
    }
  }, [
    layer._hasFilters,
    layer._customFilterFn,
    layer.width,
    layer.height,
    layer.fill,
    layer.stroke,
  ]);

  const hasCustomAnchor = layer.anchorX !== undefined && layer.anchorY !== undefined;
  const pivotOffsetX = hasCustomAnchor && layer.type !== "circle" ? (layer.width || 100) * Number(layer.anchorX) : 0;
  const pivotOffsetY = hasCustomAnchor && layer.type !== "circle" ? (layer.height || 100) * Number(layer.anchorY) : 0;

  const commonProps = {
    ref: shapeRef,
    id: layer.id,
    name: layer.id,
    x: layer.x,
    y: layer.y,
    offsetX: pivotOffsetX,
    offsetY: pivotOffsetY,
    scaleX: layer.scaleX ?? 1,
    scaleY: layer.scaleY ?? 1,
    rotation: layer.rotation || 0,
    opacity: layer.opacity ?? 1,
    shadowColor: layer.shadowColor,
    shadowBlur: layer.shadowBlur,
    shadowOffset: layer.shadowOffset,
    shadowOpacity: layer.shadowOpacity,
    draggable: isDraggable,
    onClick: (e) => onSelect(e, layer.id),
    onTap: (e) => onSelect(e, layer.id),
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
  };

  // Render Core Element based on Type
  const renderShape = () => {
    switch (layer.type) {
      case "text":
        return (
          <Text
            {...commonProps}
            text={layer.text || ""}
            fontSize={layer.fontSize || 64}
            fontFamily={layer.fontFamily || "Inter"}
            fontStyle={`${layer.fontStyle === "italic" ? "italic" : ""} ${
              layer.fontWeight === "bold" ? "bold" : "normal"
            }`.trim()}
            align={layer.align || "center"}
            fill={layer.fill || "#ffffff"}
            letterSpacing={layer.letterSpacing || 0}
            lineHeight={layer.lineHeight || 1.2}
            width={layer.width}
            onDblClick={(e) => {
              e.cancelBubble = true;
              if (onTextDblClick) onTextDblClick(layer);
            }}
          />
        );

      case "rect":
        return (
          <Rect
            {...commonProps}
            width={layer.width || 200}
            height={layer.height || 150}
            fill={layer.fill || "#6366f1"}
            stroke={layer.stroke || "transparent"}
            strokeWidth={layer.strokeWidth || 0}
            cornerRadius={layer.cornerRadius || 0}
          />
        );

      case "circle":
        return (
          <Circle
            {...commonProps}
            radius={layer.radius || 80}
            fill={layer.fill || "#a855f7"}
            stroke={layer.stroke || "transparent"}
            strokeWidth={layer.strokeWidth || 0}
          />
        );

      case "ellipse":
        return (
          <Ellipse
            {...commonProps}
            radiusX={layer.radiusX || 120}
            radiusY={layer.radiusY || 80}
            fill={layer.fill || "#06b6d4"}
            stroke={layer.stroke || "transparent"}
            strokeWidth={layer.strokeWidth || 0}
          />
        );

      case "star":
        return (
          <Star
            {...commonProps}
            numPoints={layer.numPoints || 5}
            innerRadius={layer.innerRadius || 40}
            outerRadius={layer.outerRadius || 90}
            fill={layer.fill || "#eab308"}
            stroke={layer.stroke || "transparent"}
            strokeWidth={layer.strokeWidth || 0}
          />
        );

      case "polygon":
        return (
          <RegularPolygon
            {...commonProps}
            sides={layer.sides || 6}
            radius={layer.radius || 90}
            fill={layer.fill || "#10b981"}
            stroke={layer.stroke || "transparent"}
            strokeWidth={layer.strokeWidth || 0}
          />
        );

      case "line":
        return (
          <Line
            {...commonProps}
            points={layer.points || [0, 0, 200, 0]}
            stroke={layer.stroke || "#38bdf8"}
            strokeWidth={layer.strokeWidth || 4}
            lineCap="round"
            lineJoin="round"
          />
        );

      case "image":
        return (
          <ImageShape
            layer={layer}
            shapeProps={{
              ...commonProps,
              width: layer.width || 300,
              height: layer.height || 200,
            }}
          />
        );

      case "video":
        return (
          <ImageShape
            layer={{
              ...layer,
              src: layer.thumbnail || layer.src,
            }}
            shapeProps={{
              ...commonProps,
              width: layer.width || 640,
              height: layer.height || 360,
            }}
          />
        );

      case "svg":
        return (
          <Path
            {...commonProps}
            data={layer.data || "M 50,0 L 100,100 L 0,100 Z"}
            fill={layer.fill || "#ec4899"}
            stroke={layer.stroke || "transparent"}
            strokeWidth={layer.strokeWidth || 0}
            scaleX={(layer.width || 100) / 100}
            scaleY={(layer.height || 100) / 100}
          />
        );

      default:
        return null;
    }
  };

  const hasAuxiliaryRendering =
    (layer._particles && layer._particles.length > 0) ||
    layer._lightLeak ||
    layer._sweepProgress !== null ||
    layer._clipRect ||
    layer._circularClip;

  if (!hasAuxiliaryRendering) {
    return renderShape();
  }

  // Clip mask calculation
  const clipFunc = (ctx) => {
    if (layer._circularClip) {
      ctx.arc(
        layer._circularClip.x,
        layer._circularClip.y,
        Math.max(0.1, layer._circularClip.radius),
        0,
        Math.PI * 2,
        false
      );
    } else if (layer._clipRect) {
      ctx.rect(
        layer._clipRect.x,
        layer._clipRect.y,
        Math.max(0.1, layer._clipRect.width),
        Math.max(0.1, layer._clipRect.height)
      );
    }
  };

  const w = layer.width || 300;
  const h = layer.height || 200;

  return (
    <Group clipFunc={layer._clipRect || layer._circularClip ? clipFunc : undefined}>
      {renderShape()}

      {/* Floating Particles Layer */}
      {layer._particles &&
        layer._particles.map((pt) => (
          <Circle
            key={pt.id}
            x={layer.x + pt.x}
            y={layer.y + pt.y}
            radius={pt.radius}
            fill={pt.color}
            opacity={pt.opacity}
            shadowColor={pt.color}
            shadowBlur={pt.radius * 2}
            shadowOpacity={0.8}
            listening={false}
          />
        ))}

      {/* Light Leak Overlay */}
      {layer._lightLeak && (
        <Rect
          x={layer.x}
          y={layer.y}
          width={w}
          height={h}
          fill={layer._lightLeak.color}
          opacity={layer._lightLeak.opacity}
          rotation={layer._lightLeak.angle}
          listening={false}
        />
      )}

      {/* Specular Light Sweep Beam */}
      {layer._sweepProgress !== null && (
        <Line
          points={[
            layer.x + (layer._sweepProgress * (w + 100) - 50),
            layer.y,
            layer.x + (layer._sweepProgress * (w + 100) - 150),
            layer.y + h,
          ]}
          stroke="#ffffff"
          strokeWidth={24}
          opacity={0.65}
          shadowColor="#ffffff"
          shadowBlur={20}
          shadowOpacity={0.9}
          listening={false}
        />
      )}
    </Group>
  );
});
