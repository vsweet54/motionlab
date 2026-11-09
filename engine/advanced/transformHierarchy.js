/**
 * Professional Transform Hierarchy, Grouping, Alignment & Anchor Engine for MotionLab
 * Handles multi-object alignment, equal distribution, parent-child inheritance, grouping/ungrouping,
 * and 9-point anchor pivot calculations.
 */

export const ANCHOR_PRESETS = [
  { id: "topLeft", label: "Top Left", x: 0.0, y: 0.0 },
  { id: "topCenter", label: "Top Center", x: 0.5, y: 0.0 },
  { id: "topRight", label: "Top Right", x: 1.0, y: 0.0 },
  { id: "centerLeft", label: "Center Left", x: 0.0, y: 0.5 },
  { id: "center", label: "Center (Default)", x: 0.5, y: 0.5 },
  { id: "centerRight", label: "Center Right", x: 1.0, y: 0.5 },
  { id: "bottomLeft", label: "Bottom Left", x: 0.0, y: 1.0 },
  { id: "bottomCenter", label: "Bottom Center", x: 0.5, y: 1.0 },
  { id: "bottomRight", label: "Bottom Right", x: 1.0, y: 1.0 },
];

/**
 * Calculates absolute bounding box for a layer in canvas coordinates
 */
export function getLayerBounds(layer) {
  const w = Number(layer.width ?? 100) * Number(layer.scaleX ?? 1);
  const h = Number(layer.height ?? 100) * Number(layer.scaleY ?? 1);
  const x = Number(layer.x ?? 0);
  const y = Number(layer.y ?? 0);

  // Default pivot is center
  const ax = layer.anchorX !== undefined ? Number(layer.anchorX) : 0.5;
  const ay = layer.anchorY !== undefined ? Number(layer.anchorY) : 0.5;

  const left = x - w * ax;
  const top = y - h * ay;
  const right = left + w;
  const bottom = top + h;
  const centerX = left + w / 2;
  const centerY = top + h / 2;

  return { left, top, right, bottom, centerX, centerY, width: w, height: h };
}

/**
 * Aligns a set of selected layers according to alignment mode
 * Modes: 'left', 'centerH', 'right', 'top', 'centerV', 'bottom'
 */
export function alignLayers(selectedLayers, mode = "centerH", canvasBounds = null) {
  if (!Array.isArray(selectedLayers) || selectedLayers.length === 0) return selectedLayers;

  const boundsList = selectedLayers.map(getLayerBounds);

  let targetValue = 0;

  if (selectedLayers.length === 1 && canvasBounds) {
    // Align single layer relative to canvas
    switch (mode) {
      case "left": targetValue = 0; break;
      case "centerH": targetValue = canvasBounds.width / 2; break;
      case "right": targetValue = canvasBounds.width; break;
      case "top": targetValue = 0; break;
      case "centerV": targetValue = canvasBounds.height / 2; break;
      case "bottom": targetValue = canvasBounds.height; break;
    }
  } else {
    // Align relative to bounding box of selection
    const minLeft = Math.min(...boundsList.map((b) => b.left));
    const maxRight = Math.max(...boundsList.map((b) => b.right));
    const minTop = Math.min(...boundsList.map((b) => b.top));
    const maxBottom = Math.max(...boundsList.map((b) => b.bottom));

    switch (mode) {
      case "left": targetValue = minLeft; break;
      case "centerH": targetValue = (minLeft + maxRight) / 2; break;
      case "right": targetValue = maxRight; break;
      case "top": targetValue = minTop; break;
      case "centerV": targetValue = (minTop + maxBottom) / 2; break;
      case "bottom": targetValue = maxBottom; break;
    }
  }

  return selectedLayers.map((layer, index) => {
    const b = boundsList[index];
    const ax = layer.anchorX !== undefined ? Number(layer.anchorX) : 0.5;
    const ay = layer.anchorY !== undefined ? Number(layer.anchorY) : 0.5;
    let newX = Number(layer.x ?? 0);
    let newY = Number(layer.y ?? 0);

    switch (mode) {
      case "left":
        newX = targetValue + b.width * ax;
        break;
      case "centerH":
        newX = targetValue - b.width * (0.5 - ax);
        break;
      case "right":
        newX = targetValue - b.width * (1 - ax);
        break;
      case "top":
        newY = targetValue + b.height * ay;
        break;
      case "centerV":
        newY = targetValue - b.height * (0.5 - ay);
        break;
      case "bottom":
        newY = targetValue - b.height * (1 - ay);
        break;
    }

    return { ...layer, x: Math.round(newX), y: Math.round(newY) };
  });
}

/**
 * Distributes layers evenly along horizontal or vertical axis
 */
export function distributeLayers(selectedLayers, axis = "horizontal") {
  if (!Array.isArray(selectedLayers) || selectedLayers.length < 3) return selectedLayers;

  const items = selectedLayers.map((layer) => ({
    layer,
    bounds: getLayerBounds(layer),
  }));

  if (axis === "horizontal") {
    items.sort((a, b) => a.bounds.centerX - b.bounds.centerX);
    const first = items[0].bounds.centerX;
    const last = items[items.length - 1].bounds.centerX;
    const step = (last - first) / (items.length - 1);

    return items.map((item, idx) => {
      const targetCenter = first + step * idx;
      const shift = targetCenter - item.bounds.centerX;
      return {
        ...item.layer,
        x: Math.round(Number(item.layer.x ?? 0) + shift),
      };
    });
  } else {
    items.sort((a, b) => a.bounds.centerY - b.bounds.centerY);
    const first = items[0].bounds.centerY;
    const last = items[items.length - 1].bounds.centerY;
    const step = (last - first) / (items.length - 1);

    return items.map((item, idx) => {
      const targetCenter = first + step * idx;
      const shift = targetCenter - item.bounds.centerY;
      return {
        ...item.layer,
        y: Math.round(Number(item.layer.y ?? 0) + shift),
      };
    });
  }
}

/**
 * Groups multiple layers together under a newly created Group layer
 */
export function groupLayers(selectedIds, allLayers = []) {
  const toGroup = allLayers.filter((l) => selectedIds.includes(l.id));
  if (toGroup.length < 2) return null;

  const boundsList = toGroup.map(getLayerBounds);
  const minLeft = Math.min(...boundsList.map((b) => b.left));
  const maxRight = Math.max(...boundsList.map((b) => b.right));
  const minTop = Math.min(...boundsList.map((b) => b.top));
  const maxBottom = Math.max(...boundsList.map((b) => b.bottom));

  const groupWidth = Math.round(maxRight - minLeft);
  const groupHeight = Math.round(maxBottom - minTop);
  const groupCenterX = Math.round((minLeft + maxRight) / 2);
  const groupCenterY = Math.round((minTop + maxBottom) / 2);

  const groupId = `group_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const groupLayer = {
    id: groupId,
    name: `Group (${toGroup.length} items)`,
    type: "group",
    visible: true,
    isLocked: false,
    x: groupCenterX,
    y: groupCenterY,
    width: groupWidth,
    height: groupHeight,
    rotation: 0,
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
    anchorX: 0.5,
    anchorY: 0.5,
    childIds: toGroup.map((l) => l.id),
  };

  // Assign parentId to grouped layers
  const updatedLayers = allLayers.map((l) => {
    if (selectedIds.includes(l.id)) {
      return {
        ...l,
        parentId: groupId,
      };
    }
    return l;
  });

  return {
    groupLayer,
    updatedLayers: [...updatedLayers, groupLayer],
  };
}

/**
 * Ungroups a group layer, releasing children back to top level
 */
export function ungroupLayer(groupId, allLayers = []) {
  const group = allLayers.find((l) => l.id === groupId && l.type === "group");
  if (!group) return null;

  const updatedLayers = allLayers
    .filter((l) => l.id !== groupId)
    .map((l) => {
      if (l.parentId === groupId) {
        const { parentId, ...rest } = l;
        return rest;
      }
      return l;
    });

  return updatedLayers;
}

/**
 * Evaluates parent-child transform inheritance.
 * If child has parentId, applies parent's translation, rotation, and scale.
 */
export function applyParentTransform(child, parent) {
  if (!parent) return child;

  const parentX = Number(parent.x ?? 0);
  const parentY = Number(parent.y ?? 0);
  const parentRotRad = ((Number(parent.rotation ?? 0)) * Math.PI) / 180;
  const parentScaleX = Number(parent.scaleX ?? 1);
  const parentScaleY = Number(parent.scaleY ?? 1);

  const relX = (Number(child.x ?? 0) - parentX) * parentScaleX;
  const relY = (Number(child.y ?? 0) - parentY) * parentScaleY;

  // Rotate relative coordinates
  const cos = Math.cos(parentRotRad);
  const sin = Math.sin(parentRotRad);
  const worldX = parentX + (relX * cos - relY * sin);
  const worldY = parentY + (relX * sin + relY * cos);

  return {
    ...child,
    x: Math.round(worldX),
    y: Math.round(worldY),
    rotation: Number(((Number(child.rotation ?? 0) + Number(parent.rotation ?? 0)) % 360).toFixed(1)),
    scaleX: Number((Number(child.scaleX ?? 1) * parentScaleX).toFixed(3)),
    scaleY: Number((Number(child.scaleY ?? 1) * parentScaleY).toFixed(3)),
    opacity: Number((Number(child.opacity ?? 1) * Number(parent.opacity ?? 1)).toFixed(2)),
  };
}
