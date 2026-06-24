import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { createBackup, listBackups, restoreBackup, getBackupData } from '../services/backup';

const router = Router();

const FALLBACK_TOKEN = randomBytes(24).toString('base64url');
function adminToken(): string {
  const t = process.env.ADMIN_TOKEN || FALLBACK_TOKEN;
  if (!process.env.ADMIN_TOKEN) {
    console.log(`[backup] ADMIN_TOKEN not set — using auto-generated token: ${t}`);
  }
  return t;
}

function checkAuth(req: Request, res: Response): boolean {
  const given = req.query.token || req.headers['x-admin-token'];
  if (given !== adminToken()) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// GET /api/backup — list all backups
router.get('/', (req: Request, res: Response) => {
  if (!checkAuth(req, res)) return;
  return res.json({ backups: listBackups() });
});

// POST /api/backup — create a new backup
router.post('/', (req: Request, res: Response) => {
  if (!checkAuth(req, res)) return;
  try {
    const result = createBackup();
    return res.json({ ok: true, ...result });
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
});

// POST /api/backup/restore — restore from a backup file
router.post('/restore', (req: Request, res: Response) => {
  if (!checkAuth(req, res)) return;
  const { filename } = req.body || {};
  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'filename is required' });
  }
  try {
    const result = restoreBackup(filename);
    return res.json({ ok: true, ...result, note: 'Restart the server to load restored data into memory.' });
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
});

// GET /api/backup/download/:filename — download a backup file
router.get('/download/:filename', (req: Request, res: Response) => {
  if (!checkAuth(req, res)) return;
  try {
    const data = getBackupData(req.params.filename);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
    return res.send(data);
  } catch (e) {
    return res.status(404).json({ error: (e as Error).message });
  }
});

export default router;
