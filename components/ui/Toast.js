"use client";

import { useProjectStore } from "@/store/useProjectStore";
import { CheckCircle2 } from "lucide-react";

export default function Toast() {
  const toastMessage = useProjectStore((s) => s.toastMessage);

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl text-zinc-100 text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <span>{toastMessage}</span>
    </div>
  );
}
