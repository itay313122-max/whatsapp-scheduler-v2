import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initFirebase } from './services/firebase-admin';
import generateRouter from './routes/generate';
import projectsRouter from './routes/projects';
import snackRouter from './routes/snack';
import assistantRouter from './routes/assistant';

// ── dotenv debug (temporary) ─────────────────────────────────────────────────
const EXPECTED_KEYS = [
  'PORT', 'FRONTEND_URL', 'GROQ_API_KEY',
  'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY',
];
console.log('\n=== dotenv debug ===');
console.log('cwd:', process.cwd());
for (const key of EXPECTED_KEYS) {
  const val = process.env[key];
  if (!val) {
    console.log(`❌ ${key}: MISSING`);
  } else if (val.startsWith('__PASTE')) {
    console.log(`⚠️  ${key}: still a placeholder`);
  } else if (key === 'FIREBASE_PRIVATE_KEY') {
    const hasRealNewlines = val.includes('\n') && !val.includes('\\n');
    const hasEscaped     = val.includes('\\n');
    console.log(`✅ ${key}: loaded (${val.length} chars) | real newlines: ${hasRealNewlines} | escaped \\n: ${hasEscaped}`);
  } else {
    console.log(`✅ ${key}: loaded (${val.length} chars)`);
  }
}
console.log('====================\n');
// ─────────────────────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 4000;

// Init Firebase
initFirebase();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mobileforge-backend', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/generate', generateRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/snack', snackRouter);
app.use('/api/assistant', assistantRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`MobileForge backend running on http://localhost:${PORT}`);
});

export default app;
