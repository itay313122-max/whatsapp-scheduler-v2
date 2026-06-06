import { Router, Request, Response } from 'express';
import { generateMobileApp, streamGenerateMobileApp } from '../services/ai';
import { createExpoSnack } from '../services/expoSnack';
import { getFirestore } from '../services/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/** Extract the app code from the parsed files and normalise newlines. */
function extractAppCode(files: Record<string, string>): string {
  const code = files['App.tsx'] ?? files['App.js'] ?? '';
  // JSON.parse already converts \n → real newlines, but if the fallback
  // path put raw JSON in there we detect and reject it.
  if (code.trimStart().startsWith('{') && code.includes('"appName"')) {
    console.warn('[Generate] App code looks like raw JSON — Groq parse likely failed');
    return '';
  }
  return code;
}

// POST /api/generate — generate app with Groq + create Expo Snack
router.post('/', async (req: Request, res: Response) => {
  const { projectId, prompt, conversationHistory = [] } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    // Generate app code with Groq
    const generated = await generateMobileApp(prompt, conversationHistory);

    // Extract only the app code (App.tsx → App.js for Expo Snack)
    const appCode = extractAppCode(generated.files);

    if (!appCode) {
      console.error('[Generate] No valid app code — skipping Snack creation');
    } else {
      console.log('[Generate] Sending to Expo Snack — first 150 chars of code:', appCode.slice(0, 150));
    }

    // Create Expo Snack with just the app code
    let snackResult = { snackId: '', embedUrl: '', shareUrl: '' };
    if (appCode) {
      try {
        snackResult = await createExpoSnack({ 'App.js': appCode }, generated.appName);
      } catch (snackErr) {
        console.error('[Generate] Expo Snack creation failed:', snackErr);
      }
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

        await db.collection('projects').doc(projectId).update({
          lastSnackId: snackResult.snackId,
          colorScheme: generated.colorScheme,
          features: generated.features,
          updatedAt: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.error('[Generate] Firestore save failed:', dbErr);
      }
    }

    return res.json({
      ...generated,
      ...snackResult,
    });
  } catch (err) {
    console.error('[Generate] Error:', err);
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

    // Parse the accumulated text using the same cleanJson logic as ai.ts
    try {
      // Inline the same cleaning logic
      let cleaned = fullText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const s = cleaned.indexOf('{');
      const e = cleaned.lastIndexOf('}');
      if (s !== -1 && e > s) cleaned = cleaned.slice(s, e + 1);

      // Fix unescaped newlines (same as in ai.ts)
      cleaned = fixUnescapedNewlinesInline(cleaned);

      const parsed = JSON.parse(cleaned);

      // Extract only the app code
      const appCode = extractAppCode(parsed.files ?? {});
      console.log('[Generate/stream] app code first 150 chars:', appCode.slice(0, 150));

      let snackResult = { snackId: '', embedUrl: '', shareUrl: '' };
      if (appCode) {
        try {
          snackResult = await createExpoSnack({ 'App.js': appCode }, parsed.appName);
        } catch (snackErr) {
          console.error('[Generate/stream] Expo Snack creation failed:', snackErr);
        }
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
  const { image, mimeType = 'image/jpeg' } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'image (base64) is required' });
  }

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

// Inline version of fixUnescapedNewlines for the stream route
function fixUnescapedNewlinesInline(json: string): string {
  let result = '';
  let inString = false;
  let i = 0;
  while (i < json.length) {
    const ch = json[i];
    if (ch === '\\' && inString) {
      result += ch + (json[i + 1] ?? '');
      i += 2;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      i++;
      continue;
    }
    if (inString) {
      if (ch === '\n') result += '\\n';
      else if (ch === '\r') result += '\\r';
      else if (ch === '\t') result += '\\t';
      else result += ch;
    } else {
      result += ch;
    }
    i++;
  }
  return result;
}

export default router;
