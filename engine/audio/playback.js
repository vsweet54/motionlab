/**
 * Synchronized Audio Playback Engine for MotionLab
 * Coordinates real-time Web Audio API clip scheduling with the GSAP animation timeline playhead.
 */

import { audioContextManager } from "./audioContext";
import { studioMixer } from "./mixer";
import { getAssetById } from "@/lib/storage/db";

class AudioPlaybackEngine {
  constructor() {
    this.activeSources = new Map(); // layerId -> { sourceNode, gainNode }
    this.isPlaying = false;
    this.currentPlayheadTime = 0;
  }

  /**
   * Synchronizes and plays all audio clips active at currentTime
   * @param {object[]} audioLayers - Layers of type 'audio'
   * @param {number} currentTime - Current animation timeline seconds
   * @param {number} masterSpeed - Playback rate multiplier
   */
  async syncAndPlay(audioLayers, currentTime, masterSpeed = 1.0) {
    this.stopAll();
    const ctx = audioContextManager.getContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }

    this.isPlaying = true;
    this.currentPlayheadTime = currentTime;

    for (const layer of audioLayers) {
      if (layer.visible === false || layer.isMuted) continue;

      const clipStart = Number(layer.startTime ?? 0);
      const clipDuration = Number(layer.duration ?? 5.0);
      const clipEnd = clipStart + clipDuration;

      // Check if currentTime is within this clip's range
      if (currentTime >= clipStart && currentTime < clipEnd) {
        this.scheduleClipPlayback(layer, currentTime, masterSpeed);
      }
    }
  }

  /**
   * Schedules a single audio clip for playback
   */
  async scheduleClipPlayback(layer, currentTime, masterSpeed = 1.0) {
    const ctx = audioContextManager.getContext();
    if (!ctx || !this.isPlaying) return;

    try {
      // 1. Obtain audio buffer
      let audioBuffer = null;
      const cacheKey = layer.assetId || layer.src || layer.id;

      if (layer.assetId) {
        const asset = await getAssetById(layer.assetId);
        if (asset?.blob) {
          audioBuffer = layer.isReverse
            ? await audioContextManager.getReversedAudio(cacheKey, asset.blob)
            : await audioContextManager.decodeAudio(cacheKey, asset.blob);
        }
      }

      if (!audioBuffer && layer.src) {
        audioBuffer = layer.isReverse
          ? await audioContextManager.getReversedAudio(cacheKey, layer.src)
          : await audioContextManager.decodeAudio(cacheKey, layer.src);
      }

      if (!audioBuffer) return;

      // 2. Compute playback timing
      const clipStart = Number(layer.startTime ?? 0);
      const clipDuration = Number(layer.duration ?? audioBuffer.duration);
      const offsetWithinClip = Math.max(0, currentTime - clipStart);

      if (offsetWithinClip >= clipDuration) return;

      // 3. Create Source and Gain nodes
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      // Playback speed
      const speed = (Number(layer.playbackSpeed) || 1.0) * masterSpeed;
      source.playbackRate.value = Math.max(0.25, Math.min(4.0, speed));

      // Loop setting
      if (layer.isLoop) {
        source.loop = true;
        source.loopStart = 0;
        source.loopEnd = clipDuration;
      }

      // Clip volume and fade in/out
      const clipGain = ctx.createGain();
      const baseVolume = Number(layer.volume ?? 1.0);
      const fadeInDuration = Number(layer.fadeIn ?? 0);
      const fadeOutDuration = Number(layer.fadeOut ?? 0);

      const now = ctx.currentTime;
      const remainingTime = (clipDuration - offsetWithinClip) / speed;

      // Apply Fade In ramp
      if (fadeInDuration > 0 && offsetWithinClip < fadeInDuration) {
        clipGain.gain.setValueAtTime(0.001, now);
        clipGain.gain.linearRampToValueAtTime(baseVolume, now + (fadeInDuration - offsetWithinClip));
      } else {
        clipGain.gain.setValueAtTime(baseVolume, now);
      }

      // Apply Fade Out ramp
      if (fadeOutDuration > 0) {
        const fadeOutStartTime = now + Math.max(0, remainingTime - fadeOutDuration);
        clipGain.gain.setValueAtTime(baseVolume, fadeOutStartTime);
        clipGain.gain.linearRampToValueAtTime(0.001, now + remainingTime);
      }

      // Connect: source -> clipGain -> Mixer channel input
      const channel = studioMixer.getOrCreateChannel(layer.id);
      source.connect(clipGain);
      clipGain.connect(channel.inputNode);

      // Start playback
      source.start(now, offsetWithinClip, remainingTime);

      source.onended = () => {
        if (this.activeSources.get(layer.id)?.sourceNode === source) {
          this.activeSources.delete(layer.id);
        }
      };

      this.activeSources.set(layer.id, {
        sourceNode: source,
        gainNode: clipGain,
      });
    } catch (err) {
      console.warn(`Failed to play audio clip "${layer.name}":`, err);
    }
  }

  /**
   * Stops all playing audio clips immediately without pops
   */
  stopAll() {
    this.isPlaying = false;
    const ctx = audioContextManager.getContext();

    for (const [id, item] of this.activeSources.entries()) {
      try {
        if (item.gainNode && ctx) {
          item.gainNode.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
        }
        if (item.sourceNode) {
          item.sourceNode.stop(ctx ? ctx.currentTime + 0.02 : 0);
          item.sourceNode.disconnect();
        }
      } catch {
        // already stopped
      }
    }
    this.activeSources.clear();
  }
}

export const studioAudioPlayback = new AudioPlaybackEngine();
