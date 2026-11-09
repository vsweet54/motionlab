"use client";

import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  Layers,
  Settings,
  Plus,
  Compass,
  X,
  Sliders,
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "templates", label: "Templates", icon: Sparkles },
  { id: "assets", label: "Assets", icon: Layers },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ mobileOpen = false, setMobileOpen = () => {} }) {
  const { activeTab, setActiveTab, openNewProjectModal, projects } = useProjectStore();

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-surface-200 border-r border-surface-border transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Logo Header */}
        <div className="h-16 px-5 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 via-brand-500 to-brand-accent flex items-center justify-center shadow-glow">
              <Compass className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">
                  Motion<span className="text-brand-400">Lab</span>
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  v0.1
                </span>
              </div>
              <p className="text-[10px] text-zinc-500">Motion Graphics Engine</p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-surface-border/50 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: New Project */}
        <div className="p-4">
          <button
            onClick={() => {
              openNewProjectModal();
              if (mobileOpen) setMobileOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-sm shadow-glow transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Workspace
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const count =
              item.id === "projects" ? projects.length : null;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-brand-600/15 text-brand-400 border border-brand-500/30 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-surface-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-brand-400" : "text-zinc-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {count !== null && count > 0 && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-50 text-zinc-400 border border-surface-border">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Status Card */}
        <div className="p-4 border-t border-surface-border">
          <div className="p-3 rounded-xl bg-surface-100 border border-surface-border/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-300">Local Engine</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mb-2">
              Hardware accelerated canvas with 60 FPS GSAP timing.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
              <Sliders className="w-3 h-3 text-zinc-500" />
              <span>Storage: IndexedDB</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
