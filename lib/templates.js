/**
 * Compatibility Bridge for lib/templates.js
 * Forwards to the new professional engine/templates module.
 */

import { BUILTIN_TEMPLATES } from "@/engine/templates/builtinTemplates";

export const MOTION_TEMPLATES = BUILTIN_TEMPLATES;
export * from "@/engine/templates";
