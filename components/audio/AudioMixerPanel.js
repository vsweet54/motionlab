"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Activity,
  Layers,
} from "lucide-react";
import { studioMixer } from "@/engine/audio/mixer";
import { useEditorStore } from "@/store/useEditorStore";
import AudioEffectsModal from "./AudioEffectsModal";

export default function AudioMixerPanel({ onClose }) {
  const layers = useEditorStore((s) => s.layers);
  const updateLayer = useEditorStore((s) => s.updateLayer);

  const audioLayers = layers.filter((l) => l.type === "audio");

  const [masterVol, setMasterVol] = useState(studioMixer.masterVolume);
  const [masterMuted, setMasterMuted] = useState(studioMixer.isMuted);
  const [activeEffectsTrackId, setActiveEffectsTrackId] = useState(null);

  // Meter levels state: { master: { peak, rms, db }, [trackId]: { peak, rms, db } }
  const [meterLevels, setMeterLevels] = useState({});
  const rafRef = useRef(null);

  // Continuous level meter animation loop
  useEffect(() => {
    const updateMeters = () => {
      const levels = {};
      levels.master = studioMixer.getMasterLevel();

      for (const track of audioLayers) {
        levels[track.id] = studioMixer.getTrackLevel(track.id);
      }

      setMeterLevels(levels);
      rafRef.current = requestAnimationFrame(updateMeters);
    };

    rafRef.current = requestAnimationFrame(updateMeters);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [audioLayers]);

  // Master Volume Change
  const handleMasterVolumeChange = (val) => {
    setMasterVol(val);
    studioMixer.setMasterVolume(val);
  };

  // Master Mute
  const handleMasterMuteToggle = () => {
    const next = !masterMuted;
    setMasterMuted(next);
    studioMixer.toggleMasterMute();
  };

  // Track Volume Change
  const handleTrackVolumeChange = (trackId, val) => {
    updateLayer(trackId, { volume: val });
    studioMixer.updateChannel(trackId, { volume: val });
  };

  // Track Pan Change
  const handleTrackPanChange = (trackId, val) => {
    updateLayer(trackId, { pan: val });
    studioMixer.updateChannel(trackId, { pan: val });
  };

  // Track Mute Toggle
  const handleTrackMuteToggle = (trackId, currentMuted) => {
    const next = !currentMuted;
    updateLayer(trackId, { isMuted: next });
    studioMixer.updateChannel(trackId, { isMuted: next });
  };

  // Track Solo Toggle
  const handleTrackSoloToggle = (trackId, currentSolo) => {
    const next = !currentSolo;
    updateLayer(trackId, { isSolo: next });
    studioMixer.updateChannel(trackId, { isSolo: next });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none animate-fade-in">
      <div className="w-full max-w-5xl bg-surface-200 border border-surface-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white tracking-tight">
                Studio Multi-Track Audio Mixer
              </h2>
              <span className="text-[11px] font-mono text-zinc-400">
                {audioLayers.length} Audio Channels &bull; 32-bit Floating DSP
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-surface-200 hover:bg-surface-border border border-surface-border text-zinc-400 hover:text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mixer Board Viewport */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6 flex items-stretch gap-3 bg-[#08080c]">
          {audioLayers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
              <Volume2 className="w-12 h-12 text-zinc-700 mb-3" />
              <h3 className="text-sm font-semibold text-zinc-300">No Audio Tracks Active</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                Add audio clips from the Asset Vault or Timeline to control multi-channel volume, panning, and DSP effects here.
              </p>
            </div>
          ) : (
            audioLayers.map((track, idx) => {
              const meter = meterLevels[track.id] || { rms: 0, peak: 0, db: -60 };
              const volume = track.volume ?? 1.0;
              const pan = track.pan ?? 0;
              const isMuted = !!track.isMuted;
              const isSolo = !!track.isSolo;

              return (
                <div
                  key={track.id}
                  className="w-36 flex-shrink-0 bg-surface-100 rounded-2xl border border-surface-border flex flex-col justify-between p-3.5 space-y-3"
                >
                  {/* Channel Header */}
                  <div className="text-center space-y-1 pb-2 border-b border-surface-border">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
                      CH {idx + 1}
                    </span>
                    <span className="font-semibold text-xs text-zinc-200 block truncate" title={track.name}>
                      {track.name}
                    </span>
                  </div>

                  {/* Channel Strip Center (Meters & Fader) */}
                  <div className="flex-1 flex items-center justify-center gap-3 py-2 min-h-[160px]">
                    {/* LED Level Meter Bar */}
                    <div className="w-3.5 h-44 bg-surface-200 rounded-full overflow-hidden flex flex-col-reverse p-0.5 border border-surface-border/60">
                      <div
                        className={`w-full rounded-full transition-all duration-75 ${
                          meter.peak > 0.85
                            ? "bg-red-500 shadow-glow"
                            : meter.peak > 0.6
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                        }`}
                        style={{ height: `${Math.max(3, meter.peak * 100)}%` }}
                      />
                    </div>

                    {/* Vertical Volume Fader */}
                    <div className="h-44 flex flex-col items-center justify-between">
                      <input
                        type="range"
                        min="0"
                        max="1.5"
                        step="0.02"
                        value={volume}
                        onChange={(e) => handleTrackVolumeChange(track.id, parseFloat(e.target.value))}
                        className="h-36 w-3 accent-emerald-500 cursor-pointer -rotate-90 origin-center"
                      />
                      <span className="font-mono text-[10px] text-zinc-400 font-bold">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Stereo Pan Slider */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span>L</span>
                      <span className="text-zinc-300 font-bold">
                        {pan === 0 ? "C" : pan < 0 ? `${Math.round(Math.abs(pan) * 100)}%L` : `${Math.round(pan * 100)}%R`}
                      </span>
                      <span>R</span>
                    </div>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.05"
                      value={pan}
                      onChange={(e) => handleTrackPanChange(track.id, parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-surface-200 rounded-full"
                    />
                  </div>

                  {/* Mute, Solo & FX Buttons */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-surface-border">
                    <button
                      onClick={() => handleTrackMuteToggle(track.id, isMuted)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-colors min-h-[36px] ${
                        isMuted
                          ? "bg-red-500 text-white shadow-sm"
                          : "bg-surface-200 text-zinc-400 hover:text-white"
                      }`}
                    >
                      M
                    </button>
                    <button
                      onClick={() => handleTrackSoloToggle(track.id, isSolo)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-colors min-h-[36px] ${
                        isSolo
                          ? "bg-amber-500 text-black shadow-glow"
                          : "bg-surface-200 text-zinc-400 hover:text-white"
                      }`}
                    >
                      S
                    </button>

                    <button
                      onClick={() => setActiveEffectsTrackId(track.id)}
                      className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-surface-200 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[11px] font-semibold transition-all min-h-[36px]"
                    >
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span>FX Rack</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Master Bus Channel Strip */}
          <div className="w-40 flex-shrink-0 bg-gradient-to-b from-surface-150 to-surface-100 rounded-2xl border-2 border-brand-500/40 flex flex-col justify-between p-3.5 space-y-3 shadow-xl">
            {/* Master Header */}
            <div className="text-center space-y-1 pb-2 border-b border-surface-border">
              <span className="text-[10px] font-mono text-brand-400 uppercase tracking-widest font-bold block">
                MAIN OUTPUT
              </span>
              <span className="font-bold text-xs text-white block">
                Master Bus
              </span>
            </div>

            {/* Master Meters & Fader */}
            <div className="flex-1 flex items-center justify-center gap-3 py-2 min-h-[160px]">
              {/* Stereo Master Meter (L & R) */}
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-44 bg-surface-200 rounded-full overflow-hidden flex flex-col-reverse p-0.5 border border-surface-border/60">
                  <div
                    className={`w-full rounded-full transition-all duration-75 ${
                      (meterLevels.master?.peak || 0) > 0.85
                        ? "bg-red-500"
                        : "bg-brand-400"
                    }`}
                    style={{ height: `${Math.max(3, (meterLevels.master?.peak || 0) * 100)}%` }}
                  />
                </div>
                <div className="w-2.5 h-44 bg-surface-200 rounded-full overflow-hidden flex flex-col-reverse p-0.5 border border-surface-border/60">
                  <div
                    className={`w-full rounded-full transition-all duration-75 ${
                      (meterLevels.master?.peak || 0) > 0.85
                        ? "bg-red-500"
                        : "bg-brand-400"
                    }`}
                    style={{ height: `${Math.max(3, (meterLevels.master?.rms || 0) * 120)}%` }}
                  />
                </div>
              </div>

              {/* Master Volume Fader */}
              <div className="h-44 flex flex-col items-center justify-between">
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.02"
                  value={masterVol}
                  onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
                  className="h-36 w-3 accent-brand-500 cursor-pointer -rotate-90 origin-center"
                />
                <span className="font-mono text-[10px] text-brand-300 font-bold">
                  {Math.round(masterVol * 100)}%
                </span>
              </div>
            </div>

            {/* Master dB Readout */}
            <div className="text-center p-2 rounded-xl bg-surface-200 border border-surface-border">
              <span className="text-[10px] text-zinc-400 font-mono block">Peak Level</span>
              <span className="font-mono text-xs font-bold text-white">
                {meterLevels.master?.db !== undefined ? `${meterLevels.master.db} dBFS` : "-60 dBFS"}
              </span>
            </div>

            {/* Master Mute */}
            <button
              onClick={handleMasterMuteToggle}
              className={`w-full py-2 rounded-xl text-xs font-bold transition-colors min-h-[38px] flex items-center justify-center gap-2 ${
                masterMuted
                  ? "bg-red-600 text-white shadow-glow"
                  : "bg-surface-200 text-zinc-300 hover:text-white border border-surface-border"
              }`}
            >
              {masterMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{masterMuted ? "MUTED" : "MUTE ALL"}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-surface-border bg-surface-100 flex items-center justify-between text-xs text-zinc-400">
          <span>Routing: Channels &rarr; Track DSP &rarr; Pan &rarr; Master Bus &rarr; Audio Destination</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors min-h-[44px]"
          >
            Close Mixer
          </button>
        </div>
      </div>

      {/* Sub-modal: Effects Rack */}
      {activeEffectsTrackId && (
        <AudioEffectsModal
          trackId={activeEffectsTrackId}
          trackName={audioLayers.find((l) => l.id === activeEffectsTrackId)?.name}
          onClose={() => setActiveEffectsTrackId(null)}
        />
      )}
    </div>
  );
}
