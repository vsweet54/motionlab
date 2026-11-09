# MotionLab — Production Readiness & Release Checklist

This checklist must be reviewed before and after any public deployment to ensure zero regressions, data integrity, and mobile touch ergonomics.

---

## 📋 Pre-Deployment Verification

- [x] **Project Structure & Cleanliness:** No dead imports, broken files, or scratch logs committed.
- [x] **Secrets & Credentials Audit:** Zero hardcoded API keys, passwords, or credentials present.
- [x] **Automated Tests:** All unit and math tests pass (`npm test` &rarr; 25/25 passed).
- [x] **Security Audit:** Zero known vulnerabilities in dependencies (`npm audit` &rarr; 0 vulnerabilities).
- [x] **SVG XSS Sanitizer:** Verified that `<script>` and inline `javascript:` handlers are stripped from vectors.
- [x] **Procedural Expressions:** Verified that expression evaluations use safe parametric math without `eval()` or `Function()`.
- [x] **Production Build:** Next.js compiles without errors (`npm run build` &rarr; exit code 0).
- [x] **Environment Configuration:** Valid `.env.example` provided explaining client-side environment settings.
- [x] **Vercel Configuration:** `vercel.json` configured with security headers and Service Worker cache rules.
- [x] **PWA Manifest & Icons:** Vector icons (`icon-192.svg`, `icon-512.svg`) and `manifest.json` configured with standalone mode.

---

## 📱 Mobile Android Ergonomics Verification

- [x] **Touch Targets:** All interactive buttons, timeline scrubbers, and modals meet or exceed 44px minimum touch padding.
- [x] **No Horizontal Overflow:** Strict layout boundaries preventing horizontal scrolling outside the timeline canvas.
- [x] **Safe-Area Insets:** Top bar and bottom action bars respect device camera cutouts and navigation bars.
- [x] **Virtual Keyboard Adaptation:** Form inputs scroll into view without clipping dialog actions.
- [x] **Floating Mobile Toolbar:** Quick access to layer alignment, grouping, and keyframing on touch devices.

---

## 🧪 Post-Deployment Functional Smoke Test (18-Step Matrix)

When verifying on a live production URL:

1. [ ] **Main Page Load:** Dashboard loads with hero banner, 60 FPS counter, and recent project cards.
2. [ ] **New Project Creation:** Click **New Project**, select resolution (e.g. 1080p, 60fps), and launch canvas editor.
3. [ ] **Canvas Stage:** Add shapes (Rectangle, Circle, Star) and verify drag, scale, and rotate transforms.
4. [ ] **Text Layer:** Add text layer and adjust font size, color, and alignment.
5. [ ] **Animation & Keyframing:** Add keyframes to Position X and Rotation; verify smooth interpolation on play.
6. [ ] **Timeline Scrubber:** Drag playhead back and forth; verify canvas responds synchronously.
7. [ ] **Bezier Graph Editor:** Open Graph Editor and adjust curve handles; verify velocity updates.
8. [ ] **Motion Path Editor:** Apply an Arc motion path to a layer; verify path tangent orientation.
9. [ ] **Procedural Expressions:** Assign a Sine wave expression; verify continuous oscillation without errors.
10. [ ] **Parametric Effects:** Apply Gaussian Blur and Glow to a layer; adjust intensity sliders.
11. [ ] **Asset Manager:** Import local image/SVG; drag into composition canvas.
12. [ ] **Audio DAW:** Import audio track; play timeline and verify synchronized waveform audio playback.
13. [ ] **Manual Save & Autosave:** Click Save; confirm indicator switches to "Saved" in IndexedDB.
14. [ ] **Project Reopening:** Return to Dashboard; re-open project and verify all layers and keyframes persist.
15. [ ] **Template Library:** Select a pre-built template from Gallery; verify full editing capability.
16. [ ] **Render & Export:** Export single PNG frame and WebM video; confirm file downloads cleanly.
17. [ ] **Code Export:** Open Code Export; test JSON, SVG, HTML+CSS, GSAP, and React component outputs.
18. [ ] **Offline PWA Test:** Toggle browser offline mode; reload page and verify app shell functions offline.

---

## 💾 Data Persistence & User Guidance Notice

- IndexedDB is local to the device and browser.
- Warn users that clearing site data / cookies removes stored projects.
- Encourage users to regularly download `.json` or `.motionlab` project backups from the top bar.
