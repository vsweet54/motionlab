"use client";

import { useEffect, useState } from "react";
import EditorTopBar from "./EditorTopBar";
import EditorLeftSidebar from "./EditorLeftSidebar";
import EditorPropertiesPanel from "./EditorPropertiesPanel";
import EditorShortcutsHandler from "./EditorShortcutsHandler";
import AnimationInspector from "./AnimationInspector";
import MobileBottomSheet from "./MobileBottomSheet";
import TimelinePanel from "@/components/timeline";
import CanvasStage from "@/components/canvas";
import EffectsLibraryModal from "@/components/effects/EffectsLibraryModal";
import PresetGalleryModal from "@/components/effects/PresetGalleryModal";
import AssetManagerModal from "@/components/assets/AssetManagerModal";
import AudioMixerPanel from "@/components/audio/AudioMixerPanel";
import AudioSyncModal from "@/components/audio/AudioSyncModal";
import AudioEffectsModal from "@/components/audio/AudioEffectsModal";
import ExportModal from "@/components/export/ExportModal";
import SaveAsTemplateModal from "@/components/templates/SaveAsTemplateModal";
import VersionHistoryModal from "@/components/projects/VersionHistoryModal";

// Stage 11 Advanced Tools & Code Export
import GraphEditorModal from "@/components/advanced/GraphEditorModal";
import MotionPathModal from "@/components/advanced/MotionPathModal";
import ExpressionEditorModal from "@/components/advanced/ExpressionEditorModal";
import TransformToolbar from "@/components/advanced/TransformToolbar";
import ProjectDiagnosticsModal from "@/components/advanced/ProjectDiagnosticsModal";
import ShortcutsHelpModal from "@/components/advanced/ShortcutsHelpModal";
import MobileTouchToolbar from "@/components/advanced/MobileTouchToolbar";
import CodeExportModal from "@/components/codeExport/CodeExportModal";
import PromptToMotionModal from "@/components/ai/PromptToMotionModal";

import { useEditorStore } from "@/store/useEditorStore";
import { useAnimationStore } from "@/store/useAnimationStore";

export default function StudioEditor({ project, onBackToDashboard }) {
  const initProject = useEditorStore((s) => s.initProject);
  const selectedLayerIds = useEditorStore((s) => s.selectedLayerIds);
  const addAssetLayer = useEditorStore((s) => s.addAssetLayer);
  const replaceLayerAsset = useEditorStore((s) => s.replaceLayerAsset);
  const isInspectorOpen = useAnimationStore((s) => s.isInspectorOpen);
  const setIsInspectorOpen = useAnimationStore((s) => s.setIsInspectorOpen);
  const isMixerOpen = useAnimationStore((s) => s.isMixerOpen);
  const setIsMixerOpen = useAnimationStore((s) => s.setIsMixerOpen);
  const isAudioSyncOpen = useAnimationStore((s) => s.isAudioSyncOpen);
  const setIsAudioSyncOpen = useAnimationStore((s) => s.setIsAudioSyncOpen);

  const [mounted, setMounted] = useState(false);
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);
  const [isEffectsModalOpen, setIsEffectsModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isAssetVaultOpen, setIsAssetVaultOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSaveAsTemplateOpen, setIsSaveAsTemplateOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [audioEffectsTrackId, setAudioEffectsTrackId] = useState(null);
  const [replacingLayerId, setReplacingLayerId] = useState(null);

  // Stage 11 State
  const [isGraphEditorOpen, setIsGraphEditorOpen] = useState(false);
  const [isMotionPathOpen, setIsMotionPathOpen] = useState(false);
  const [isExpressionsOpen, setIsExpressionsOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCodeExportOpen, setIsCodeExportOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (project) {
      initProject(project);
    }
  }, [project, initProject]);

  if (!mounted) {
    return (
      <div className="flex h-screen w-full bg-[#09090b] items-center justify-center text-zinc-500 font-mono text-xs">
        Loading MotionLab Studio Canvas...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#09090b] text-zinc-100 overflow-hidden select-none">
      {/* Global Keyboard Shortcuts */}
      <EditorShortcutsHandler />

      {/* Top Application Bar */}
      <EditorTopBar
        onBackToDashboard={onBackToDashboard}
        onToggleLeftSidebar={() => setMobileLeftOpen(!mobileLeftOpen)}
        onToggleRightSidebar={() => setMobileRightOpen(!mobileRightOpen)}
        isLeftOpen={mobileLeftOpen}
        isRightOpen={mobileRightOpen}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenEffectsLibrary={() => setIsEffectsModalOpen(true)}
        onOpenPresets={() => setIsPresetsModalOpen(true)}
        onOpenAssetVault={() => {
          setReplacingLayerId(null);
          setIsAssetVaultOpen(true);
        }}
        onOpenExport={() => setIsExportModalOpen(true)}
        onSaveAsTemplate={() => setIsSaveAsTemplateOpen(true)}
        onOpenVersionHistory={() => setIsVersionHistoryOpen(true)}
        onOpenCodeExport={() => setIsCodeExportOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenGraphEditor={() => setIsGraphEditorOpen(true)}
      />

      {/* Main Studio Viewport (Left Tools, Center Canvas, Right Properties) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Left Backdrop */}
        {mobileLeftOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileLeftOpen(false)}
          />
        )}

        {/* Left Tools & Layers Sidebar (Responsive Drawer on Mobile, Docked on MD+) */}
        <div
          className={`fixed inset-y-0 left-0 z-40 transition-transform duration-200 md:static md:translate-x-0 ${
            mobileLeftOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <EditorLeftSidebar
            onClose={() => setMobileLeftOpen(false)}
            onOpenAssetVault={() => {
              setReplacingLayerId(null);
              setIsAssetVaultOpen(true);
            }}
          />
        </div>

        {/* Center Canvas Viewport */}
        <main
          id="canvas-viewport-container"
          className="flex-1 h-full relative overflow-hidden bg-[#070709] flex items-center justify-center"
        >
          {/* Mobile Touch Quick Action Toolbar */}
          <MobileTouchToolbar
            onOpenGraphEditor={() => setIsGraphEditorOpen(true)}
            onOpenMotionPath={() => setIsMotionPathOpen(true)}
            onOpenExpressions={() => setIsExpressionsOpen(true)}
            onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
          />

          <CanvasStage />

          {/* Floating Transform Toolbar (Anchors, Align, Distribute, Group, Parent) */}
          {selectedLayerIds.length > 0 && (
            <TransformToolbar className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20" />
          )}
        </main>

        {/* Mobile Right Backdrop */}
        {mobileRightOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileRightOpen(false)}
          />
        )}

        {/* Right Inspector Panel (Responsive Drawer on Mobile, Docked on LG+) */}
        <div
          className={`fixed inset-y-0 right-0 z-40 transition-transform duration-200 lg:static lg:translate-x-0 ${
            mobileRightOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <EditorPropertiesPanel
            onClose={() => setMobileRightOpen(false)}
            onOpenEffectsLibrary={() => setIsEffectsModalOpen(true)}
            onOpenAssetVault={(layerId) => {
              setReplacingLayerId(layerId);
              setIsAssetVaultOpen(true);
            }}
            onOpenMotionPath={() => setIsMotionPathOpen(true)}
            onOpenExpressions={() => setIsExpressionsOpen(true)}
            onOpenGraphEditor={() => setIsGraphEditorOpen(true)}
          />
        </div>
      </div>

      {/* Bottom Keyframe Timeline & Sequencer Panel */}
      <TimelinePanel />

      {/* Mobile-first Animation & Keyframe Inspector Bottom Sheet */}
      <MobileBottomSheet
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        title="Animation Inspector"
      >
        <AnimationInspector onClose={() => setIsInspectorOpen(false)} />
      </MobileBottomSheet>

      {/* Visual Effects Library Modal / Drawer */}
      <EffectsLibraryModal
        isOpen={isEffectsModalOpen}
        onClose={() => setIsEffectsModalOpen(false)}
        targetLayerId={selectedLayerIds[0] || null}
      />

      {/* Motion Graphics Preset Gallery Modal */}
      <PresetGalleryModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
      />

      {/* Asset Manager & Media Vault Modal */}
      <AssetManagerModal
        isOpen={isAssetVaultOpen}
        onClose={() => {
          setIsAssetVaultOpen(false);
          setReplacingLayerId(null);
        }}
        onAddToCanvas={(asset) => {
          if (replacingLayerId) {
            replaceLayerAsset(replacingLayerId, asset);
            setReplacingLayerId(null);
          } else {
            addAssetLayer(asset);
          }
          setIsAssetVaultOpen(false);
        }}
      />

      {/* Professional Multi-Track Audio Mixer Panel */}
      <AudioMixerPanel
        isOpen={isMixerOpen}
        onClose={() => setIsMixerOpen(false)}
        onOpenEffects={(trackId) => setAudioEffectsTrackId(trackId)}
      />

      {/* Beat Synchronization & Audio-Reactive Generator Modal */}
      <AudioSyncModal
        isOpen={isAudioSyncOpen}
        onClose={() => setIsAudioSyncOpen(false)}
      />

      {/* DSP Audio Effects Rack Modal */}
      <AudioEffectsModal
        isOpen={!!audioEffectsTrackId}
        onClose={() => setAudioEffectsTrackId(null)}
        trackId={audioEffectsTrackId}
      />

      {/* Professional Export & Video Rendering Studio Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Save Active Project as Template Modal */}
      <SaveAsTemplateModal
        isOpen={isSaveAsTemplateOpen}
        onClose={() => setIsSaveAsTemplateOpen(false)}
      />

      {/* Version History & Snapshots Modal */}
      <VersionHistoryModal
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
      />

      {/* STAGE 11 ADVANCED TOOLS & CODE EXPORT MODALS */}
      <GraphEditorModal
        isOpen={isGraphEditorOpen}
        onClose={() => setIsGraphEditorOpen(false)}
      />

      <MotionPathModal
        isOpen={isMotionPathOpen}
        onClose={() => setIsMotionPathOpen(false)}
      />

      <ExpressionEditorModal
        isOpen={isExpressionsOpen}
        onClose={() => setIsExpressionsOpen(false)}
      />

      <ProjectDiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />

      <ShortcutsHelpModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <CodeExportModal
        isOpen={isCodeExportOpen}
        onClose={() => setIsCodeExportOpen(false)}
      />

      {/* Gemini AI Prompt-to-Motion Modal */}
      <PromptToMotionModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
}
