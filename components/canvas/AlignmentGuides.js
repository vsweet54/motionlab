"use client";

import React from "react";
import { Group, Line } from "react-konva";

export default React.memo(function AlignmentGuides({
  width = 1920,
  height = 1080,
  showHorizontal = false,
  showVertical = false,
}) {
  const centerX = width / 2;
  const centerY = height / 2;

  return (
    <Group listening={false}>
      {showVertical && (
        <Line
          points={[centerX, 0, centerX, height]}
          stroke="#06b6d4"
          strokeWidth={1.5}
          dash={[6, 4]}
          listening={false}
        />
      )}
      {showHorizontal && (
        <Line
          points={[0, centerY, width, centerY]}
          stroke="#06b6d4"
          strokeWidth={1.5}
          dash={[6, 4]}
          listening={false}
        />
      )}
    </Group>
  );
});
