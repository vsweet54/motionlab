/**
 * Audio Waveform Extraction Utility for MotionLab
 * Decodes audio data offline via Web Audio API and generates normalized peak samples.
 */

/**
 * Extracts waveform peaks from an audio File or Blob.
 * @param {Blob|File} audioBlob
 * @param {number} numPeaks - Number of peak points to extract (default: 80)
 * @returns {Promise<{ peaks: number[], duration: number }>}
 */
export async function extractWaveform(audioBlob, numPeaks = 80) {
  if (typeof window === "undefined") {
    return { peaks: Array(numPeaks).fill(0.3), duration: 0 };
  }

  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return { peaks: generateFallbackPeaks(audioBlob.size, numPeaks), duration: 0 };
    }

    const audioCtx = new AudioContextClass();
    let audioBuffer;

    try {
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } finally {
      if (audioCtx.state !== "closed" && typeof audioCtx.close === "function") {
        audioCtx.close().catch(() => {});
      }
    }

    const channelData = audioBuffer.getChannelData(0); // Take first channel (mono/left)
    const duration = audioBuffer.duration;
    const totalSamples = channelData.length;
    const blockSize = Math.floor(totalSamples / numPeaks);
    const peaks = [];

    for (let i = 0; i < numPeaks; i++) {
      const start = i * blockSize;
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const val = Math.abs(channelData[start + j] || 0);
        if (val > max) max = val;
      }
      // Clamp between 0.05 and 1.0 for aesthetic display
      peaks.push(Number(Math.max(0.05, Math.min(1.0, max)).toFixed(3)));
    }

    return { peaks, duration: Number(duration.toFixed(2)) };
  } catch (err) {
    console.warn("Could not decode audio data for waveform:", err);
    return {
      peaks: generateFallbackPeaks(audioBlob.size, numPeaks),
      duration: 0,
    };
  }
}

/**
 * Deterministic fallback peak generator based on blob size and index
 */
function generateFallbackPeaks(seed, count) {
  const peaks = [];
  for (let i = 0; i < count; i++) {
    const sin1 = Math.sin((i + seed % 100) * 0.2);
    const sin2 = Math.cos((i + seed % 50) * 0.4);
    const val = 0.2 + 0.6 * Math.abs((sin1 + sin2) / 2);
    peaks.push(Number(Math.max(0.1, Math.min(1.0, val)).toFixed(2)));
  }
  return peaks;
}
