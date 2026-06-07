import { Router, Request, Response } from 'express';
import {
  generateWebApp,
  streamGenerateWebApp,
  parseGroqResponse,
  type ConversationMessage,
} from '../services/aiWeb';
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
      console.log('[Generate] App code length:', appCode.length, '| has function App:', appCode.includes('function App'));
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

    console.log('[Generate/stream] Full response length:', fullText.length);
    console.log('[Generate/stream] Raw (first 400):\n', fullText.slice(0, 400));

    try {
      const parsed = parseGroqResponse(fullText);
      const appCode = extractAppCode(parsed.files);
      const htmlDoc = appCode ? buildHtmlDocument(appCode, parsed.appName) : '';
      console.log('[Generate/stream] htmlDoc length:', htmlDoc.length);

      res.write(`data: ${JSON.stringify({ done: true, result: { ...parsed, htmlDoc, snackId: '', embedUrl: '', shareUrl: '' } })}\n\n`);
    } catch (parseErr) {
      const reason = (parseErr as Error).message.slice(0, 80);
      console.error('[Generate/stream] Parse failed:', reason);
      const fallbackCode = `function App() {
  return (
    <div style={{padding:24,fontFamily:'sans-serif',maxWidth:420,margin:'0 auto',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
      <div style={{fontSize:40}}>⚠️</div>
      <h2 style={{margin:0,color:'#dc2626',fontSize:18}}>שגיאה בייצור הקוד</h2>
      <p style={{margin:0,color:'#6b7280',fontSize:14,textAlign:'center'}}>${reason}</p>
    </div>
  );
}`;
      res.write(`data: ${JSON.stringify({
        done: true,
        result: {
          appName: 'Generated App',
          hebrewSummary: `שגיאת parse: ${reason}`,
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
    message: "פיצ'ר Vision דורש שדרוג לתוכנית Premium.",
  });
});

export default router;
