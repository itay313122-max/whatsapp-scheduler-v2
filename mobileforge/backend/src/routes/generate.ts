import { Router, Request, Response } from 'express';
import {
  generateWebApp,
  streamGenerateWebApp,
  parseGroqResponse,
  planWebApp,
  type ConversationMessage,
} from '../services/aiWeb';
import { analyzeQuality } from '../services/qualityGate';
import { buildHtmlDocument } from '../services/webRenderer';
import { getFirestore } from '../services/firebase-admin';
import { rateLimit } from '../middleware/rateLimit';
import { THEME_LIST } from '../services/themes';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/generate/themes — design presets for the picker (not rate limited).
router.get('/themes', (_req: Request, res: Response) => {
  res.json({ themes: THEME_LIST });
});

// GET /api/generate/ai-status — diagnostic. Reports which provider keys are
// configured (booleans only — never the secret) and runs a live test call to
// Groq so we can see exactly WHY generation falls back to demo mode. Open this
// URL in a browser to debug "still a calculator" without exposing secrets.
router.get('/ai-status', async (_req: Request, res: Response) => {
  const isReal = (v?: string) => !!v && v.trim().length > 8 && !/placeholder|your[-_]?key|xxx/i.test(v);
  const keysConfigured = {
    GROQ: isReal(process.env.GROQ_API_KEY),
    GEMINI: isReal(process.env.GEMINI_API_KEY),
    OPENROUTER: isReal(process.env.OPENROUTER_API_KEY),
    CEREBRAS: isReal(process.env.CEREBRAS_API_KEY),
    TOGETHER: isReal(process.env.TOGETHER_API_KEY),
  };
  let groqTest: { ok: boolean; status?: number; error?: string } = { ok: false };
  if (keysConfigured.GROQ) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'ping' }], max_tokens: 3 }),
      });
      groqTest = r.ok ? { ok: true, status: r.status } : { ok: false, status: r.status, error: (await r.text()).slice(0, 400) };
    } catch (e) {
      groqTest = { ok: false, error: (e as Error).message };
    }
  } else {
    groqTest = { ok: false, error: 'GROQ_API_KEY is empty or looks like a placeholder — set it in Render and redeploy' };
  }
  const anyRealKey = Object.values(keysConfigured).some(Boolean);
  return res.json({
    keysConfigured,
    groqTest,
    willUseDemoMode: !anyRealKey || (!groqTest.ok && !keysConfigured.GEMINI && !keysConfigured.OPENROUTER && !keysConfigured.CEREBRAS && !keysConfigured.TOGETHER),
    hint: groqTest.ok ? 'Groq works — real AI should generate. If you still see demo apps, redeploy the service.' : 'Groq is NOT working — see groqTest.error. Fix the key in Render → Environment → GROQ_API_KEY, then Manual Deploy.',
  });
});

// Cost/abuse guard on every (LLM-backed) generation endpoint below this line.
router.use(rateLimit);

/** Extract the App component code from the parsed files. */
function extractAppCode(files: Record<string, string>): string {
  const code = files['App.jsx'] ?? files['App.tsx'] ?? files['App.js'] ?? '';
  if (code.trimStart().startsWith('{') && code.includes('"appName"')) {
    console.warn('[Generate] App code looks like raw JSON — LLM parse likely failed');
    return '';
  }
  return code;
}

// POST /api/generate/plan — Chat-Mode planning: decide whether to ask
// clarifying questions before building (Lovable-style). Always fails open.
router.post('/plan', async (req: Request, res: Response) => {
  const { prompt, conversationHistory = [] } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });
  try {
    const plan = await planWebApp(prompt, conversationHistory as ConversationMessage[]);
    return res.json(plan);
  } catch (err) {
    console.error('[Generate/plan] Error:', err);
    return res.json({ ready: true }); // fail open — never block building
  }
});

// POST /api/generate
router.post('/', async (req: Request, res: Response) => {
  const { projectId, prompt, conversationHistory = [], editMode = false, existingCode, theme, ideate = false } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  try {
    const generated = await generateWebApp(
      prompt,
      conversationHistory as ConversationMessage[],
      { editMode: !!editMode, existingCode: existingCode ?? undefined, theme: theme ?? undefined, ideate: !!ideate }
    );
    const appCode = extractAppCode(generated.files);

    if (!appCode) {
      console.error('[Generate] No valid app code — cannot build HTML');
    } else {
      console.log('[Generate] App code length:', appCode.length, '| editMode:', editMode);
    }

    const htmlDoc = appCode ? buildHtmlDocument(appCode, generated.appName) : '';
    console.log('[Generate] htmlDoc length:', htmlDoc.length);

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
  const { projectId, prompt, conversationHistory = [], editMode = false, existingCode, theme } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    let fullText = '';
    for await (const chunk of streamGenerateWebApp(
      prompt,
      conversationHistory as ConversationMessage[],
      { editMode: !!editMode, existingCode: existingCode ?? undefined, theme: theme ?? undefined }
    )) {
      fullText += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    console.log('[Generate/stream] Full response length:', fullText.length);
    console.log('[Generate/stream] Raw (first 400):\n', fullText.slice(0, 400));

    try {
      const parsed = parseGroqResponse(fullText);
      const appCode = extractAppCode(parsed.files);
      const htmlDoc = appCode ? buildHtmlDocument(appCode, parsed.appName) : '';
      console.log('[Generate/stream] htmlDoc length:', htmlDoc.length);

      // Run the quality gate on the streamed result so the live path gets the
      // same dead-UI / unreachable-screen check as the non-streaming path.
      // (We don't auto-repair here — that would need a second hidden generation
      // and defeat the "watch it build" feel; the report still surfaces issues.)
      const qr = analyzeQuality(parsed.files['App.jsx']);
      const quality = {
        ok: qr.ok,
        score: qr.score,
        issues: qr.issues.map((i) => ({ kind: i.kind, severity: i.severity, message: i.message })),
        screens: qr.blueprint.definedScreens.length,
        reachable: qr.blueprint.reachableScreens.length,
        buttons: `${qr.blueprint.wiredButtonCount}/${qr.blueprint.buttonCount}`,
        repaired: false,
      };
      console.log('[Generate/stream] Quality —', { score: quality.score, ok: quality.ok, issues: quality.issues.length });

      // Persist the assistant message exactly like the non-streaming POST /, so
      // streamed (Flash-mode) builds survive a builder reload — the conversation
      // is rehydrated from Firestore via GET /projects/:id/messages.
      if (projectId) {
        try {
          const db = getFirestore();
          const msgId = uuidv4();
          await db
            .collection('conversations').doc(projectId)
            .collection('messages').doc(msgId)
            .set({
              role: 'assistant',
              content: parsed.hebrewSummary,
              files: parsed.files,
              hebrewSummary: parsed.hebrewSummary,
              appName: parsed.appName,
              colorScheme: parsed.colorScheme,
              features: parsed.features,
              timestamp: new Date().toISOString(),
            });
          await db.collection('projects').doc(projectId).update({
            colorScheme: parsed.colorScheme,
            features: parsed.features,
            updatedAt: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.error('[Generate/stream] Firestore save failed:', dbErr);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, result: { ...parsed, htmlDoc, quality, snackId: '', embedUrl: '', shareUrl: '' } })}\n\n`);
    } catch (parseErr) {
      const reason = (parseErr as Error).message.slice(0, 80);
      console.error('[Generate/stream] Parse failed:', reason);
      const fallbackCode = `function App() {
  return (
    <div style={{padding:24,fontFamily:'sans-serif',maxWidth:420,margin:'0 auto',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
      <div style={{fontSize:40}}>⚠️</div>
      <h2 style={{margin:0,color:'#dc2626',fontSize:18}}>Code generation error</h2>
      <p style={{margin:0,color:'#6b7280',fontSize:14,textAlign:'center'}}>${reason}</p>
    </div>
  );
}`;
      res.write(`data: ${JSON.stringify({
        done: true,
        result: {
          appName: 'Generated App',
          hebrewSummary: `Parse error: ${reason}`,
          files: { 'App.jsx': fallbackCode },
          features: [],
          colorScheme: { primary: '#6C3AE8', background: '#F8F9FA', text: '#1A1A2E' },
          htmlDoc: buildHtmlDocument(fallbackCode),
          snackId: '', embedUrl: '', shareUrl: '',
        },
      })}\n\n`);
    }

    res.end();
  } catch (err) {
    console.error('[Generate/stream] Fatal error:', err);
    res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
    res.end();
  }
});

// Vision — not supported in web mode
router.post('/vision', (_req: Request, res: Response) => {
  return res.status(503).json({
    error: 'VISION_NOT_SUPPORTED',
    message: "Vision feature requires a Premium plan upgrade.",
  });
});

export default router;
