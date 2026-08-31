# ImReq - Frontend Setup Guide

Vue 3 + TypeScript + Vite frontend for the ImReq requirements-analysis app (ISO/IEC/IEEE 29148).

## 🚀 Quick Start

### Prerequisites
- Node.js `^20.19.0` or `>=22.12.0` (see `engines` in `package.json`)
- The [backend API](../backend-imreq/README.md) running (default: `http://localhost:8000`)

---

## 📦 Installation Steps

### 1. Go to the frontend folder
```bash
cd imreq
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
# Windows (PowerShell):
copy .env.example .env
# macOS/Linux:
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:8000/api
```

If this is not set, the app falls back to `http://localhost:8000/api` (see `src/services/api.ts`). Point it to your deployed backend URL in production.

### 4. Run the dev server
```bash
npm run dev
```
Opens on http://localhost:5173 by default.

### 5. Build for production
```bash
npm run build
```
Runs type-checking (`vue-tsc`) then builds with Vite into `dist/`.

### 6. Preview the production build locally
```bash
npm run preview
```

---

## 📁 Project Structure
```
imreq/
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── router/          # Vue Router routes
│   ├── stores/           # Pinia stores
│   ├── services/          # API client (api.ts -> VITE_API_URL)
│   ├── views/              # Page components
│   ├── components/          # Reusable UI components
│   ├── types/                # TypeScript types
│   ├── constants/
│   ├── libs/
│   └── utils/
├── public/
├── index.html
├── vite.config.ts          # '@' alias -> src/, manual chunking (vue, plotly)
├── tailwind.config.js
├── postcss.config.js
└── vercel.json               # Vercel deployment config
```

---

## 🛠️ Tech Stack
- **Vue 3** (Composition API) + **TypeScript**
- **Vite 7** for dev/build
- **Vue Router** + **Pinia** for routing/state
- **Tailwind CSS** for styling
- **Plotly.js** for charts

---

## 🛠️ Troubleshooting

### API requests fail / CORS errors
- Make sure the backend is running and `VITE_API_URL` in `.env` points to it.
- Make sure the backend's `CORS_ORIGINS` env var includes `http://localhost:5173`.

### Type errors on build
```bash
npm run type-check
```

### Port already in use
```bash
npm run dev -- --port 5174
```

### Stale dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Recommended IDE Setup
[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (disable Vetur if installed).

## Recommended Browser Setup
- Chromium-based: [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- Firefox: [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

---

Deployment: configured for **Vercel** (`vercel.json`) — set `VITE_API_URL` as an environment variable in the Vercel project settings.
