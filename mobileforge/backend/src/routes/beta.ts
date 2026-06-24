import { Router, Request, Response } from 'express';

const router = Router();

// Closed-beta access keys. Set BETA_KEYS in the environment as a comma-separated
// list (the 10 invite codes you send to friends). If unset, the gate is OPEN —
// no key required — so local/dev usage isn't blocked.
function validKeys(): Set<string> {
  const raw = process.env.BETA_KEYS || '';
  return new Set(raw.split(',').map(k => k.trim().toUpperCase()).filter(Boolean));
}

// GET /api/beta/status — is the gate even enabled? (frontend asks on load)
router.get('/status', (_req: Request, res: Response) => {
  res.json({ gateEnabled: validKeys().size > 0 });
});

// POST /api/beta/verify { key } — check an invite key.
router.post('/verify', (req: Request, res: Response) => {
  const keys = validKeys();
  if (keys.size === 0) return res.json({ valid: true, open: true }); // gate off
  const key = String((req.body && req.body.key) || '').trim().toUpperCase();
  return res.json({ valid: keys.has(key) });
});

export default router;
