import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import schemeRoutes from './routes/schemeRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import eligibilityRoutes from './routes/eligibilityRoutes.js';
import familyRoutes from './routes/familyRoutes.js';
import scamRoutes from './routes/scamRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'JanVaani AI API is running' });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'JanVaani AI server is running', health: '/api/health' });
});

// API Routes
app.use('/api/schemes', schemeRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/eligibility', eligibilityRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/scam', scamRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/onboarding', onboardingRoutes);

// Catch-all for unknown routes
app.use(notFound);

// Centralized error handler (must be last)
app.use(errorHandler);

// Connect to MongoDB only if a URI is provided. The app runs fully on
// in-memory mock data, so this is optional for the demo.
const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
  import('mongoose')
    .then((mongoose) =>
      mongoose
        .connect(MONGO_URI)
        .then(() => console.log('Connected to MongoDB'))
        .catch((e) => console.warn('MongoDB connection failed:', e.message))
    )
    .catch(() => {});
}

app.listen(PORT, () => {
  console.log(`JanVaani AI Server running on port ${PORT}`);
});
