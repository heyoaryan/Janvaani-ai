# JanVaani AI

**"Government Services, In Your Voice."**

A voice-first AI citizen co-pilot for government services. Built for CCU Hackathon.

## 🚀 Quick Start

```bash
# Install all dependencies
npm run install:all

# Start both backend and frontend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001

## 🏗️ Project Structure

```
janvaani-ai/
├── client/                 # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts (Auth, Voice)
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API service layer
│   │   ├── data/           # Mock data and schemes
│   │   └── utils/          # Utility functions
│   └── package.json
├── server/                 # Node.js + Express backend
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic services
│   ├── data/               # Mock data and knowledge base
│   ├── models/             # Data models
│   └── package.json
└── package.json            # Root package with scripts
```

## ✨ Features

### P0 - Core Features
- 🎙️ **Regional Language Voice AI** - Speak in Hindi/Hinglish to interact
- 🔎 **AI Scheme Finder** - Discover government schemes by describing your needs
- 🎯 **Eligibility Checker** - Deterministic rule-based eligibility engine
- 📄 **Smart Document Checker** - Upload and analyze documents
- ❓ **What Am I Missing?** - Visual missing document tracker
- 🤖 **AI Application Co-Pilot** - Step-by-step guided application workflow

### P1 - High Value
- 👨‍👩‍👧 **Family Benefits Finder** - Discover schemes for entire household
- ❤️ **Life Events** - Get recommendations based on life milestones
- 🛡️ **Scam & Fraud Help** - AI-powered scam risk assessment

### P2
- 📍 **Nearby Government Help** - Find offices and help centers
- 📊 **Analytics Dashboard** - Track impact and usage

## 🛠️ Tech Stack

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- Framer Motion
- Lucide React
- React Router DOM

**Backend:**
- Node.js + Express
- Modular service architecture
- Mock AI services with integration points for real APIs

**AI Architecture:**
- Mock LLM for intent detection and entity extraction
- Deterministic rule-based eligibility engine
- Mock speech-to-text and text-to-speech
- Mock OCR/document analysis

## 📋 Demo Flow

1. **User opens JanVaani AI** → Dashboard with voice button
2. **User speaks**: "Main college student hoon, mere family ki income kam hai. Mujhe education ke liye government se kya help mil sakti hai?"
3. **System understands** → Extracts intent, entities, user profile
4. **AI Scheme Finder** → Shows relevant schemes (PM Scholarship, PMEGP, etc.)
5. **User selects scheme** → Detailed view with eligibility info
6. **Eligibility Checker** → Shows 92% match with criteria breakdown
7. **Document Checker** → Upload documents, basic analysis
8. **"What Am I Missing?"** → Visual tracker showing missing docs
9. **Application Co-Pilot** → Step-by-step guided workflow
10. **Family Benefits** → Discover schemes for all family members

## 🎯 Key Differentiators

1. **Voice-first interaction** in regional languages
2. **Deterministic eligibility engine** - explainable and reliable
3. **"What Am I Missing?"** - Unique document intelligence
4. **Family Benefits Finder** - Household-level analysis
5. **AI Application Co-Pilot** - Guided, not automated
6. **Scam Protection** - Safety-first design

## ⚠️ Important Notes

- This is a **hackathon prototype** with mock data and services
- Not an official government portal
- All recommendations are AI-based preliminary assessments
- Real API integrations are clearly marked with TODO comments
- Demo data is labeled and designed for easy replacement with verified sources

## 📱 Running the Application

### Development Mode
```bash
# Terminal 1 - Backend
cd server
node server.js

# Terminal 2 - Frontend
cd client
npm run dev
```

### Production Build
```bash
cd client
npm run build
```

## ☁️ GitHub and Vercel Deployment

The repository is ready to connect to GitHub and deploy the React frontend on Vercel.

### Push to GitHub

```bash
git add .
git commit -m "Prepare JanVaani AI for deployment"
git push -u origin main
```

### Deploy the backend on Render

1. In Render, choose **New → Blueprint** and select this repository. The included `render.yaml` creates the Express web service from `server/`.
2. Add `SARVAM_API_KEY` for real voice/AI responses, or leave it empty to use the built-in mock responses.
3. Add `MONGO_URI` only if persistent MongoDB data is needed. The demo works without it.
4. Copy the deployed Render URL and check `https://your-api.example.com/api/health`.

### Deploy the frontend on Vercel

1. Import this GitHub repository into Vercel.
2. Keep the repository root as the project root. The included `vercel.json` builds `client` and serves `client/dist`.
3. Add `VITE_API_URL` in Vercel Environment Variables, pointing to the deployed Render backend URL including `/api`, for example `https://janvaani-ai-api.onrender.com/api`.
4. Deploy. Vercel will rewrite React Router routes to `index.html`.

The frontend and backend are separate deployments: Vercel serves `client/`, while Render runs the Express API in `server/`.

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/schemes` | GET | List all schemes |
| `/api/schemes/search` | POST | AI-powered scheme search |
| `/api/schemes/:id` | GET | Get scheme details |
| `/api/voice/transcribe` | POST | Speech to text (mock) |
| `/api/voice/synthesize` | POST | Text to speech (mock) |
| `/api/voice/process` | POST | Process voice input |
| `/api/documents/upload` | POST | Upload document |
| `/api/documents/check` | POST | Check document against scheme |
| `/api/documents/missing` | POST | Get missing documents |
| `/api/eligibility/check` | POST | Check eligibility |
| `/api/family/create-profile` | POST | Create family profile |
| `/api/family/analyze` | GET | Analyze family benefits |
| `/api/scam/analyze` | POST | Analyze text for scams |
| `/api/locations/nearby` | GET | Get nearby offices |
| `/api/analytics/dashboard` | GET | Get analytics data |

## 🎨 Design System

- **Primary**: Indigo (#4F46E5)
- **Background**: Gray-50 (#F8FAFC)
- **Cards**: White with rounded-2xl
- **Typography**: Inter font family
- **Icons**: Lucide React
- **Animations**: Framer Motion

## 📊 Hackathon Evaluation Alignment

| Criteria | Score | How |
|----------|-------|-----|
| Innovation | 25% | Voice-first regional language AI, family benefits, document intelligence |
| Impact | 25% | Simplifies access to government services for non-English speakers |
| Feasibility | 20% | Clear integration points, modular architecture, mock services |
| Prototype Quality | 20% | Polished UI, working demo, all P0 features functional |
| Presentation | 10% | Clear demo flow, "Citizen Journey" visualization |

## 👥 Team

Built with ❤️ for CCU Hackathon

## 📄 License

MIT
