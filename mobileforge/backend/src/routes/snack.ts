import { Router, Request, Response } from 'express';
import { createExpoSnack } from '../services/expoSnack';

const router = Router();

// POST /api/snack — create Expo Snack from files
router.post('/', async (req: Request, res: Response) => {
  const { files, name } = req.body;

  if (!files || typeof files !== 'object') {
    return res.status(400).json({ error: 'files object is required' });
  }

  try {
    const result = await createExpoSnack(files, name);
    return res.json(result);
  } catch (err) {
    console.error('Snack creation error:', err);
    return res.status(500).json({
      error: 'Failed to create Expo Snack',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
