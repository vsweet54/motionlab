/**
 * Audio Mixer & Routing Graph for MotionLab
 * Manages Master Bus, Track Channels, Stereo Panning, Gain Staging, and Real-time Analyser Meters.
 */

import { audioContextManager } from "./audioContext";
import {
  createEqualizerNode,
  createCompressorNode,
  createReverbNode,
  createDelayNode,
  createDistortionNode,
  createLowPassNode,
  createHighPassNode,
} from "./effects";

class AudioMixer {
  constructor() {
    this.masterGain = null;
    this.masterAnalyser = null;
    this.channels = new Map(); // trackId -> ChannelStrip
    this.masterVolume = 1.0;
    this.isMuted = false;
    this.soloTrackIds = new Set();
  }

  /**
   * Initializes master bus nodes
   */
  initMasterBus() {
    const ctx = audioContextManager.getContext();
    if (!ctx) return;

    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;

      this.masterAnalyser = ctx.createAnalyser();
      this.masterAnalyser.fftSize = 256;
      this.masterAnalyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.masterAnalyser);
      this.masterAnalyser.connect(ctx.destination);
    }
  }

  /**
   * Sets or updates master volume
   */
  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(2.0, val));
    if (this.masterGain) {
      const ctx = audioContextManager.getContext();
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.masterVolume,
        ctx.currentTime,
        0.02
      );
    }
  }

  /**
   * Toggles master mute
   */
  toggleMasterMute() {
    this.isMuted = !this.isMuted;
    this.setMasterVolume(this.masterVolume);
  }

  /**
   * Creates or updates a channel strip for a specific audio track/layer
   */
  getOrCreateChannel(trackId) {
    this.initMasterBus();
    const ctx = audioContextManager.getContext();

    if (this.channels.has(trackId)) {
      return this.channels.get(trackId);
    }

    // Input gain
    const inputGain = ctx.createGain();

    // Stereo Panner
    let pannerNode = null;
    if (ctx.createStereoPanner) {
      pannerNode = ctx.createStereoPanner();
      pannerNode.pan.value = 0;
    }

    // Volume Gain
    const volumeGain = ctx.createGain();
    volumeGain.gain.value = 1.0;

    // Track Analyser for meter
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;

    // Connect default chain
    if (pannerNode) {
      inputGain.connect(pannerNode);
      pannerNode.connect(volumeGain);
    } else {
      inputGain.connect(volumeGain);
    }

    volumeGain.connect(analyser);
    analyser.connect(this.masterGain);

    const channel = {
      id: trackId,
      inputNode: inputGain,
      pannerNode,
      volumeGain,
      analyser,
      volume: 1.0,
      pan: 0,
      isMuted: false,
      isSolo: false,
      effectsChain: new Map(), // effectType -> effectNode
    };

    this.channels.set(trackId, channel);
    return channel;
  }

  /**
   * Updates track channel parameters
   */
  updateChannel(trackId, { volume, pan, isMuted, isSolo }) {
    const channel = this.getOrCreateChannel(trackId);
    const ctx = audioContextManager.getContext();

    if (volume !== undefined) channel.volume = Math.max(0, Math.min(2.0, volume));
    if (pan !== undefined && channel.pannerNode) {
      channel.pan = Math.max(-1.0, Math.min(1.0, pan));
      channel.pannerNode.pan.setTargetAtTime(channel.pan, ctx.currentTime, 0.03);
    }
    if (isMuted !== undefined) channel.isMuted = !!isMuted;
    if (isSolo !== undefined) {
      if (isSolo) {
        this.soloTrackIds.add(trackId);
      } else {
        this.soloTrackIds.delete(trackId);
      }
      channel.isSolo = !!isSolo;
    }

    this.recalculateAllGains();
  }

  /**
   * Recalculates gain states taking Solo & Mute into account across all channels
   */
  recalculateAllGains() {
    const ctx = audioContextManager.getContext();
    const hasSolo = this.soloTrackIds.size > 0;

    for (const [id, ch] of this.channels.entries()) {
      let effectiveGain = ch.volume;

      if (ch.isMuted) {
        effectiveGain = 0;
      } else if (hasSolo && !this.soloTrackIds.has(id)) {
        effectiveGain = 0; // Muted due to other track in solo
      }

      ch.volumeGain.gain.setTargetAtTime(effectiveGain, ctx.currentTime, 0.02);
    }
  }

  /**
   * Applies an audio effect to a track channel
   */
  applyEffect(trackId, effectType, params) {
    const channel = this.getOrCreateChannel(trackId);
    const ctx = audioContextManager.getContext();

    if (channel.effectsChain.has(effectType)) {
      // Update existing effect
      const existing = channel.effectsChain.get(effectType);
      existing.update(params);
      return;
    }

    let nodeBuilder = null;
    switch (effectType) {
      case "equalizer":
        nodeBuilder = createEqualizerNode;
        break;
      case "compressor":
        nodeBuilder = createCompressorNode;
        break;
      case "reverb":
        nodeBuilder = createReverbNode;
        break;
      case "delay":
        nodeBuilder = createDelayNode;
        break;
      case "distortion":
        nodeBuilder = createDistortionNode;
        break;
      case "lowpass":
        nodeBuilder = createLowPassNode;
        break;
      case "highpass":
        nodeBuilder = createHighPassNode;
        break;
      default:
        return;
    }

    const effect = nodeBuilder(ctx, params);
    channel.effectsChain.set(effectType, effect);

    // Rebuild track audio graph
    this.rebuildTrackRouting(channel);
  }

  /**
   * Removes an effect from a track
   */
  removeEffect(trackId, effectType) {
    const channel = this.channels.get(trackId);
    if (!channel || !channel.effectsChain.has(effectType)) return;

    channel.effectsChain.delete(effectType);
    this.rebuildTrackRouting(channel);
  }

  /**
   * Reconnects input -> effects... -> panner -> volume -> analyser -> master
   */
  rebuildTrackRouting(channel) {
    try {
      channel.inputNode.disconnect();
      if (channel.pannerNode) channel.pannerNode.disconnect();
      channel.volumeGain.disconnect();

      let currentNode = channel.inputNode;

      for (const [, effect] of channel.effectsChain.entries()) {
        currentNode.connect(effect.input);
        currentNode = effect.output;
      }

      if (channel.pannerNode) {
        currentNode.connect(channel.pannerNode);
        channel.pannerNode.connect(channel.volumeGain);
      } else {
        currentNode.connect(channel.volumeGain);
      }

      channel.volumeGain.connect(channel.analyser);
      channel.analyser.connect(this.masterGain);
    } catch (err) {
      console.warn("Error rebuilding track routing:", err);
    }
  }

  /**
   * Measures current audio level for a track or master
   * @param {AnalyserNode} analyser
   * @returns {{ rms: number, peak: number, db: number }}
   */
  measureLevel(analyser) {
    if (!analyser) return { rms: 0, peak: 0, db: -60 };

    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);

    let sum = 0;
    let peak = 0;

    for (let i = 0; i < data.length; i++) {
      const val = Math.abs(data[i]);
      if (val > peak) peak = val;
      sum += val * val;
    }

    const rms = Math.sqrt(sum / data.length);
    const db = rms > 0.0001 ? Math.max(-60, 20 * Math.log10(rms)) : -60;

    return {
      rms: Math.min(1.0, rms * 1.8),
      peak: Math.min(1.0, peak),
      db: Math.round(db),
    };
  }

  getTrackLevel(trackId) {
    const channel = this.channels.get(trackId);
    if (!channel) return { rms: 0, peak: 0, db: -60 };
    return this.measureLevel(channel.analyser);
  }

  getMasterLevel() {
    this.initMasterBus();
    return this.measureLevel(this.masterAnalyser);
  }
}

export const studioMixer = new AudioMixer();
