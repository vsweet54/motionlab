"use client";

import { create } from "zustand";
import {
  loadAllTemplates,
  saveTemplate,
  deleteTemplate,
  toggleTemplateFavorite,
  markTemplateUsed,
  instantiateProjectFromTemplate,
  importTemplateFromJSON,
  exportTemplateToJSON,
  createTemplateFromProject,
  TEMPLATE_CATEGORIES,
} from "@/engine/templates";
import { saveProject } from "@/lib/storage/db";

export const useTemplateStore = create((set, get) => ({
  templates: [],
  isLoading: true,
  searchQuery: "",
  selectedCategory: "All",
  sortBy: "newest", // 'newest' | 'name' | 'recently_used' | 'duration'
  viewMode: "grid", // 'grid' | 'list'
  previewingTemplate: null,
  isSaveAsTemplateOpen: false,

  // Load templates from built-ins and IndexedDB
  loadTemplates: async () => {
    set({ isLoading: true });
    try {
      const all = await loadAllTemplates();
      set({ templates: all, isLoading: false });
    } catch (err) {
      console.error("Failed to load templates:", err);
      set({ isLoading: false });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSortBy: (sortBy) => set({ sortBy }),
  setViewMode: (viewMode) => set({ viewMode }),
  setPreviewingTemplate: (template) => set({ previewingTemplate: template }),
  setIsSaveAsTemplateOpen: (isOpen) => set({ isSaveAsTemplateOpen: isOpen }),

  // Toggle Favorite
  toggleFavorite: async (templateId) => {
    try {
      const nextFav = await toggleTemplateFavorite(templateId);
      set((state) => ({
        templates: state.templates.map((t) =>
          t.id === templateId ? { ...t, isFavorite: nextFav } : t
        ),
      }));
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  },

  // Delete Template
  removeTemplate: async (templateId) => {
    try {
      await deleteTemplate(templateId);
      await get().loadTemplates();
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
  },

  // Duplicate a template as a user template
  duplicateTemplate: async (template) => {
    try {
      const cloned = {
        ...template,
        id: `tpl_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: `${template.title || template.name} (Copy)`,
        isCustom: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveTemplate(cloned);
      await get().loadTemplates();
      return cloned;
    } catch (err) {
      console.error("Failed to duplicate template:", err);
      throw err;
    }
  },

  // Instantiates a template into a new live project
  instantiateTemplate: async (template, customName = null) => {
    try {
      await markTemplateUsed(template.id);
      const newProject = instantiateProjectFromTemplate(template, customName);
      await saveProject(newProject);
      return newProject;
    } catch (err) {
      console.error("Failed to instantiate template:", err);
      throw err;
    }
  },

  // Imports a template JSON file
  importTemplateFile: async (file) => {
    try {
      const parsed = await importTemplateFromJSON(file);
      await saveTemplate(parsed);
      await get().loadTemplates();
      return parsed;
    } catch (err) {
      console.error("Failed to import template:", err);
      throw err;
    }
  },

  // Exports a template to JSON download
  exportTemplateFile: (template) => {
    const { url, filename } = exportTemplateToJSON(template);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  // Saves current Studio Project as a new template
  saveProjectAsTemplate: async ({
    project,
    layers,
    keyframes,
    beatMarkers,
    title,
    description,
    category,
    tags,
  }) => {
    try {
      const newTemplate = createTemplateFromProject({
        project,
        layers,
        keyframes,
        beatMarkers,
        title,
        description,
        category,
        tags,
      });
      await saveTemplate(newTemplate);
      await get().loadTemplates();
      return newTemplate;
    } catch (err) {
      console.error("Failed to save project as template:", err);
      throw err;
    }
  },
}));
