# JanVaani AI

> **"Government Services, In Your Voice."**

JanVaani AI is a voice-first citizen co-pilot that helps people discover, check eligibility for, and apply to Indian government schemes — in their own language.

Built as a hackathon prototype for CCU Hackathon, it combines a multilingual voice interface, an AI scheme finder, a rule-based eligibility engine, and a smart document checklist into a single, accessible web app.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎙️ **Multilingual Voice AI** | Speak in Hindi, Hinglish, or English. STT runs locally via Whisper; TTS via gTTS. |
| 🔎 **AI Scheme Finder** | Describe your situation in plain language; the AI surfaces relevant government schemes. |
| 🎯 **Eligibility Checker** | Deterministic, rule-based engine that explains exactly why you qualify or don't. |
| 📄 **Document Checklist** | Know which documents you need for a scheme and track what you already have. |
| ❓ **What Am I Missing?** | Visual tracker of missing documents across all your saved schemes. |
| 👨‍👩‍👧 **Family Benefits Finder** | Discover schemes for every member of your household, not just yourself. |
| ❤️ **Life Events** | Get personalised scheme recommendations based on life milestones (marriage, new baby, job loss, etc.). |
| ⚖️ **Compare Schemes** | Side-by-side comparison of multiple schemes. |
| 🛡️ **Scam & Fraud Check** | Paste a suspicious message or URL and get an AI-powered risk assessment. |
| 📍 **Nearby Help Centers** | Find the closest government offices and service centers. |
| 📊 **Analytics Dashboard** | Track usage and impact at a glance. |

---

## 🏗️ Architecture

```
janvaani-ai/
├── client/          # React 18 + Vite + Tailwind CSS (frontend)
│   └── src/
│       ├── pages/       # Dashboard, SchemeFinder, EligibilityChecker, …
│       ├── components/  # UI, layout, voice, feature components
│       ├── contexts/    # Auth, Language, Voice contexts
│       ├── hooks/       # Custom React hooks
│       ├── services/    # Axios API layer
│       └── data/        # Local scheme / state data
│
└── ai-service/      # Python FastAPI backend
    ├── main.py          # App entry point, CORS, router registration
    ├── routes/          # One file per domain (schemes, voice, docs, …)
    ├── services/        # Business logic (AI, eligibility, documents, …)
    └── data/            # Scheme knowledge base (Hindi + English)
```

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS
- Framer Motion
- React Router DOM v6
- Lucide React

**Backend**
- Python 3.11+ / FastAPI + Uvicorn
- faster-whisper (local STT — no API key needed)
- gTTS (free TTS — no API key needed)
- Groq API for LLM (free tier, ~14 k req/day)
- Optional web search via SearchAPI / SerpAPI / Bing

---

## 🚀 Local Development

### Prerequisites

- Node.js 18+
- Python 3.11+
- pip

### 1. Clone and install

```bash
git clone https://github.com/your-username/janvaani-ai.git
cd janvaani-ai

# Install everything in one shot
npm run install:all
```

### 2. Configure environment variables

```bash
# Backend
cp ai-service/.env.example ai-service/.env

# Frontend (optional for local dev — Vite proxies /api → port 8000)
cp client/.env.example client/.env
```

Open `ai-service/.env` and fill in at minimum:

```env
GROQ_API_KEY=your_groq_api_key_here   # https://console.groq.com — free, no card needed
WHISPER_MODEL=base                     # tiny | base | small | medium
```

### 3. Start both servers

```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

Or run them separately:

```bash
# Terminal 1 — backend
npm run dev:api

# Terminal 2 — frontend
npm run dev:client
```

---

## ☁️ Deployment

### Backend → Render

1. Go to [render.com](https://render.com) → **New → Web Service** → connect your repo.
2. Set the following:
   - **Root Directory**: `ai-service`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Add environment variables:

   | Key | Required | Notes |
   |---|---|---|
   | `GROQ_API_KEY` | Recommended | LLM responses; falls back to rule-based if missing |
   | `WHISPER_MODEL` | No | Default: `base` |
   | `SEARCHAPI_KEY` | No | Web search fallback |
   | `SERPAPI_KEY` | No | Alternative to SearchAPI |
   | `BING_SEARCH_API_KEY` | No | Alternative to SearchAPI |

4. Deploy and copy the service URL (e.g. `https://janvaani-ai-api.onrender.com`).

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo.
2. Vercel will auto-detect the config from `vercel.json` (root already set to `client/dist`).
3. Add one environment variable:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://janvaani-ai-api.onrender.com` |

4. Deploy. React Router SPA rewrites are handled automatically by `vercel.json`.

> **Note:** Render's free tier spins down after 15 min of inactivity. The first request after sleep may be slow. Use a paid plan or keep-alive ping for production use.

---

## 🔌 API Reference

Base path: `/api`

### Schemes
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/schemes` | List / filter all schemes |
| `GET` | `/schemes/:id` | Scheme detail |
| `POST` | `/schemes/search` | AI-powered natural language search |

### Eligibility
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/eligibility/check` | Full eligibility check with breakdown |
| `POST` | `/eligibility/quick-check` | Fast binary check |

### Documents
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/documents/upload` | Upload document (mock OCR) |
| `POST` | `/documents/check` | Document checklist for a scheme |
| `POST` | `/documents/missing` | List missing documents |

### Voice
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/voice/languages` | Supported languages |
| `POST` | `/voice/transcribe` | Speech → Text (local Whisper) |
| `POST` | `/voice/synthesize` | Text → Speech (gTTS) |
| `POST` | `/voice/process` | Full STT → LLM → TTS pipeline |
| `POST` | `/voice/chat` | Text-only multilingual chat |

### Family
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/family/create-profile` | Create family profile |
| `POST` | `/family/analyze` | Get scheme recommendations for whole family |
| `GET` | `/family/profiles` | List saved family profiles |

### Onboarding
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/onboarding/complete` | Save user profile after onboarding |
| `GET` | `/onboarding/profile/:id` | Fetch saved profile |

### Other
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/scam/analyze` | Analyze text for scam signals |
| `POST` | `/scam/check-url` | URL risk assessment |
| `GET` | `/locations/nearby` | Nearby government offices |
| `POST` | `/locations/search` | Search offices by query |
| `GET` | `/analytics/dashboard` | Usage & impact dashboard |
| `GET` | `/health` | Health check |

Full interactive docs available at `/docs` when the server is running.

---

## 🔑 Environment Variables

### `ai-service/.env`

| Variable | Default | Description |
|---|---|---|
| `AI_SERVICE_PORT` | `8000` | Port for the FastAPI server |
| `GROQ_API_KEY` | — | Groq LLM API key (free at console.groq.com) |
| `WHISPER_MODEL` | `base` | Whisper model size: `tiny` / `base` / `small` / `medium` |
| `SEARCHAPI_KEY` | — | SearchAPI.io key (optional web search) |
| `SERPAPI_KEY` | — | SerpAPI key (optional, alternative) |
| `BING_SEARCH_API_KEY` | — | Bing Search API key (optional, alternative) |
| `SEARCH_TIMEOUT_MS` | `6000` | Web search timeout in milliseconds |

### `client/.env`

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `/api` | Backend base URL. Leave as `/api` for local dev (Vite proxy). Set to full URL in production. |

---

## ⚠️ Disclaimer

This is a **hackathon prototype**. All scheme data, eligibility rules, and AI responses are for demonstration purposes only.

- Not an official government portal.
- AI assessments are preliminary — always verify with official sources.
- Mock data is clearly labeled and designed for easy replacement with live, verified data.

---

## 📄 License

MIT
