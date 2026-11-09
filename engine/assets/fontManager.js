/**
 * Font Manager for MotionLab
 * Dynamically loads and injects custom TTF, OTF, WOFF, and WOFF2 fonts into document.fonts.
 */

import { getAllAssets } from "@/lib/storage/db";

// Set of custom font families registered in this session
const customFontRegistry = new Set();

/**
 * Normalizes a filename to a valid CSS font-family name
 * e.g. "SpaceGrotesk-Bold.woff2" -> "SpaceGrotesk-Bold"
 */
export function sanitizeFontFamily(name) {
  return name
    .replace(/\.(ttf|otf|woff2?)$/i, "")
    .replace(/[^a-zA-Z0-9_\-\s]/g, "")
    .trim();
}

/**
 * Loads a font from a Blob or ArrayBuffer and adds it to document.fonts
 * @param {string} fontFamily
 * @param {Blob|ArrayBuffer} fontSource
 * @returns {Promise<boolean>}
 */
export async function loadCustomFont(fontFamily, fontSource) {
  if (typeof window === "undefined" || !document.fonts || !window.FontFace) {
    return false;
  }

  try {
    let buffer;
    if (fontSource instanceof Blob) {
      buffer = await fontSource.arrayBuffer();
    } else {
      buffer = fontSource;
    }

    const fontFace = new FontFace(fontFamily, buffer);
    const loadedFont = await fontFace.load();
    document.fonts.add(loadedFont);
    customFontRegistry.add(fontFamily);
    return true;
  } catch (err) {
    console.error(`Failed to register custom font "${fontFamily}":`, err);
    return false;
  }
}

/**
 * Initializes all stored font assets from IndexedDB into document.fonts on app launch.
 */
export async function initializeStoredFonts() {
  if (typeof window === "undefined" || !document.fonts) return [];

  try {
    const assets = await getAllAssets();
    const fontAssets = assets.filter((a) => a.category === "font");

    const loadedFamilies = [];
    for (const fontAsset of fontAssets) {
      const family = fontAsset.metadata?.fontFamily || sanitizeFontFamily(fontAsset.name);
      if (fontAsset.blob) {
        const ok = await loadCustomFont(family, fontAsset.blob);
        if (ok) loadedFamilies.push(family);
      }
    }

    return loadedFamilies;
  } catch (err) {
    console.warn("Could not load stored fonts:", err);
    return [];
  }
}

/**
 * Returns an array of all currently active custom font families
 */
export function getRegisteredCustomFonts() {
  return Array.from(customFontRegistry);
}
