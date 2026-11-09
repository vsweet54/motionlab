"use client";

import { Menu, Search, Plus, Sparkles } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";

const TITLES = {
  dashboard: "Studio Dashboard",
  projects: "Project Library",
  templates: "Motion Template Gallery",
  assets: "Asset Management",
  settings: "Studio Settings",
};

export default function Header({ onOpenMobileMenu }) {
  const { activeTab, searchQuery, setSearchQuery, openNewProjectModal } =
    useProjectStore();

  return (
    <header className="h-16 px-4 lg:px-8 border-b border-surface-border bg-surface-200/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-1 text-zinc-400 hover:text-white rounded-lg hover:bg-surface-border/50 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base lg:text-lg font-semibold text-white tracking-tight">
            {TITLES[activeTab] || "MotionLab"}
          </h1>
          <p className="text-[11px] text-zinc-400 hidden sm:block">
            Browser-based Motion Graphics Studio
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative w-40 sm:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects & templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-100 border border-surface-border rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
          />
        </div>

        {/* Quick New Project Button in Header */}
        <button
          onClick={() => openNewProjectModal()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Project</span>
        </button>
      </div>
    </header>
  );
}
