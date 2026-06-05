import { Router, Request, Response } from 'express';
import { generateMobileApp, streamGenerateMobileApp } from '../services/ai';
import { createExpoSnack } from '../services/expoSnack';
import { getFirestore, verifyIdToken } from '../services/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /api/generate — generate app with Claude + create Expo Snack
router.post('/', async (req: Request, res: Response) => {
  const { projectId, prompt, conversationHistory = [] } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    // Generate app code with Claude
    const generated = await generateMobileApp(prompt, conversationHistory);

    // Create Expo Snack
    let snackResult = { snackId: '', embedUrl: '', shareUrl: '' };
    try {
      snackResult = await createExpoSnack(generated.files, generated.appName);
    } catch (snackErr) {
      console.error('Expo Snack creation failed:', snackErr);
    }

    // Save to Firestore if projectId provided and Firebase is available
    if (projectId) {
      try {
        const db = getFirestore();
        const msgId = uuidv4();
        await db
          .collection('conversations')
          .doc(projectId)
          .collection('messages')
          .doc(msgId)
          .set({
            role: 'assistant',
            content: generated.hebrewSummary,
            files: generated.files,
            hebrewSummary: generated.hebrewSummary,
            snackId: snackResult.snackId,
            appName: generated.appName,
            colorScheme: generated.colorScheme,
            features: generated.features,
            timestamp: new Date().toISOString(),
          });

        // Update project
        await db.collection('projects').doc(projectId).update({
          lastSnackId: snackResult.snackId,
          colorScheme: generated.colorScheme,
          features: generated.features,
          updatedAt: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.error('Firestore save failed:', dbErr);
      }
    }

    return res.json({
      ...generated,
      ...snackResult,
    });
  } catch (err) {
    console.error('Generate error:', err);
    return res.status(500).json({
      error: 'Generation failed',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// POST /api/generate/stream — streaming response
router.post('/stream', async (req: Request, res: Response) => {
  const { prompt, conversationHistory = [] } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    let fullText = '';

    for await (const chunk of streamGenerateMobileApp(prompt, conversationHistory)) {
      fullText += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    // Parse the accumulated text
    try {
      const cleaned = fullText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned);

      // Create Expo Snack
      let snackResult = { snackId: '', embedUrl: '', shareUrl: '' };
      try {
        snackResult = await createExpoSnack(parsed.files, parsed.appName);
      } catch (snackErr) {
        console.error('Expo Snack creation failed:', snackErr);
      }

      res.write(`data: ${JSON.stringify({ done: true, result: { ...parsed, ...snackResult } })}\n\n`);
    } catch {
      res.write(
        `data: ${JSON.stringify({
          done: true,
          result: {
            appName: 'Generated App',
            hebrewSummary: 'האפליקציה נוצרה',
            files: { 'App.tsx': fullText },
            features: [],
            colorScheme: { primary: '#6C3AE8', background: '#0A0A0F', text: '#E8E8F0' },
            snackId: '',
            embedUrl: '',
            shareUrl: '',
          },
        })}\n\n`
      );
    }

    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
    res.end();
  }
});

// POST /api/generate/vision — generate from screenshot or sketch image
router.post('/vision', async (req: Request, res: Response) => {
  const { image, mimeType = 'image/jpeg', prompt, projectId, isSketch = false } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'image (base64) is required' });
  }

  // Sanity-check size (~4 MB base64 limit)
  if (image.length > 5_500_000) {
    return res.status(413).json({ error: 'Image too large. Please use an image under 4 MB.' });
  }

  const validMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validMimes.includes(mimeType)) {
    return res.status(400).json({ error: `Unsupported mimeType. Use: ${validMimes.join(', ')}` });
  }

  // Vision requires a multimodal model — not available on the current free tier (Groq/Llama)
  return res.status(503).json({
    error: 'VISION_NOT_SUPPORTED',
    message: "פיצ'ר Vision (צילום מסך / סקיצה) דורש שדרוג לתוכנית Premium עם מודל multimodal.",
  });
});

export default router;
