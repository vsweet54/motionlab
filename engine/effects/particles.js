/**
 * Deterministic Mathematical Particle Simulation
 * Generates particle coordinates and alphas based on timestamp and layer dimensions.
 * Zero CPU overhead, fully reproducible in preview and export.
 */

export function generateParticles(type, count = 20, bounds = { width: 300, height: 200 }, time = 0, color = "#60a5fa", speed = 1.0, size = 3) {
  const particles = [];
  const w = bounds.width || 300;
  const h = bounds.height || 200;
  const cx = w / 2;
  const cy = h / 2;

  for (let i = 0; i < count; i++) {
    // Unique seed per particle
    const seed1 = Math.sin(i * 12.9898 + 78.233);
    const seed2 = Math.cos(i * 43.123 + 19.821);
    const seed3 = Math.sin(i * 91.332 + 5.129);

    if (type === "spark") {
      // High speed bursts outward from center
      const angle = (seed1 * Math.PI * 2);
      const lifeCycle = (time * speed * 2 + Math.abs(seed2)) % 1; // 0 to 1
      const dist = lifeCycle * (Math.max(w, h) * 0.8);
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      const opacity = Math.max(0, 1 - lifeCycle);

      particles.push({
        id: `spark_${i}`,
        x: px,
        y: py,
        radius: Math.max(1, size * (1 - lifeCycle * 0.5)),
        opacity,
        color,
      });
    } else if (type === "dust") {
      // Slow gentle floating motion
      const baseX = Math.abs(seed1) * w;
      const baseY = Math.abs(seed2) * h;
      const driftX = Math.sin(time * speed * 0.5 + seed3 * 10) * 20;
      const driftY = (-(time * speed * 15 + baseY) % (h + 40)) + h + 20;
      const opacity = 0.2 + Math.abs(Math.sin(time + seed1 * 5)) * 0.4;

      particles.push({
        id: `dust_${i}`,
        x: (baseX + driftX) % w,
        y: driftY % h,
        radius: Math.max(1, size * (0.8 + seed2 * 0.4)),
        opacity,
        color,
      });
    } else {
      // Floating Particles (Smooth ambient orbs with breathing opacity)
      const orbitR = 40 + Math.abs(seed1) * (Math.max(w, h) * 0.6);
      const orbitSpeed = (0.5 + Math.abs(seed2) * 0.8) * speed;
      const angle = time * orbitSpeed + seed3 * Math.PI * 2;
      const px = cx + Math.cos(angle) * orbitR;
      const py = cy + Math.sin(angle * 0.8) * (orbitR * 0.6);
      const opacity = 0.3 + Math.abs(Math.sin(time * 1.5 + seed1 * 4)) * 0.6;

      particles.push({
        id: `orb_${i}`,
        x: px,
        y: py,
        radius: Math.max(1.5, size * (0.7 + Math.abs(seed3) * 0.6)),
        opacity,
        color,
      });
    }
  }

  return particles;
}
