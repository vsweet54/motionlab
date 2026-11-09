# MotionLab — Professional Motion Graphics & Animation Studio

> **Platform:** Mobile-First Web Application (Native Android, Tablet & Desktop)  
> **Architecture:** 100% Client-Side, Zero External API / Zero Cloud Dependency, Fully Offline-Capable (PWA + IndexedDB v4)

MotionLab is a production-grade, in-browser motion graphics suite designed for mobile touch ergonomics (Android) and desktop workflows. It combines a real-time 60fps Canvas render engine, multi-track keyframe timeline, parametric effects pipeline, professional Web Audio DAW, offline video renderer, template library, and multi-target code exporter.

---

## 🌟 Key Features & Architectural Modules

### 1. Canvas Editor (`components/canvas/`, `store/useEditorStore.js`)
- **Real-Time Render Pipeline:** Hardware-accelerated HTML5 2D Canvas rendering with 60 FPS requestAnimationFrame loop.
- **Transform & Bounding Box System:** Interactive multi-touch selection handles, rotation, translation, scaling, snapping grid, and guide lines.
- **Multi-Layer Support:** Text (custom font upload), Shapes (rect, circle, polygon, star, path), Vector SVG (sanitized), Raster Images (PNG/JPG/WebP), and Video layers.
- **Blending & Hierarchy:** Support for CSS blend modes (`screen`, `multiply`, `overlay`, etc.), opacity, masking, layer parenting, and grouping.

### 2. Animation Engine & Keyframe System (`engine/animation/`, `store/useAnimationStore.js`)
- **Keyframe Interpolation:** Linear, Quadratic, Cubic Bezier, Exponential, Elastic, and Bounce easing algorithms.
- **Property Animators:** Transform (x, y, scaleX, scaleY, rotation, opacity), Path Morphs, Color transitions, and Filter values.
- **Looping & Controls:** Infinite loop, Ping-Pong oscillation, Stagger delays, Animation speed multiplier (0.1x to 4x), reverse playback, and keyframe copy/paste.

### 3. Timeline Editor (`components/timeline/`)
- **Multi-Track Timeline:** Dedicated visual tracks, audio tracks, keyframe diamonds, time ruler, scrubbable playhead, and zoom controls.
- **Precision Trimming:** Frame-accurate in/out point trimming, track locking, soloing, muting, and visibility toggling.
- **Touch-Optimized Ergonomics:** 44px+ minimum touch targets, long-press gestures, snap-to-playhead, and smooth horizontal scrolling.

### 4. Advanced Graph Editor & Curves (`engine/advanced/`, `components/advanced/`)
- **Interactive Bezier Graph Editor:** Visual dual-handle curve editing for velocity and value curves (`evaluateCubicBezier`).
- **Motion Path Trajectory:** Draw spatial curve paths with waypoints, handle controllers, arc presets, and auto-tangent orientation.
- **Procedural Expression Engine:** Safe math expressions (Sine wave, Wobble, Pulse, Orbital motion, Noise simulation, Counter) executed securely without `eval()` or `Function()`.
- **Project Diagnostics:** Real-time health audit checking for NaN values, unlinked parents, memory warnings, and orphan tracks.

### 5. Parametric Effects Engine (`engine/effects/`, `components/effects/`)
- **Filter Pipeline:** Blur, Glow, Drop Shadow, Color Tint, Color Inversion, Grayscale, Sepia, Brightness/Contrast, Hue/Saturation, Vignette, Chromatic Aberration, and Grain.
- **Chained & Keyframeable Effects:** Every effect parameter can be animated over time with dedicated keyframes.

### 6. Asset Manager & Media Library (`components/assets/`, `store/useAssetStore.js`)
- **Universal Local Importer:** PNG, JPG, WebP, SVG, MP4, WebM, MP3, WAV, AAC, OGG, TTF, OTF, WOFF, WOFF2.
- **Safe Vector Sanitization:** Automated stripping of malicious `<script>` tags and inline `javascript:` handlers (`lib/security/sanitizer.js`).
- **Local Storage Engine:** IndexedDB binary blob store (`motionlab_db`) with metadata indexing, thumbnail caching, and duplicate detection.

### 7. Professional Audio Studio (`engine/audio/`, `components/audio/`)
- **Web Audio API DAW:** Multi-track audio mixer, volume/pan gain nodes, mute/solo buses, and master EQ.
- **Waveform Visualizer:** Offline audio decoding producing canvas-rendered amplitude peaks.
- **Timeline Sync:** Frame-synchronized audio playback matching video canvas playhead position.

### 8. Rendering & Export Engine (`engine/export/`, `components/export/`)
- **Browser-Side Offline Rendering:** Frame-by-frame canvas capture using WebCodecs / MediaRecorder / Whammy WebM encoders.
- **Multi-Format Video & Image Export:**
  - Video: WebM (VP8/VP9) with synchronized audio track.
  - Animated: High-efficiency GIF generator with color quantization.
  - Image Sequences: PNG / WebP single frame or frame zip sequence.
- **Device Capability Detection:** Dynamic memory threshold calculation and resolution warnings for mobile devices.

### 9. Multi-Target Code Exporter (`engine/codeExport/`, `components/codeExport/`)
- **JSON Project Bundle:** Universal schema portable across environments.
- **Pure SVG Animation:** Vector SVG with synchronized SMIL `<animate>` tags.
- **Standalone HTML5 & CSS:** Zero-dependency production HTML with CSS `@keyframes`.
- **GSAP JavaScript Timeline:** Modular JS script using standard GreenSock timeline syntax.
- **React Animation Component:** Clean React JSX functional component ready for web applications.

### 10. Project Management, Autosave & Recovery (`components/project/`, `lib/db/`)
- **Dashboard:** Create, open, rename, duplicate, archive, restore, and delete projects.
- **Autosave Engine:** Debounced background autosave to IndexedDB with visual sync status indicators.
- **Crash Recovery:** Automatic detection of unsaved session changes and one-click recovery modal.

### 11. Progressive Web App (PWA) (`public/manifest.json`, `public/sw.js`)
- **Standalone Mode:** Native app-like immersive full-screen experience on Android.
- **Offline Shell Caching:** Service Worker pre-caching static assets, styles, and scripts.
- **A2HS (Add to Home Screen):** Integrated install prompt banner for mobile browsers.

---

## 🛠️ Technology Stack & Environment

- **Framework:** Next.js 16.4.5 (App Router, Webpack engine with SWC WASM bindings)
- **UI & Styling:** React 19, Tailwind CSS 3.4, Lucide React icons
- **State Management:** Zustand with immutable state updates
- **Storage:** Native IndexedDB (`idb` v4 wrapper)
- **Audio & Media:** Web Audio API (`AudioContext`, `AudioBufferSourceNode`)
- **Tested Environment:** Android ARM64 userspace (`$HOME/usr`), Linux, Node.js v26.13.0

---

## 🚀 Getting Started

### 1. Installation
Clone or navigate to the project directory and install dependencies:
```bash
npm install
```

### 2. Running Automated Test Suite
MotionLab includes a zero-dependency automated verification suite covering Bezier solvers, motion paths, expression evaluators, transform math, security sanitizers, and code exporters:
```bash
npm test
```
*Expected Result:* `25 PASSED, 0 FAILED`.

### 3. Development Server
Start the local development server:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser (or port 8080 if running on Android userspace).

### 4. Production Build & Start
Create an optimized production build:
```bash
npm run build
npm start
```

---

## 📱 Mobile Android Ergonomics & Touch Controls

1. **Edge-to-Edge Layout:** Safe-area insets (`env(safe-area-inset-*)`) configured for notched and pinhole screens.
2. **Virtual Keyboard Handling:** Inputs prevent view displacement; modals adjust max-height smoothly.
3. **No Horizontal Overflow:** Strict responsive breakpoints prevent horizontal window clipping.
4. **Touch Target Size:** All action buttons, timeline controls, and sliders adhere to a minimum 44px touch area (WCAG AA).
5. **Contextual Touch Toolbar:** Dedicated mobile toolbar for quick snapping, grouping, layering, and keyframing.

---

## 🔒 Security & Offline Integrity

- **No Remote Telemetry or API Calls:** All processing, storage, rendering, and export happen 100% locally on the client device.
- **Sanitized Vector Import:** Incoming SVG files are scanned and cleansed of `<script>`, `<foreignObject>`, and `javascript:` URIs before rendering.
- **Strict Expression Sandbox:** The procedural expression engine parses and evaluates mathematical ASTs without invoking JavaScript `eval()` or `new Function()`.
- **Project Schema Validation:** Imported `.motionlab` and `.json` projects are strictly validated against schema structures before state hydration.

## 🌐 Production Deployment (Vercel)

MotionLab is pre-configured for seamless zero-config deployment to Vercel:
1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Framework is detected as **Next.js**.
3. Build Command: `npm run build`
4. Output Directory: `.next`
5. Refer to [DEPLOYMENT.md](file:///data/user/0/com.agy/files/motionlab/DEPLOYMENT.md) for custom domain (DNS `CNAME` / `A` record) and SSL instructions.
6. Refer to [PRODUCTION_CHECKLIST.md](file:///data/user/0/com.agy/files/motionlab/PRODUCTION_CHECKLIST.md) for pre- and post-deployment validation steps.

---

## 📲 Installing as Android PWA

MotionLab can be installed as a native-like Progressive Web App directly to your Android Home Screen:
1. Open MotionLab in Google Chrome on your Android device.
2. An **"Install MotionLab"** banner will automatically appear at the bottom of the screen.
3. Tap **Install** (or tap Chrome Menu `⋮` &rarr; **Add to Home screen** / **Install app**).
4. Launch MotionLab directly from your app drawer with a full-screen, standalone canvas view without browser URL bars.

---

## 💾 Local Storage, Data Persistence & Backup

> [!IMPORTANT]
> MotionLab stores your animations, audio tracks, and assets **exclusively in your browser via IndexedDB**. No data is ever uploaded to a remote server.

- **Storage Safety:** Avoid clearing browser cookies or site data for MotionLab, as this will erase local project records.
- **Regular Backups:** Always export a JSON project backup (`Top Bar` &rarr; `Code` &rarr; `JSON Bundle`) or download a `.motionlab` archive to keep a safe copy on your device storage or Google Drive.
- **Private Browsing:** Do not use Incognito / Private mode for long animation sessions, as browsers discard local storage once the tab is closed.

---

## 📄 License
MIT License. Built for high-performance offline motion graphics creation.
