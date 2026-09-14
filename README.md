# JanVaani AI

> Government services, made easier to access in your own language.

JanVaani AI is a voice-first platform designed to help citizens discover government schemes, understand eligibility, and keep track of required documents without navigating complex forms or confusing portals.

The app combines multilingual voice interaction, AI-assisted scheme matching, a rules-based eligibility engine, and a practical document checklist into one experience that is easier to use for everyday people.

---

## Why this project exists

Many citizens struggle to find the right benefit scheme, understand whether they qualify, and identify which documents they need. JanVaani AI tries to reduce that friction by making the process conversational and simple.

Instead of asking users to read through long government pages, the app lets them speak naturally, ask questions in Hindi, Hinglish, or English, and get relevant recommendations based on their situation.

---

## Features

- Voice-first onboarding and conversation in multiple Indian languages
- AI-powered scheme discovery based on user context and life events
- Rule-based eligibility checks with clear reasons for approval or rejection
- Document checklist and missing-document tracking
- Family and household benefit recommendations
- Side-by-side scheme comparison
- Fraud and scam risk assessment for suspicious messages or links
- Nearby government office and service centre discovery
- Usage analytics dashboard for monitoring engagement and impact

---

## Project structure

```text
janvaani-ai/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── pages/          # Dashboard, scheme finder, eligibility checker, etc.
│       ├── components/     # UI, layouts, voice components, feature cards
│       ├── contexts/       # Auth, language, voice state
│       ├── hooks/          # Custom React hooks
│       ├── services/       # API layer
│       └── data/           # Local schemes and state data
│
├── ai-service/              # Python FastAPI backend
│   ├── main.py              # Application entry point
│   ├── routes/              # Route modules for schemes, voice, docs, etc.
│   ├── services/            # Business logic
│   └── data/                # Scheme and language knowledge base
│
├── twilio-ivr/              # IVR flow for Twilio-based voice calls
├── package.json             # Root scripts
├── render.yaml              # Render deployment config
├── vercel.json              # Vercel frontend config
├── README.md                # Project documentation
└── LICENSE                  # License
```

---

## Tech stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Framer Motion
- Lucide icons

### Backend
- Python 3.11+
- FastAPI
- Uvicorn
- Whisper for local speech-to-text
- gTTS for text-to-speech
- Groq API for LLM-based assistance
- Optional web search integrations

---

## Getting started

### Prerequisites

- Node.js 18+
- Python 3.11+
- pip

### 1. Clone the repository

```bash
git clone https://github.com/your-username/janvaani-ai.git
cd janvaani-ai
```

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Set up environment variables

Create backend and frontend environment files:

```bash
cp ai-service/.env.example ai-service/.env
cp client/.env.example client/.env
```

At minimum, fill in the backend variables:

```env
GROQ_API_KEY=your_groq_api_key_here
WHISPER_MODEL=base
```

You can find the Groq key at: https://console.groq.com

### 4. Run the app locally

```bash
npm run dev
```

This starts both services together.

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

If you prefer, you can run them separately:

```bash
# Terminal 1
npm run dev:api

# Terminal 2
npm run dev:client
```

---

## Deployment

### Backend on Render

1. Go to Render and create a new web service.
2. Connect this repository.
3. Set the root directory to `ai-service`.
4. Use the following settings:
   - Runtime: Python 3
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add the required environment variables:

| Variable | Required | Notes |
| --- | --- | --- |
| `GROQ_API_KEY` | Yes | Used for AI responses and voice-related features |
| `WHISPER_MODEL` | Optional | Local STT fallback model |
| `SEARCHAPI_KEY` | Optional | Search fallback |
| `SERPAPI_KEY` | Optional | Alternative search provider |
| `BING_SEARCH_API_KEY` | Optional | Alternative search provider |

### Frontend on Vercel

1. Import the project into Vercel.
2. Vercel should detect the frontend configuration automatically.
3. Set the environment variable:

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | `https://your-render-service-url` |

> The app appends `/api` automatically if needed.

---

## API overview

Base path: `/api`

### Schemes

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/schemes` | List available schemes |
| `GET` | `/schemes/:id` | Get a single scheme detail |
| `POST` | `/schemes/search` | Search schemes using natural language |

### Eligibility

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/eligibility/check` | Run a detailed eligibility assessment |
| `POST` | `/eligibility/quick-check` | Quick pass/fail evaluation |

### Documents

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/documents/upload` | Upload and process a document |
| `POST` | `/documents/check` | Check document requirements for a scheme |
| `POST` | `/documents/missing` | Show missing documents |

### Voice

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/voice/languages` | Get supported voices and languages |
| `POST` | `/voice/transcribe` | Convert speech to text |
| `POST` | `/voice/synthesize` | Convert text to speech |
| `POST` | `/voice/process` | Run full voice processing pipeline |
| `POST` | `/voice/chat` | Text-only multilingual chat |

### Family and onboarding

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/family/create-profile` | Create a family profile |
| `POST` | `/family/analyze` | Analyze benefit eligibility for the household |
| `GET` | `/family/profiles` | List saved family profiles |
| `POST` | `/onboarding/complete` | Save user onboarding details |
| `GET` | `/onboarding/profile/:id` | Fetch saved profile |

### Other

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/scam/analyze` | Analyze suspicious text |
| `POST` | `/scam/check-url` | Assess scam risk for a URL |
| `GET` | `/locations/nearby` | Find nearby government offices |
| `POST` | `/locations/search` | Search offices by query |
| `GET` | `/analytics/dashboard` | View dashboard insights |
| `GET` | `/health` | Health check |

The API docs are available at `/docs` when the backend is running.

---

## Environment variables

### `ai-service/.env`

| Variable | Default | Description |
| --- | --- | --- |
| `AI_SERVICE_PORT` | `8000` | FastAPI server port |
| `GROQ_API_KEY` | — | Groq API key |
| `WHISPER_MODEL` | `base` | Whisper model size |
| `SEARCHAPI_KEY` | — | Optional web search key |
| `SERPAPI_KEY` | — | Optional alternative search key |
| `BING_SEARCH_API_KEY` | — | Optional alternative search key |
| `SEARCH_TIMEOUT_MS` | `6000` | Search timeout in milliseconds |

### `client/.env`

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | Frontend API base URL |

---

## Disclaimer

This project is intended as a helpful digital assistant and demonstration platform. It is not an official government portal.

- Scheme recommendations and result interpretations should be verified against official sources.
- AI-generated responses may be useful but should not replace official guidance.
- Use the platform as a starting point, not as the final authority on eligibility or entitlement.

---

## License

MIT
