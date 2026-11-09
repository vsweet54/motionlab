"use client";

import React from "react";
import AssetManagerModal from "@/components/assets/AssetManagerModal";

export default function AssetsView({ onOpenProject }) {
  return (
    <div className="space-y-6">
      <AssetManagerModal isModal={false} />
    </div>
  );
}
