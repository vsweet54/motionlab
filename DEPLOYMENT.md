# MotionLab — Vercel Deployment & Production Setup Guide

> **Target Platform:** Vercel (Edge Network & Serverless Next.js Hosting)  
> **Framework:** Next.js 16 (App Router)  
> **Client Runtime:** 100% Client-Side In-Browser Processing (Zero Server Dependencies)

---

## 1. Prerequisites for Vercel Deployment

Before deploying MotionLab to Vercel, ensure you have:
1. A GitHub, GitLab, or Bitbucket account with your MotionLab repository pushed.
2. A free or Pro account at [vercel.com](https://vercel.com).
3. The repository working tree in a clean, passing state (`npm test` and `npm run build` must pass).

---

## 2. Deploying via Vercel Web Dashboard (Recommended)

### Step 1: Connect Git Repository
1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New...** &rarr; **Project**.
3. Import your Git repository containing the MotionLab source code.

### Step 2: Configure Project Settings
Vercel automatically detects Next.js. Verify the following parameters:
- **Framework Preset:** `Next.js`
- **Root Directory:** `./` (or directory where `package.json` resides)
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### Step 3: Environment Variables
MotionLab operates **100% offline-first and client-side**.
- **No external API keys or cloud tokens are required.**
- Leave the Environment Variables section blank, or consult `.env.example`.

### Step 4: Click Deploy
1. Click **Deploy**.
2. Vercel will run `npm install`, compile the production build via Webpack, generate static routes (`/` and `/_not-found`), and publish to an edge CDN.
3. Once finished, you will receive a production URL such as: `https://motionlab.vercel.app`.

---

## 3. Deploying via Vercel CLI (Alternative from Terminal)

You can also deploy directly from the command line using the official Vercel CLI:

```bash
# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Login to your Vercel account
vercel login

# 3. Deploy preview build
vercel

# 4. Deploy directly to production
vercel --prod
```

---

## 4. Custom Domain & SSL / HTTPS Configuration

Every Vercel deployment automatically includes a valid Let's Encrypt SSL/TLS certificate with HTTP-to-HTTPS redirect.

### Adding a Custom Domain (e.g., `motionlab.app` or `motion.yourdomain.com`)
1. In the Vercel Dashboard, go to your project &rarr; **Settings** &rarr; **Domains**.
2. Enter your custom domain and click **Add**.
3. Configure your DNS provider:
   - **For Apex Domain (`yourdomain.com`):**
     - Type: `A`
     - Name: `@`
     - Value: `76.76.21.21`
   - **For Subdomain (`motion.yourdomain.com`):**
     - Type: `CNAME`
     - Name: `motion`
     - Value: `cname.vercel-dns.com`
4. Vercel will automatically verify DNS propagation and issue an HTTPS certificate within a few minutes.

---

## 5. Client-Side Browser Considerations on Vercel

MotionLab makes heavy use of browser-native hardware APIs:
- **HTML5 2D Canvas & WebGL:** Uses the client's GPU hardware.
- **Web Audio API (`AudioContext`):** Decodes and synthesizes audio locally in the browser thread.
- **IndexedDB (`idb`):** Stores projects in the user's browser sandbox, never uploading data to Vercel edge functions.
- **Service Worker (`/sw.js`):** Cached with `Cache-Control: public, max-age=0, must-revalidate` via `vercel.json` to ensure immediate updates upon release.

---

## 6. Instant Rollback Procedure

If a deployed update introduces an unexpected browser regression:
1. Open the Vercel Project Dashboard.
2. Go to the **Deployments** tab.
3. Locate the previous working deployment.
4. Click the three dots (`...`) &rarr; **Instant Rollback**.
5. Traffic will instantly route to the previous deployment without requiring a re-build.
