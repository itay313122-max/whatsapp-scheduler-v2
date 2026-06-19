import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';

const router = Router();
const client = new Groq({ apiKey: process.env.GROQ_API_KEY || 'placeholder-for-demo-mode' });

const MODEL = 'llama-3.3-70b-versatile';

const FORGE_AI_SYSTEM_PROMPT = `
You are Forge AI — a friendly design & development assistant inside MobileForge,
a platform for building mobile apps with AI. You are a helpful companion, not a code generator.

You help with exactly 4 things:
1. DESIGN ADVICE — colors, layout, UX, typography. Always suggest concrete hex codes and specific values.
2. FEATURE IDEAS — suggest features that fit the app's purpose and user needs.
3. CODE EXPLANATION — explain the generated Expo/React Native code in simple, clear terms.
4. DEBUGGING — diagnose errors, identify likely causes, provide specific fixes.

IMPORTANT RULES:
- If the user writes in Hebrew → respond entirely in Hebrew.
- Be concise and practical. Bullet points beat walls of text.
- For design: always give actual hex codes, font sizes, spacing values.
- For debugging: pinpoint the exact line/pattern that likely causes the issue.
- You do NOT generate full apps — that's the main builder's job.
  If the user asks you to "build X" or "create Y", redirect them:
  "כדי לבנות/לשנות את האפליקציה — תאר אותה בצ'אט הראשי ✨"
- Be warm and encouraging. If an idea is weak, say it kindly and offer a better one.
- Keep answers focused. Maximum 3-5 bullet points unless explanation truly requires more.
`;

function buildContextBlock(ctx: Record<string, unknown>): string {
  const code = typeof ctx.currentCode === 'string'
    ? ctx.currentCode.slice(0, 4000)
    : 'No code generated yet';

  return `
---
CURRENT PROJECT CONTEXT (use this for specific advice):
App Name: ${ctx.appName || 'Not set yet'}
Description: ${ctx.description || 'Not set yet'}
Color Scheme: ${JSON.stringify(ctx.colorScheme || {})}
Features: ${Array.isArray(ctx.features) ? (ctx.features as string[]).join(', ') : 'None yet'}
Current App.tsx:
\`\`\`tsx
${code}
\`\`\`
---`;
}

// POST /api/assistant — SSE streaming conversational assistant
router.post('/', async (req: Request, res: Response) => {
  const { userMessage, projectContext = {}, history = [] } = req.body;

  if (!userMessage?.trim()) {
    return res.status(400).json({ error: 'userMessage is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const safeHistory = (Array.isArray(history) ? history : []).slice(-12);

    const stream = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 2000,
      stream: true,
      messages: [
        { role: 'system', content: FORGE_AI_SYSTEM_PROMPT + buildContextBlock(projectContext) },
        ...safeHistory,
        { role: 'user', content: userMessage },
      ],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Assistant error:', err);
    res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
    res.end();
  }
});

export default router;
