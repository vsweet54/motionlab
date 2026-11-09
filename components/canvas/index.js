"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import KonvaCanvas without SSR to prevent window/document undefined issues
const KonvaCanvas = dynamic(() => import("./KonvaCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#070709] text-zinc-500">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-2" />
      <span className="text-xs font-mono">Initializing Konva Canvas Engine...</span>
    </div>
  ),
});

export default function CanvasStage() {
  return <KonvaCanvas />;
}
