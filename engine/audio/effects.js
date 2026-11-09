/**
 * Web Audio API Effect Nodes for MotionLab
 * Pure, authentic digital signal processing nodes for track and master audio processing.
 */

/**
 * Builds a 3-Band Equalizer chain (Low Shelf, Peaking Mid, High Shelf)
 * @param {AudioContext} ctx
 * @param {{ low: number, mid: number, high: number }} params
 */
export function createEqualizerNode(ctx, params = { low: 0, mid: 0, high: 0 }) {
  const lowFilter = ctx.createBiquadFilter();
  lowFilter.type = "lowshelf";
  lowFilter.frequency.value = 320;
  lowFilter.gain.value = params.low ?? 0; // -24dB to +24dB

  const midFilter = ctx.createBiquadFilter();
  midFilter.type = "peaking";
  midFilter.frequency.value = 1000;
  midFilter.Q.value = 1.0;
  midFilter.gain.value = params.mid ?? 0;

  const highFilter = ctx.createBiquadFilter();
  highFilter.type = "highshelf";
  highFilter.frequency.value = 3200;
  highFilter.gain.value = params.high ?? 0;

  lowFilter.connect(midFilter);
  midFilter.connect(highFilter);

  return {
    input: lowFilter,
    output: highFilter,
    update: ({ low, mid, high }) => {
      if (low !== undefined) lowFilter.gain.setTargetAtTime(low, ctx.currentTime, 0.05);
      if (mid !== undefined) midFilter.gain.setTargetAtTime(mid, ctx.currentTime, 0.05);
      if (high !== undefined) highFilter.gain.setTargetAtTime(high, ctx.currentTime, 0.05);
    },
  };
}

/**
 * Builds a Dynamics Compressor
 * @param {AudioContext} ctx
 * @param {object} params
 */
export function createCompressorNode(ctx, params = {}) {
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = params.threshold ?? -24; // -60 to 0
  comp.knee.value = params.knee ?? 30;           // 0 to 40
  comp.ratio.value = params.ratio ?? 4;          // 1 to 20
  comp.attack.value = params.attack ?? 0.003;    // 0 to 1
  comp.release.value = params.release ?? 0.25;   // 0 to 1

  return {
    input: comp,
    output: comp,
    update: (p) => {
      if (p.threshold !== undefined) comp.threshold.setTargetAtTime(p.threshold, ctx.currentTime, 0.05);
      if (p.knee !== undefined) comp.knee.setTargetAtTime(p.knee, ctx.currentTime, 0.05);
      if (p.ratio !== undefined) comp.ratio.setTargetAtTime(p.ratio, ctx.currentTime, 0.05);
      if (p.attack !== undefined) comp.attack.setTargetAtTime(p.attack, ctx.currentTime, 0.05);
      if (p.release !== undefined) comp.release.setTargetAtTime(p.release, ctx.currentTime, 0.05);
    },
  };
}

/**
 * Generates an algorithmic synthetic impulse response for Reverb
 */
function generateReverbImpulse(ctx, duration = 2.0, decay = 2.0) {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / length;
    const factor = Math.pow(1 - t, decay);
    left[i] = (Math.random() * 2 - 1) * factor;
    right[i] = (Math.random() * 2 - 1) * factor;
  }
  return impulse;
}

/**
 * Builds a Reverb node with Dry/Wet crossfade
 */
export function createReverbNode(ctx, params = { decay: 2.0, mix: 0.3 }) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  const convolver = ctx.createConvolver();

  convolver.buffer = generateReverbImpulse(ctx, params.decay || 2.0, params.decay || 2.0);

  const mix = Math.max(0, Math.min(1, params.mix ?? 0.3));
  dryGain.gain.value = 1 - mix;
  wetGain.gain.value = mix;

  input.connect(dryGain);
  input.connect(convolver);
  convolver.connect(wetGain);

  dryGain.connect(output);
  wetGain.connect(output);

  return {
    input,
    output,
    update: ({ decay, mix: newMix }) => {
      if (decay !== undefined) {
        convolver.buffer = generateReverbImpulse(ctx, decay, decay);
      }
      if (newMix !== undefined) {
        const m = Math.max(0, Math.min(1, newMix));
        dryGain.gain.setTargetAtTime(1 - m, ctx.currentTime, 0.05);
        wetGain.gain.setTargetAtTime(m, ctx.currentTime, 0.05);
      }
    },
  };
}

/**
 * Builds a Feedback Delay / Echo Node
 */
export function createDelayNode(ctx, params = { delayTime: 0.3, feedback: 0.4, mix: 0.4 }) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  const delay = ctx.createDelay(2.0);
  delay.delayTime.value = params.delayTime ?? 0.3;

  const feedbackGain = ctx.createGain();
  feedbackGain.gain.value = params.feedback ?? 0.4;

  const mix = Math.max(0, Math.min(1, params.mix ?? 0.4));
  dryGain.gain.value = 1 - mix;
  wetGain.gain.value = mix;

  input.connect(dryGain);
  input.connect(delay);

  delay.connect(feedbackGain);
  feedbackGain.connect(delay); // feedback loop
  delay.connect(wetGain);

  dryGain.connect(output);
  wetGain.connect(output);

  return {
    input,
    output,
    update: ({ delayTime, feedback, mix: newMix }) => {
      if (delayTime !== undefined) delay.delayTime.setTargetAtTime(delayTime, ctx.currentTime, 0.05);
      if (feedback !== undefined) feedbackGain.gain.setTargetAtTime(feedback, ctx.currentTime, 0.05);
      if (newMix !== undefined) {
        const m = Math.max(0, Math.min(1, newMix));
        dryGain.gain.setTargetAtTime(1 - m, ctx.currentTime, 0.05);
        wetGain.gain.setTargetAtTime(m, ctx.currentTime, 0.05);
      }
    },
  };
}

/**
 * Generates an S-curve for Distortion / Overdrive
 */
function makeDistortionCurve(amount = 20) {
  const k = typeof amount === "number" ? amount : 20;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;

  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

/**
 * Builds a Distortion / Overdrive Node
 */
export function createDistortionNode(ctx, params = { amount: 20 }) {
  const waveShaper = ctx.createWaveShaper();
  waveShaper.curve = makeDistortionCurve(params.amount || 20);
  waveShaper.oversample = "4x";

  return {
    input: waveShaper,
    output: waveShaper,
    update: ({ amount }) => {
      if (amount !== undefined) {
        waveShaper.curve = makeDistortionCurve(amount);
      }
    },
  };
}

/**
 * Builds a Low-Pass Filter
 */
export function createLowPassNode(ctx, params = { frequency: 2000, Q: 1.0 }) {
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = params.frequency ?? 2000;
  filter.Q.value = params.Q ?? 1.0;

  return {
    input: filter,
    output: filter,
    update: ({ frequency, Q }) => {
      if (frequency !== undefined) filter.frequency.setTargetAtTime(frequency, ctx.currentTime, 0.05);
      if (Q !== undefined) filter.Q.setTargetAtTime(Q, ctx.currentTime, 0.05);
    },
  };
}

/**
 * Builds a High-Pass Filter
 */
export function createHighPassNode(ctx, params = { frequency: 200, Q: 1.0 }) {
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = params.frequency ?? 200;
  filter.Q.value = params.Q ?? 1.0;

  return {
    input: filter,
    output: filter,
    update: ({ frequency, Q }) => {
      if (frequency !== undefined) filter.frequency.setTargetAtTime(frequency, ctx.currentTime, 0.05);
      if (Q !== undefined) filter.Q.setTargetAtTime(Q, ctx.currentTime, 0.05);
    },
  };
}
