/**
 * Real Audio Beat & BPM Detection Algorithm for MotionLab
 * Analyzes audio amplitude energy flux and detects real musical onsets and tempo.
 */

/**
 * Detects musical beats and calculates BPM from an AudioBuffer
 * @param {AudioBuffer} audioBuffer
 * @returns {{ bpm: number, beats: number[], energyEnvelope: number[] }}
 */
export function analyzeAudioBeats(audioBuffer) {
  if (!audioBuffer) return { bpm: 120, beats: [], energyEnvelope: [] };

  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0); // Mono/Left channel
  const totalSamples = channelData.length;

  // Window size of ~1024 samples (approx 23ms at 44.1kHz)
  const windowSize = 1024;
  const numBlocks = Math.floor(totalSamples / windowSize);

  // 1. Calculate instant RMS energy of each block
  const energies = new Float32Array(numBlocks);
  for (let b = 0; b < numBlocks; b++) {
    const start = b * windowSize;
    let sum = 0;
    for (let i = 0; i < windowSize; i++) {
      const val = channelData[start + i];
      sum += val * val;
    }
    energies[b] = Math.sqrt(sum / windowSize);
  }

  // 2. Compute local variance and detect onset peaks
  // Window of ~43 blocks (~1 second history)
  const historySize = 43;
  const onsets = [];
  const minIntervalBlocks = Math.floor((0.25 * sampleRate) / windowSize); // Max ~240 BPM (min 250ms interval)

  let lastOnsetBlock = -minIntervalBlocks;

  for (let b = historySize; b < numBlocks - 1; b++) {
    // Local average energy
    let localAvg = 0;
    for (let h = b - historySize; h < b; h++) {
      localAvg += energies[h];
    }
    localAvg /= historySize;

    // Local variance
    let variance = 0;
    for (let h = b - historySize; h < b; h++) {
      const diff = energies[h] - localAvg;
      variance += diff * diff;
    }
    variance /= historySize;

    // Dynamic threshold constant (typically between 1.3 and 1.6)
    const c = -15 * variance + 1.55;
    const threshold = c * localAvg;

    // Peak detection condition: energy exceeds threshold and is local maximum
    if (
      energies[b] > threshold &&
      energies[b] > energies[b - 1] &&
      energies[b] > energies[b + 1] &&
      b - lastOnsetBlock >= minIntervalBlocks
    ) {
      const timestamp = (b * windowSize) / sampleRate;
      onsets.push(Number(timestamp.toFixed(3)));
      lastOnsetBlock = b;
    }
  }

  // 3. Estimate BPM from onset intervals
  let estimatedBpm = 120;
  if (onsets.length >= 4) {
    const intervals = [];
    for (let i = 1; i < onsets.length; i++) {
      const delta = onsets[i] - onsets[i - 1];
      if (delta >= 0.28 && delta <= 1.2) {
        intervals.push(delta);
      }
    }

    if (intervals.length > 0) {
      // Find median interval
      intervals.sort((a, b) => a - b);
      const medianInterval = intervals[Math.floor(intervals.length / 2)];
      const rawBpm = Math.round(60 / medianInterval);

      // Clamp between 60 and 190 (halve or double if out of standard range)
      if (rawBpm < 60) estimatedBpm = rawBpm * 2;
      else if (rawBpm > 190) estimatedBpm = Math.round(rawBpm / 2);
      else estimatedBpm = rawBpm;
    }
  }

  // 4. Downsampled energy envelope for audio-reactive animation (100 points)
  const envelopePoints = 100;
  const envStep = Math.floor(energies.length / envelopePoints);
  const energyEnvelope = [];

  for (let i = 0; i < envelopePoints; i++) {
    let max = 0;
    for (let j = 0; j < envStep; j++) {
      const val = energies[i * envStep + j] || 0;
      if (val > max) max = val;
    }
    energyEnvelope.push(Number(Math.min(1.0, max * 2).toFixed(3)));
  }

  return {
    bpm: estimatedBpm,
    beats: onsets,
    energyEnvelope,
  };
}
