"use client";

import React, { useMemo } from "react";
import { Group, Line } from "react-konva";

export default React.memo(function CanvasGrid({
  width = 1920,
  height = 1080,
  gridSize = 40,
  visible = true,
}) {
  const lines = useMemo(() => {
    if (!visible) return [];
    const items = [];

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      items.push({
        points: [x, 0, x, height],
        isMajor: x % (gridSize * 4) === 0,
        key: `v_${x}`,
      });
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      items.push({
        points: [0, y, width, y],
        isMajor: y % (gridSize * 4) === 0,
        key: `h_${y}`,
      });
    }

    return items;
  }, [width, height, gridSize, visible]);

  if (!visible) return null;

  return (
    <Group listening={false}>
      {lines.map((l) => (
        <Line
          key={l.key}
          points={l.points}
          stroke={l.isMajor ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.03)"}
          strokeWidth={1}
          listening={false}
        />
      ))}
    </Group>
  );
});
