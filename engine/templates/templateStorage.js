/**
 * Template Storage and Persistence Engine for MotionLab
 * Manages loading, saving, duplicating, favoriting, and deleting templates via IndexedDB.
 */

import {
  saveTemplateRecord,
  getTemplateRecordById,
  getAllTemplateRecords,
  deleteTemplateRecord,
} from "@/lib/storage/db";
import { BUILTIN_TEMPLATES } from "./builtinTemplates";

/**
 * Loads all templates: Combines 12 built-in templates with user-saved custom templates from IndexedDB.
 */
export async function loadAllTemplates() {
  try {
    const customRecords = await getAllTemplateRecords();
    const customMap = new Map();
    for (const r of customRecords) {
      customMap.set(r.id, r);
    }

    // Merge built-ins with any custom overrides (e.g. favorited state)
    const mergedBuiltins = BUILTIN_TEMPLATES.map((b) => {
      if (customMap.has(b.id)) {
        const override = customMap.get(b.id);
        customMap.delete(b.id);
        return { ...b, ...override };
      }
      return { ...b, isFavorite: false };
    });

    // Remaining items in customMap are user-created or imported templates
    const userCustomTemplates = Array.from(customMap.values());

    return [...userCustomTemplates, ...mergedBuiltins];
  } catch (err) {
    console.error("Failed to load templates from storage:", err);
    return BUILTIN_TEMPLATES;
  }
}

/**
 * Saves a new or modified template into IndexedDB.
 */
export async function saveTemplate(template) {
  const record = {
    ...template,
    id: template.id || `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    updatedAt: new Date().toISOString(),
    createdAt: template.createdAt || new Date().toISOString(),
  };

  await saveTemplateRecord(record);
  return record;
}

/**
 * Toggles favorite state of a template
 */
export async function toggleTemplateFavorite(templateId) {
  const all = await loadAllTemplates();
  const target = all.find((t) => t.id === templateId);
  if (!target) return false;

  const nextFavorite = !target.isFavorite;
  await saveTemplateRecord({
    ...target,
    isFavorite: nextFavorite,
  });

  return nextFavorite;
}

/**
 * Marks a template as recently used
 */
export async function markTemplateUsed(templateId) {
  const all = await loadAllTemplates();
  const target = all.find((t) => t.id === templateId);
  if (!target) return;

  await saveTemplateRecord({
    ...target,
    lastUsedAt: new Date().toISOString(),
  });
}

/**
 * Deletes a template from storage.
 * Built-in templates can have their custom overrides deleted, resetting to defaults.
 */
export async function deleteTemplate(templateId) {
  await deleteTemplateRecord(templateId);
}
