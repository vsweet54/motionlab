/**
 * Multi-Track Audio Render Mixer for Video Export
 * Combines all audio tracks according to their start time, duration, volume, pan, and fade ramps,
 * and produces a MediaStreamAudioDestinationNode or mixed AudioBuffer for video muxing.
 */

import { audioContextManager } from "@/engine/audio/audioContext";

/**
 * Creates an offline or real-time mixed audio stream for MediaRecorder video export.
 * @param {Array} audioLayers - Project layers with type === 'audio'
 * @param {number} duration - Export duration in seconds
 * @param {number} startTime - Export start offset in seconds
 * @returns {Promise<{ stream: MediaStream|null, cleanup: Function, hasAudio: boolean }>}
 */
export async function createExportAudioStream(audioLayers, duration, startTime = 0) {
  const activeAudios = audioLayers.filter(
    (l) => l.type === "audio" && (l.url || l.audioUrl) && !l.isMuted
  );

  if (activeAudios.length === 0) {
    return { stream: null, cleanup: () => {}, hasAudio: false };
  }

  const ctx = audioContextManager.getContext();
  if (!ctx) {
    return { stream: null, cleanup: () => {}, hasAudio: false };
  }

  // Create destination stream node
  const dest = ctx.createMediaStreamDestination();
  const sourceNodes = [];

  for (const layer of activeAudios) {
    const src = layer.url || layer.audioUrl;
    try {
      const audioBuffer = await audioContextManager.decodeAudio(src, src);
      if (!audioBuffer) continue;

      const layerStart = Number(layer.startTime || 0);
      const layerDuration = Number(layer.duration || audioBuffer.duration);
      const volume = layer.volume !== undefined ? Number(layer.volume) : 1.0;
      const fadeIn = Number(layer.fadeIn || 0);
      const fadeOut = Number(layer.fadeOut || 0);
      const pan = Number(layer.pan || 0);

      // Check if clip overlaps export range
      const clipStart = layerStart;
      const clipEnd = layerStart + layerDuration;
      const exportStart = startTime;
      const exportEnd = startTime + duration;

      if (clipEnd <= exportStart || clipStart >= exportEnd) {
        continue;
      }

      // Calculate schedule timing relative to export start
      const scheduleDelay = Math.max(0, clipStart - exportStart);
      const bufferOffset = Math.max(0, exportStart - clipStart);
      const playDuration = Math.min(layerDuration - bufferOffset, exportEnd - (clipStart + bufferOffset));

      if (playDuration <= 0) continue;

      // Create BufferSourceNode
      const source = ctx.createBufferSource();
      source.buffer = layer.isReverse
        ? await audioContextManager.getReversedAudio(src, src)
        : audioBuffer;

      source.playbackRate.value = Number(layer.playbackSpeed || 1.0);
      source.loop = !!layer.isLoop;

      // Gain Node for Volume & Fades
      const gainNode = ctx.createGain();
      const now = ctx.currentTime;
      const effectiveStart = now + scheduleDelay;
      const effectiveEnd = effectiveStart + playDuration;

      gainNode.gain.setValueAtTime(0, now);

      if (fadeIn > 0) {
        gainNode.gain.setValueAtTime(0, effectiveStart);
        gainNode.gain.linearRampToValueAtTime(volume, effectiveStart + fadeIn);
      } else {
        gainNode.gain.setValueAtTime(volume, effectiveStart);
      }

      if (fadeOut > 0) {
        gainNode.gain.setValueAtTime(volume, Math.max(effectiveStart, effectiveEnd - fadeOut));
        gainNode.gain.linearRampToValueAtTime(0, effectiveEnd);
      }

      // Panner Node
      let pannerNode = null;
      if (typeof ctx.createStereoPanner === "function") {
        pannerNode = ctx.createStereoPanner();
        pannerNode.pan.value = Math.max(-1, Math.min(1, pan));
      }

      // Routing
      if (pannerNode) {
        source.connect(gainNode);
        gainNode.connect(pannerNode);
        pannerNode.connect(dest);
      } else {
        source.connect(gainNode);
        gainNode.connect(dest);
      }

      // Schedule start & stop
      source.start(effectiveStart, bufferOffset, playDuration);
      sourceNodes.push(source);
    } catch (err) {
      console.warn("Failed to schedule audio track for export:", err);
    }
  }

  const cleanup = () => {
    for (const s of sourceNodes) {
      try {
        s.stop();
        s.disconnect();
      } catch (e) {}
    }
  };

  return {
    stream: dest.stream,
    cleanup,
    hasAudio: sourceNodes.length > 0,
  };
}
