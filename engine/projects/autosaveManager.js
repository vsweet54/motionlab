/**
 * Autosave and Project Recovery Coordinator for MotionLab
 * Manages debounced saving, transactional concurrency lock, crash recovery cache, and save status states.
 */

import { saveProject, saveRecoveryData, clearRecoveryData, saveSnapshot } from "@/lib/storage/db";

class AutosaveCoordinator {
  constructor() {
    this.debounceTimer = null;
    this.isSaving = false;
    this.queuedSave = null;
    this.lastSavedTimestamp = null;
    this.listeners = new Set();
    this.status = "idle"; // 'idle' | 'saving' | 'saved' | 'failed'
    this.saveIntervalMs = 1500; // 1.5s debounce
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event) {
    for (const l of this.listeners) {
      try {
        l(event);
      } catch (e) {}
    }
  }

  /**
   * Request a debounced autosave of project data.
   */
  requestAutosave(projectData) {
    if (!projectData || !projectData.id) return;

    // Save lightweight recovery buffer synchronously to survive tab crashes
    saveRecoveryData(projectData.id, projectData).catch(() => {});

    this.status = "saving";
    this.notify({ status: "saving", project: projectData });

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.executeSave(projectData);
    }, this.saveIntervalMs);
  }

  /**
   * Immediate synchronous save (e.g. on manual Ctrl+S or exit)
   */
  async saveImmediately(projectData, isSnapshot = false) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    return this.executeSave(projectData, isSnapshot);
  }

  async executeSave(projectData, isSnapshot = false) {
    if (this.isSaving) {
      this.queuedSave = { projectData, isSnapshot };
      return;
    }

    this.isSaving = true;
    this.status = "saving";
    this.notify({ status: "saving", project: projectData });

    try {
      const updated = {
        ...projectData,
        updatedAt: new Date().toISOString(),
      };

      await saveProject(updated);

      // Create periodic snapshot if requested or significant save
      if (isSnapshot) {
        await saveSnapshot({
          projectId: updated.id,
          name: updated.name,
          data: updated,
          createdAt: new Date().toISOString(),
        });
      }

      // Clear crash recovery buffer after confirmed write
      await clearRecoveryData(updated.id);

      this.isSaving = false;
      this.status = "saved";
      this.lastSavedTimestamp = new Date();
      this.notify({
        status: "saved",
        project: updated,
        lastSavedAt: this.lastSavedTimestamp.toLocaleTimeString(),
      });

      // Process any queued save that arrived while locked
      if (this.queuedSave) {
        const next = this.queuedSave;
        this.queuedSave = null;
        this.executeSave(next.projectData, next.isSnapshot);
      }

      return updated;
    } catch (err) {
      console.error("Autosave transaction failed:", err);
      this.isSaving = false;
      this.status = "failed";
      this.notify({ status: "failed", error: err.message });
      throw err;
    }
  }
}

export const studioAutosave = new AutosaveCoordinator();
