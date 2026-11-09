import gsap from "gsap";

/**
 * Professional MotionLab GSAP Animation Coordinator.
 * Manages clean lifecycle, GSAP tweens, ticker synchronization, and loop/reverse states.
 */
class StudioAnimationCoordinator {
  constructor() {
    this.tween = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 5.0;
    this.fps = 60;
    this.playbackRate = 1.0;
    this.isLoop = false;
    this.isReverse = false;
    this.onTickCallback = null;
    this.onCompleteCallback = null;
  }

  init({ duration = 5.0, fps = 60, onTick = null, onComplete = null }) {
    this.duration = Number(duration) || 5.0;
    this.fps = Number(fps) || 60;
    this.onTickCallback = onTick;
    this.onCompleteCallback = onComplete;
  }

  play({
    fromTime = null,
    duration = null,
    speed = 1.0,
    loop = false,
    reverse = false,
  }) {
    this.kill();

    if (duration !== null) this.duration = duration;
    this.playbackRate = speed;
    this.isLoop = loop;
    this.isReverse = reverse;

    if (fromTime !== null) {
      this.currentTime = fromTime;
    }

    // Determine start and target times
    const start = this.currentTime;
    let target = this.duration;

    if (this.isReverse) {
      target = 0;
      if (start <= 0) this.currentTime = this.duration;
    } else {
      if (start >= this.duration) this.currentTime = 0;
    }

    const remainingDistance = Math.abs(target - this.currentTime);
    const tweenDuration = (remainingDistance / this.playbackRate) || 0.001;

    this.isPlaying = true;

    // Use GSAP to animate a virtual object { time: start } -> { time: target }
    const proxy = { time: this.currentTime };

    this.tween = gsap.to(proxy, {
      time: target,
      duration: tweenDuration,
      ease: "none",
      onUpdate: () => {
        this.currentTime = Number(proxy.time.toFixed(3));
        if (this.onTickCallback) {
          this.onTickCallback(this.currentTime);
        }
      },
      onComplete: () => {
        if (this.isLoop) {
          this.currentTime = this.isReverse ? this.duration : 0;
          this.play({
            fromTime: this.currentTime,
            duration: this.duration,
            speed: this.playbackRate,
            loop: this.isLoop,
            reverse: this.isReverse,
          });
        } else {
          this.isPlaying = false;
          this.currentTime = target;
          if (this.onTickCallback) {
            this.onTickCallback(this.currentTime);
          }
          if (this.onCompleteCallback) {
            this.onCompleteCallback();
          }
        }
      },
    });
  }

  pause() {
    if (this.tween) {
      this.tween.pause();
    }
    this.isPlaying = false;
  }

  stop() {
    this.kill();
    this.currentTime = 0;
    this.isPlaying = false;
    if (this.onTickCallback) {
      this.onTickCallback(0);
    }
  }

  restart() {
    this.stop();
    this.play({
      fromTime: 0,
      duration: this.duration,
      speed: this.playbackRate,
      loop: this.isLoop,
      reverse: this.isReverse,
    });
  }

  seek(time) {
    const wasPlaying = this.isPlaying;
    this.kill();
    this.currentTime = Math.max(0, Math.min(this.duration, Number(time)));
    if (this.onTickCallback) {
      this.onTickCallback(this.currentTime);
    }
    if (wasPlaying) {
      this.play({
        fromTime: this.currentTime,
        duration: this.duration,
        speed: this.playbackRate,
        loop: this.isLoop,
        reverse: this.isReverse,
      });
    }
  }

  setSpeed(speed) {
    this.playbackRate = speed;
    if (this.isPlaying) {
      this.play({
        fromTime: this.currentTime,
        duration: this.duration,
        speed: this.playbackRate,
        loop: this.isLoop,
        reverse: this.isReverse,
      });
    }
  }

  setDuration(d) {
    this.duration = Math.max(0.5, Number(d) || 5.0);
    if (this.currentTime > this.duration) {
      this.seek(this.duration);
    }
  }

  setFps(fps) {
    this.fps = Number(fps) || 60;
  }

  kill() {
    if (this.tween) {
      this.tween.kill();
      this.tween = null;
    }
    this.isPlaying = false;
  }
}

export const studioAnimation = new StudioAnimationCoordinator();
