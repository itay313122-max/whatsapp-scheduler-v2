import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initFirebase } from './services/firebase-admin';
import generateRouter from './routes/generate';
import projectsRouter from './routes/projects';
import snackRouter from './routes/snack';
import assistantRouter from './routes/assistant';
import shareRouter from './routes/share';

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
app.use('/api/share', shareRouter);

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
