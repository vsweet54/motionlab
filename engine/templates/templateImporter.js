/**
 * Template Import & Export Utilities for MotionLab
 * Exports templates to portable JSON and imports external template JSON with deep validation.
 */

import { validateTemplateStructure } from "./templateManager";

/**
 * Exports a template object into a downloadable JSON file.
 */
export function exportTemplateToJSON(template) {
  const exportData = {
    app: "MotionLab",
    type: "template",
    schemaVersion: "2.0.0",
    exportedAt: new Date().toISOString(),
    template: {
      ...template,
      // Flag external media references clearly
      _mediaPolicy: "External asset URLs are retained as portable references.",
    },
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const cleanName = (template.title || template.name || "template")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");
  const filename = `${cleanName}.motiontemplate.json`;

  return {
    blob,
    url,
    filename,
    sizeBytes: blob.size,
  };
}

/**
 * Validates and imports a template from JSON string or File.
 * @param {string|File} jsonInput
 * @returns {Promise<object>} The parsed and validated template object
 */
export async function importTemplateFromJSON(jsonInput) {
  let jsonString;

  if (jsonInput instanceof File || jsonInput instanceof Blob) {
    if (jsonInput.size > 20 * 1024 * 1024) {
      throw new Error("Template file exceeds maximum allowable size (20 MB).");
    }
    jsonString = await jsonInput.text();
  } else if (typeof jsonInput === "string") {
    jsonString = jsonInput;
  } else {
    throw new Error("Invalid input provided for template import.");
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error("Corrupted or malformed JSON file.");
  }

  // Handle both { template: { ... } } wrapper and direct template object
  const templateCandidate = parsed.template || parsed;

  const validation = validateTemplateStructure(templateCandidate);
  if (!validation.valid) {
    throw new Error(`Invalid template format: ${validation.errors.join(", ")}`);
  }

  // Prevent ID collision: generate new ID for imported template
  const importedId = `tpl_import_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  return {
    ...templateCandidate,
    id: importedId,
    title: templateCandidate.title || templateCandidate.name || "Imported Template",
    isCustom: true,
    isFavorite: false,
    category: templateCandidate.category || "Custom Templates",
    importedAt: new Date().toISOString(),
    createdAt: templateCandidate.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
