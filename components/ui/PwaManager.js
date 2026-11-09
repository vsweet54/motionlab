"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export default function PwaManager() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker in production
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            // Check for updates
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                    console.log("MotionLab updated. New shell ready on next reload.");
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn("MotionLab PWA service worker notice:", err);
          });
      });
    }

    // 2. Capture Android Chrome Install Prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShowBanner(false);
      setInstallPrompt(null);
    }
  };

  if (!showBanner || !installPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 p-3.5 rounded-2xl bg-surface-200/95 backdrop-blur-md border border-brand-500/30 shadow-2xl flex items-center justify-between gap-3 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/30">
          <Download className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white">Install MotionLab</h4>
          <p className="text-[11px] text-zinc-400">Launch directly from home screen</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-glow transition-all"
        >
          Install
        </button>
        <button
          onClick={() => setShowBanner(false)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
