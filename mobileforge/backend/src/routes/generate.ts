import { Router, Request, Response } from 'express';
import { generateWebApp, streamGenerateWebApp, type ConversationMessage } from '../services/aiWeb';
import { buildHtmlDocument } from '../services/webRenderer';
import { getFirestore } from '../services/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/** Extract the App component code from the parsed files. */
function extractAppCode(files: Record<string, string>): string {
  const code = files['App.jsx'] ?? files['App.tsx'] ?? files['App.js'] ?? '';
  if (code.trimStart().startsWith('{') && code.includes('"appName"')) {
    console.warn('[Generate] App code looks like raw JSON — LLM parse likely failed');
    return '';
  }
  return code;
}

// POST /api/generate
router.post('/', async (req: Request, res: Response) => {
  const { projectId, prompt, conversationHistory = [] } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  try {
    const generated = await generateWebApp(prompt, conversationHistory as ConversationMessage[]);
    const appCode = extractAppCode(generated.files);

    if (!appCode) {
      console.error('[Generate] No valid app code — cannot build HTML');
    } else {
      console.log('[Generate] Building HTML doc — first 100 chars of code:', appCode.slice(0, 100));
    }

    const htmlDoc = appCode ? buildHtmlDocument(appCode, generated.appName) : '';

    if (projectId) {
      try {
        const db = getFirestore();
        const msgId = uuidv4();
        await db
          .collection('conversations').doc(projectId)
          .collection('messages').doc(msgId)
          .set({
            role: 'assistant',
            content: generated.hebrewSummary,
            files: generated.files,
            hebrewSummary: generated.hebrewSummary,
            appName: generated.appName,
            colorScheme: generated.colorScheme,
            features: generated.features,
            timestamp: new Date().toISOString(),
          });
        await db.collection('projects').doc(projectId).update({
          colorScheme: generated.colorScheme,
          features: generated.features,
          updatedAt: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.error('[Generate] Firestore save failed:', dbErr);
      }
    }

    return res.json({ ...generated, htmlDoc, snackId: '', embedUrl: '', shareUrl: '' });
  } catch (err) {
    console.error('[Generate] Error:', err);
    return res.status(500).json({
      error: 'Generation failed',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// POST /api/generate/stream
router.post('/stream', async (req: Request, res: Response) => {
  const { prompt, conversationHistory = [] } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    let fullText = '';
    for await (const chunk of streamGenerateWebApp(prompt, conversationHistory as ConversationMessage[])) {
      fullText += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    try {
      let cleaned = fullText
        .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      const s = cleaned.indexOf('{');
      const e = cleaned.lastIndexOf('}');
      if (s !== -1 && e > s) cleaned = cleaned.slice(s, e + 1);
      cleaned = fixUnescapedNewlines(cleaned);

      const parsed = JSON.parse(cleaned);
      const appCode = extractAppCode(parsed.files ?? {});
      const htmlDoc = appCode ? buildHtmlDocument(appCode, parsed.appName) : '';
      console.log('[Generate/stream] code first 100 chars:', appCode.slice(0, 100));

      res.write(`data: ${JSON.stringify({ done: true, result: { ...parsed, htmlDoc, snackId: '', embedUrl: '', shareUrl: '' } })}\n\n`);
    } catch {
      const fallback = `function App() { return <div style={{padding:24}}><h1>שגיאה</h1></div>; }`;
      res.write(`data: ${JSON.stringify({
        done: true,
        result: {
          appName: 'Generated App',
          hebrewSummary: 'האפליקציה נוצרה',
          files: { 'App.jsx': fallback },
          features: [],
          colorScheme: { primary: '#6C3AE8', background: '#F8F9FA', text: '#1A1A2E' },
          htmlDoc: buildHtmlDocument(fallback),
          snackId: '', embedUrl: '', shareUrl: '',
        },
      })}\n\n`);
    }

    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
    res.end();
  }
});

// Vision — not supported in web mode
router.post('/vision', (_req: Request, res: Response) => {
  return res.status(503).json({
    error: 'VISION_NOT_SUPPORTED',
    message: "פיצ'ר Vision דורש שדרוג לתוכנית Premium.",
  });
});

function fixUnescapedNewlines(json: string): string {
  let result = '';
  let inString = false;
  let i = 0;
  while (i < json.length) {
    const ch = json[i];
    if (ch === '\\' && inString) { result += ch + (json[i + 1] ?? ''); i += 2; continue; }
    if (ch === '"') { inString = !inString; result += ch; i++; continue; }
    if (inString) {
      if (ch === '\n') result += '\\n';
      else if (ch === '\r') result += '\\r';
      else if (ch === '\t') result += '\\t';
      else result += ch;
    } else { result += ch; }
    i++;
  }
  return result;
}

export default router;
