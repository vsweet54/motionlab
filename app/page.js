"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import RecentProjects from "@/components/dashboard/RecentProjects";
import TemplateGallery from "@/components/dashboard/TemplateGallery";
import ProjectsView from "@/components/dashboard/ProjectsView";
import AssetsView from "@/components/dashboard/AssetsView";
import SettingsView from "@/components/dashboard/SettingsView";
import NewProjectModal from "@/components/dashboard/NewProjectModal";
import TemplatePreviewModal from "@/components/dashboard/TemplatePreviewModal";
import Toast from "@/components/ui/Toast";
import CrashRecoveryBanner from "@/components/projects/CrashRecoveryBanner";
import { useProjectStore } from "@/store/useProjectStore";
import { Sparkles, Plus, Play, ArrowRight, Layers, Gauge, Cpu } from "lucide-react";
import StudioEditor from "@/components/editor";

export default function DashboardPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    activeTab,
    setActiveTab,
    openNewProjectModal,
    loadProjects,
    projects,
    activeProject,
    closeProject,
  } = useProjectStore();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // If a project is active, open full screen interactive Studio Canvas Editor
  if (activeProject) {
    return (
      <StudioEditor
        project={activeProject}
        onBackToDashboard={closeProject}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-grid-subtle">
        {/* Sticky Header */}
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Scrollable Main View */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
          {/* Automatic Crash Recovery Notification Banner */}
          <CrashRecoveryBanner />

          {activeTab === "dashboard" && (
            <>
              {/* Studio Hero Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-surface-100 via-surface-100 to-brand-600/10 border border-surface-border p-6 sm:p-8 shadow-card">
                <div className="relative z-10 max-w-2xl space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Next-Gen Motion Graphics Studio</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    Design & Animate Motion Vectors in Your Browser
                  </h2>

                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    Harness GPU-accelerated HTML5 canvas with precision GSAP keyframe curves. Fast, offline-first, zero cloud latency.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => openNewProjectModal()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all duration-150 hover:scale-105 active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Project</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("templates")}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-50 hover:bg-surface-border text-zinc-200 border border-surface-border text-xs font-medium transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Explore Templates</span>
                    </button>
                  </div>
                </div>

                {/* Ambient glow decoration */}
                <div className="absolute -right-12 -top-12 w-64 h-64 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute right-8 bottom-8 hidden lg:flex items-center gap-4 text-xs font-mono text-zinc-500">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-200 border border-surface-border">
                    <Gauge className="w-4 h-4 text-emerald-400" />
                    <span>60 FPS Native</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-200 border border-surface-border">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span>Konva Canvas</span>
                  </div>
                </div>
              </div>

              {/* Recent Projects Section */}
              <section className="space-y-3">
                <RecentProjects limit={4} showHeader={true} />
              </section>

              {/* Template Gallery Section */}
              <section className="space-y-3 pt-2">
                <TemplateGallery limit={3} showHeader={true} />
              </section>
            </>
          )}

          {activeTab === "projects" && <ProjectsView />}
          {activeTab === "templates" && <TemplateGallery limit={null} showHeader={true} />}
          {activeTab === "assets" && <AssetsView />}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>

      {/* Global Interactive Modals */}
      <NewProjectModal />
      <TemplatePreviewModal />

      {/* Action Toast Notifications */}
      <Toast />
    </div>
  );
}
