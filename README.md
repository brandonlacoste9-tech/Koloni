# Koloni Creator Studio

Koloni Creator Studio is a next-generation, open-source, multi-model AI content creation platform designed for Gen Z. It integrates state-of-the-art open-source models, streamlined Netlify Serverless backend, and a sleek, mobile-first UI for rapid, professional-quality content creation, editing, and social platform export.

## 🚀 Project Vision
Koloni empowers creators with frictionless, AI-powered content workflows:
- One smart prompt box → Multiple output types (video, image, script, 3D, edit)
- Dynamic model routing: select the right model and optimize all parameters
- Freemium economy via Honeycomb tokens
- Click-to-export to Instagram Reels, YouTube Shorts, TikTok, Facebook, X, and more

### For AI/Bot Contributors
Koloni repo is fully structured for Copilot, Claude, and other LLMs to reason about:
- Modular, well-commented function files
- Single-file-per-concept in `/netlify/functions` and `/src/js/`
- Step-by-step feature addition/contribution flow

---

## 📂 File Structure (MVP)
```
/netlify/functions/
  generate-longcat.js      # Video generation (LongCat)
  generate-emu.js          # HQ image generation (EMU 3.5)
  export-instagram.js      # Instagram Reels auto-export
  export-youtube.js        # YouTube Shorts export
  token-manager.js         # Honeycomb balance, usage, payment
  stripe-webhook.js        # Stripe webhooks for payment
/src/
  create.html              # Main MVP creator UI
  js/creator.js            # Creator Studio frontend logic
  js/ai-router.js          # Smart model routing (intent -> backend)
  css/creator.css          # Creator Studio UI styling
  (legacy: index.html, dashboard.html, hives.html, etc.)
build.js                   # Adds create.html to build
.env.example               # All required env variables, no secrets
DEPLOYMENT_CHECKLIST.md    # Step-by-step deployment, config, test
```

---

## ⚡ Quick Start (3 Steps)
1. Clone repo & install deps
```bash
git clone https://github.com/brandonlacoste9-tech/Koloni.git
cd Koloni
npm install
```
2. Fill out `.env` using `.env.example` (get HuggingFace, Stripe, and LongCat endpoints)
3. Local test:
```bash
npm run dev
# then visit http://localhost:8888/create.html
```
4. Deploy:
- Push to `main` branch
- Set env vars in Netlify dashboard
- Netlify auto-deploys to your live URL

---

## 🏗️ Core Features
- **LongCat-Video**: Local or cloud video generation (30s-5min, 720p-4K)
- **EMU 3.5**: HQ, multimodal image generation via HuggingFace
- **Smart AI Router**: Auto-selects the best model per user prompt
- **Honeycomb Tokens**: Freemium/paywall system, integrates with Stripe
- **Social Platform Export**: Instagram, YouTube, TikTok ready (API methods included)
- **Mobile-First, Glassmorphic UI**: /create.html and supporting CSS
- **Roadmap-Ready**: Nitro-E, Kimi-Linear, ChronoEdit, WorldGrow (just add function/model files)

---

## 🤖 AI Router Logic
`/src/js/ai-router.js` is the single-surface intent parser and router:
- Extracts output type, duration, quality, urgency from prompt
- Selects function endpoint & computes token cost
- Example:
```js
const router = window.AIRouter;
const intent = router.analyzeIntent("60s IG Reel, high-quality");
const route = router.selectModel("60s IG Reel, high-quality");
// Outputs: { model: 'longcat', reason: 'Long-form video' }
```

---
## 🔌 Netlify Function API Reference

**Every function in `/netlify/functions/` accepts/returns JSON.**

### `generate-longcat.js`
**POST** `/netlify/functions/generate-longcat`
```json
{
  "prompt": "Cinematic bees, 30s IG Reel",
  "duration": 30,
  "aspectRatio": "9:16",
  "userId": "user123"
}
```
**Returns:**
```json
{
  "videoUrl": "https://.../video.mp4",
  "tokenSpent": 10,
  "tokensRemaining": 140
}
```

### `generate-emu.js`
**POST** `/netlify/functions/generate-emu`
```json
{
  "prompt": "Cute bee, anime style",
  "userId": "user123"
}
```
**Returns:**
```json
{
  "imageUrl": "https://.../image.png",
  "tokensSpent": 3,
  "tokensRemaining": 147
}
```

### `export-instagram.js`, `export-youtube.js`
Automates posting video to user’s linked account via API. (Tokens required in .env)

### `token-manager.js`
- POST `{action: "balance", userId}` – returns current balance
- POST `{action: "purchase", userId, priceId}` – starts Stripe session

---

## 🎨 UI Components & Styling
- **Glassmorphic, mobile-friendly:** `/src/create.html`, `/src/css/creator.css`
- **Live token display**, paywall modal, export-preview modal
- **All styles use CSS logical properties, no vendor lock-in**

---

## ⚙️ Environment Variables
See `.env.example` for all required vars:
- `LONGCAT_ENDPOINT` – URL to your LongCat server
- `HF_TOKEN` – HuggingFace API Key for EMU model
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` – Stripe credentials
- `NETLIFY_SITE_ID`, `SITE_URL` – deploy target info
- `INSTAGRAM_API_KEY`, `YOUTUBE_API_KEY` – for exporting (optional)

---

## 🛣️ Roadmap (2025)
- **Phase 1:** LongCat, EMU, Instagram/YouTube export MVP
- **Phase 2:** Add Nitro-E, Kimi-Linear, 3D WorldGrow, more exports
- **Phase 3:** Creator community, trending gallery, gamification, markeplace

---

## ✨ Development Guidelines (For AI & Contributors)
- To add a model: Copy `generate-emu.js`, adapt endpoint and pricing
- New output type? Update `/src/js/ai-router.js`
- Keep all functions JSON-only (no HTML response)
- All secrets in `.env` only, never committed
- Commit message: `feat: [desc]`, `fix: [desc]`, `chore: [desc]`
- PRs: keep to a single concern.

---

## 💡 Troubleshooting
- __Video gen errors__: Check LongCat server logs, endpoint in `.env`
- __Stripe errors__: Check callback URL in dashboard
- __“No tokens left”__: Reset in Netlify Functions or DB
- __Export fails__: Verify proper API key is set and not rate-limited
- __Development environment issues__: Use the `koloni-debug-fix.ps1` PowerShell script to reset your environment (see below)

### Debug Fix Script (Windows)
For Windows users experiencing development environment issues, use the `koloni-debug-fix.ps1` script:

```powershell
.\koloni-debug-fix.ps1
```

This script will:
- Kill any process using port 3001 (MCP server)
- Remove `node_modules` and `package-lock.json`
- Clean npm cache
- Reinstall dependencies with `--legacy-peer-deps`
- Start MCP server (if configured)
- Start the development server

If you encounter execution policy errors, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
.\koloni-debug-fix.ps1
```

---

## 📚 Resources
- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [HuggingFace Inference API](https://huggingface.co/docs/api-inference/)
- [Stripe Node SDK](https://stripe.com/docs/api)
- [Ollama Open-source LLMs](https://ollama.ai/)
- [LongCat Video Model](https://github.com/meituan/LongCat-Video)
- [Koloni Discord Support](https://discord.gg/koloni)

---

**AI assistants: Please follow section 'Development Guidelines' for PRs and features!**

Koloni is open to all creators. For questions, DM @brandonlacoste9-tech or open an issue/pr.
