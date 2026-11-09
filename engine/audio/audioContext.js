/**
 * Audio Context Manager for MotionLab
 * Manages singleton AudioContext, mobile touch-unlocking, and decoded AudioBuffer caching.
 */

class AudioContextManager {
  constructor() {
    this.ctx = null;
    this.isUnlocked = false;
    this.bufferCache = new Map(); // key -> AudioBuffer
    this.reversedBufferCache = new Map(); // key -> AudioBuffer
    this.initListeners();
  }

  /**
   * Retrieves or initializes the shared AudioContext
   */
  getContext() {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /**
   * Registers global user gesture listeners to unlock AudioContext on mobile Android browsers
   */
  initListeners() {
    if (typeof window === "undefined") return;

    const unlock = () => {
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().then(() => {
          this.isUnlocked = true;
        }).catch(() => {});
      } else if (this.ctx && this.ctx.state === "running") {
        this.isUnlocked = true;
      }
    };

    window.addEventListener("touchstart", unlock, { passive: true, once: false });
    window.addEventListener("touchend", unlock, { passive: true, once: false });
    window.addEventListener("click", unlock, { passive: true, once: false });
    window.addEventListener("keydown", unlock, { passive: true, once: false });
  }

  /**
   * Decodes an audio Blob or ArrayBuffer into an AudioBuffer with caching
   * @param {string} cacheKey - Unique key (e.g. assetId or src URL)
   * @param {Blob|ArrayBuffer} source
   * @returns {Promise<AudioBuffer>}
   */
  async decodeAudio(cacheKey, source) {
    if (this.bufferCache.has(cacheKey)) {
      return this.bufferCache.get(cacheKey);
    }

    const ctx = this.getContext();
    if (!ctx) throw new Error("Web Audio API not supported in this environment");

    let arrayBuffer;
    if (source instanceof Blob) {
      arrayBuffer = await source.arrayBuffer();
    } else if (source instanceof ArrayBuffer) {
      arrayBuffer = source;
    } else if (typeof source === "string") {
      // Fetch URL
      const res = await fetch(source);
      arrayBuffer = await res.arrayBuffer();
    } else {
      throw new Error("Invalid audio source provided for decoding");
    }

    // AudioContext.decodeAudioData detaches the arrayBuffer, so copy it if needed
    const bufferCopy = arrayBuffer.slice(0);
    const decodedBuffer = await ctx.decodeAudioData(bufferCopy);

    this.bufferCache.set(cacheKey, decodedBuffer);
    return decodedBuffer;
  }

  /**
   * Returns a reversed version of the cached AudioBuffer
   * @param {string} cacheKey
   * @param {Blob|ArrayBuffer} source
   * @returns {Promise<AudioBuffer>}
   */
  async getReversedAudio(cacheKey, source) {
    if (this.reversedBufferCache.has(cacheKey)) {
      return this.reversedBufferCache.get(cacheKey);
    }

    const original = await this.decodeAudio(cacheKey, source);
    const ctx = this.getContext();

    // Create a new buffer with same specs
    const reversed = ctx.createBuffer(
      original.numberOfChannels,
      original.length,
      original.sampleRate
    );

    for (let c = 0; c < original.numberOfChannels; c++) {
      const origData = original.getChannelData(c);
      const revData = reversed.getChannelData(c);
      for (let i = 0, j = original.length - 1; i < original.length; i++, j--) {
        revData[i] = origData[j];
      }
    }

    this.reversedBufferCache.set(cacheKey, reversed);
    return reversed;
  }

  /**
   * Clears the decoded buffer cache
   */
  clearCache() {
    this.bufferCache.clear();
    this.reversedBufferCache.clear();
  }
}

export const audioContextManager = new AudioContextManager();

export async function getDecodedAudioBuffer(urlOrBlob) {
  if (!urlOrBlob) return null;
  const key = typeof urlOrBlob === "string" ? urlOrBlob : (urlOrBlob.name || "blob-audio");
  return audioContextManager.decodeAudio(key, urlOrBlob);
}
