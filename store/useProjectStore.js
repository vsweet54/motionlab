import { create } from "zustand";
import {
  getAllProjects,
  saveProject,
  deleteProject as deleteDbProject,
} from "@/lib/db";

export const useProjectStore = create((set, get) => ({
  projects: [],
  isLoading: true,
  activeProject: null,
  activeTab: "dashboard",
  searchQuery: "",
  selectedCategory: "All",
  isNewProjectModalOpen: false,
  modalInitialData: null,
  previewTemplate: null,
  toastMessage: null,

  showToast: (message) => {
    set({ toastMessage: message });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 3000);
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  openNewProjectModal: (initialData = null) =>
    set({ isNewProjectModalOpen: true, modalInitialData: initialData }),

  closeNewProjectModal: () =>
    set({ isNewProjectModalOpen: false, modalInitialData: null }),

  setPreviewTemplate: (template) => set({ previewTemplate: template }),

  // Open a project in the Studio Canvas Editor
  openProject: (projectOrId) => {
    if (typeof projectOrId === "object" && projectOrId !== null) {
      set({ activeProject: projectOrId });
    } else {
      const match = get().projects.find((p) => p.id === projectOrId);
      if (match) {
        set({ activeProject: match });
      }
    }
  },

  // Close editor and return to dashboard
  closeProject: () => {
    set({ activeProject: null });
    get().loadProjects();
  },

  // Load all projects from IndexedDB
  loadProjects: async () => {
    try {
      set({ isLoading: true });
      const projects = await getAllProjects();
      set({ projects: projects || [], isLoading: false });
    } catch (error) {
      console.error("Failed to load projects from IndexedDB:", error);
      set({ projects: [], isLoading: false });
    }
  },

  // Create a new project
  createProject: async (data) => {
    const newProject = {
      id: "proj_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      name: data.name || "Untitled Motion Project",
      aspectRatio: data.aspectRatio || "16:9",
      width: Number(data.width) || 1920,
      height: Number(data.height) || 1080,
      fps: Number(data.fps) || 60,
      duration: Number(data.duration) || 5,
      layers: data.layers || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      templateId: data.templateId || null,
      thumbnailGradient:
        data.thumbnailGradient || "from-indigo-600 via-purple-600 to-pink-600",
    };

    try {
      await saveProject(newProject);
      set((state) => ({
        projects: [newProject, ...state.projects],
        activeProject: newProject, // Directly open newly created project into editor
      }));
      get().showToast(`Project "${newProject.name}" created`);
      return newProject;
    } catch (error) {
      console.error("Failed to create project:", error);
      throw error;
    }
  },

  // Duplicate an existing project
  duplicateProject: async (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;

    const duplicated = {
      ...project,
      id: "proj_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      name: `${project.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveProject(duplicated);
    set((state) => ({
      projects: [duplicated, ...state.projects],
    }));
    get().showToast(`Duplicated "${project.name}"`);
  },

  // Toggle Project Favorite
  toggleFavoriteProject: async (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;

    const updated = { ...project, isFavorite: !project.isFavorite };
    await saveProject(updated);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
      activeProject: state.activeProject?.id === id ? updated : state.activeProject,
    }));
  },

  // Archive / Restore Project
  toggleArchiveProject: async (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;

    const nextArchived = !project.isArchived;
    const updated = { ...project, isArchived: nextArchived };
    await saveProject(updated);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
      activeProject: state.activeProject?.id === id ? updated : state.activeProject,
    }));
    get().showToast(nextArchived ? `Archived "${project.name}"` : `Restored "${project.name}"`);
  },

  // Update Project Metadata (tags, notes, color label)
  updateProjectMeta: async (id, meta) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;

    const updated = { ...project, ...meta, updatedAt: new Date().toISOString() };
    await saveProject(updated);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
      activeProject: state.activeProject?.id === id ? updated : state.activeProject,
    }));
  },

  // Delete a project
  removeProject: async (id) => {
    const target = get().projects.find((p) => p.id === id);
    await deleteDbProject(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProject: state.activeProject?.id === id ? null : state.activeProject,
    }));
    if (target) {
      get().showToast(`Deleted "${target.name}"`);
    }
  },
}));
