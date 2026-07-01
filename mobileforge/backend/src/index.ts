import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initFirebase } from './services/firebase-admin';
import generateRouter from './routes/generate';
import projectsRouter from './routes/projects';
import snackRouter from './routes/snack';
import assistantRouter from './routes/assistant';
import shareRouter from './routes/share';
import liveRouter from './routes/live';
import feedbackRouter from './routes/feedback';
import betaRouter from './routes/beta';
import backupRouter from './routes/backup';
import imageRouter from './routes/image';
import galleryRouter from './routes/gallery';
import { rateLimit } from './middleware/rateLimit';
import { securityHeaders, csrfGuard, auditLog, isAllowedOrigin } from './middleware/security';
import './services/backup';

const app = express();
const PORT = process.env.PORT || 4000;

// Behind a proxy/load balancer in production — needed for correct client IPs
// (used by the rate limiter).
app.set('trust proxy', 1);

// Init Firebase
initFirebase();

// Security middleware
app.use(securityHeaders);
app.use(auditLog);
app.use(
  cors({
    origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
    credentials: true,
  })
);
app.use(csrfGuard);
app.use(express.json({ limit: '2mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mobileforge-backend', timestamp: new Date().toISOString() });
});

// Routes — rate-limit the expensive AI endpoints
app.use('/api/generate', rateLimit, generateRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/snack', snackRouter);
app.use('/api/assistant', rateLimit, assistantRouter);
app.use('/api/share', shareRouter);
app.use('/api/live', liveRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/beta', betaRouter);
app.use('/api/backup', backupRouter);
app.use('/api/image', imageRouter);
app.use('/api/gallery', galleryRouter);

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
