# MotionLab — Google Gemini AI Prompt-to-Motion Generator
## Arsitektur, Alur Kerja & Panduan Integrasi Produksi

Fitur **Gemini AI Prompt-to-Motion Generator** memungkinkan pengguna mengubah perintah bahasa alami (seperti *"Buat video motion graphics berdurasi 15 detik tentang cara kerja jantung manusia..."*) menjadi project MotionLab nyata yang lengkap dengan layer vektor, canvas coordinates, dan keyframe timing GSAP.

---

## 1. Arsitektur Sistem

```
+-------------------------------------------------------+
|                 MotionLab Client (Web / PWA)          |
|  - PromptToMotionModal.js (Touch-friendly Android UI) |
|  - Parameter (Duration, Ratio, Style, Language, FPS)  |
+-------------------------------------------------------+
                           |
                     POST /api/ai/generate-motion
                           v
+-------------------------------------------------------+
|             Next.js Server API Route (Node.js)        |
|  - Secret Isolation (GEMINI_API_KEY server-side only) |
|  - Input Validation & Length Bounds                   |
|  - Prompt Engine: MOTIONLAB_SYSTEM_INSTRUCTION        |
|  - Official @google/genai SDK                         |
|  - responseMimeType: "application/json"               |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|               Google Gemini 2.5 Flash                 |
|  - Structured Storyboard Generation                   |
|  - Multi-scene breakdown, layer styling & keyframes   |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|              Schema Validator & Sanitizer             |
|  - engine/ai/schema.js: Numerical clamp & type check  |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|             MotionLab Project Generator               |
|  - engine/ai/projectGenerator.js                      |
|  - Calculates cumulative scene start & layer offsets  |
|  - Maps keyframes to global timeline [0, totalDur]    |
|  - Saves to IndexedDB & Opens in Studio Canvas        |
+-------------------------------------------------------+
```

---

## 2. Fitur Utama

1. **Natural Language to Motion Graphics:**
   - Menerima deskripsi bebas dalam Bahasa Indonesia atau Inggris.
   - Dilengkapi inspirasi prompt cepat (Human Heart, Fintech Growth, Cyberpunk Intro).
2. **Kontrol Parameter Visual:**
   - **Aspect Ratio:** 16:9 (Landscape 1920x1080), 9:16 (Vertical 1080x1920), 1:1 (Square 1080x1080), 4:5 (Portrait 1080x1350).
   - **Durasi:** 5s, 10s, 15s, 30s.
   - **Visual Styles:** 10 gaya kurasi (Modern Corporate, Minimalist, Cinematic, Educational, Infographic, Motion Typography, Abstract, Futuristic Cyber, Social Media, Explainer).
   - **Bahasa:** Indonesia & English.
3. **Storyboard Review & Scene Regeneration:**
   - Review seluruh scene sebelum diterapkan ke Canvas.
   - Tombol regenerasi scene individual jika ingin variasi tertentu.
   - Layer inspector untuk melihat posisi koordinat dan jumlah animasi keyframe.
4. **Studio Canvas & Timeline Integration:**
   - Mengonversi data AI menjadi format native MotionLab (`layers` dan `keyframes`).
   - Layer otomatis di-offset sesuai durasi scene kumulatif.
   - Keyframe dapat diedit di Timeline dan Graph Editor, serta dirender via Export Studio.

---

## 3. Keamanan & Konfigurasi Lingkungan

### Server-Side Isolation & Multi-Key Support
- `GEMINI_API_KEY` disimpan murni di server (tidak ada prefix `NEXT_PUBLIC_`).
- Tidak ada eksposur API key ke browser client.
- Tidak menggunakan fungsi berbahaya seperti `eval()` atau `Function()`.
- Input divalidasi dengan batasan panjang karakter (3 hingga 2000 karakter).
- **Multi-Key Pool & Auto Failover:** Mendukung banyak API key dipisahkan koma. Sistem secara cerdas melakukan rotasi round-robin dan otomatis mencoba API key berikutnya jika terjadi rate limit (HTTP 429 / Quota Exceeded) atau unauthorized (401/403).

### Pengaturan Environment:
Tambahkan ke `.env.local` di server atau Vercel Project Settings:
```env
# Mendukung single key atau multi-key dipisahkan koma:
GEMINI_API_KEY=AIzaSyA1...,AIzaSyB2...,AIzaSyC3...,AIzaSyD4...
GEMINI_MODEL=gemini-2.5-flash
```

---

## 4. Pengujian Otomatis

Seluruh pipeline diuji secara otomatis melalui test suite:
```bash
node lib/tests/runAllTests.mjs
```
Hasil:
- `✓ constructs structured user prompt with technical constraints`
- `✓ validates and sanitizes structured AI storyboard JSON`
- `✓ converts multi-scene AI storyboard into full MotionLab project with global keyframes`
- **Total: 31 PASSED, 0 FAILED**
