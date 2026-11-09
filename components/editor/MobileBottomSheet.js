"use client";

import React from "react";
import { X } from "lucide-react";

export default function MobileBottomSheet({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with tap to dismiss */}
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Container: Bottom Sheet on Mobile, Slide-out Drawer on Tablet/Desktop */}
      <div
        className="fixed bottom-0 left-0 right-0 max-h-[85vh] sm:max-h-[75vh] lg:top-0 lg:bottom-0 lg:left-auto lg:right-0 lg:w-96 lg:max-h-full z-50 bg-surface-200 border-t lg:border-t-0 lg:border-l border-surface-border rounded-t-2xl lg:rounded-none shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom lg:slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle for Touch Devices */}
        <div className="w-full flex items-center justify-center pt-2.5 pb-1 lg:hidden">
          <div className="w-12 h-1.5 rounded-full bg-zinc-600" />
        </div>

        {/* Content Host */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    </>
  );
}
