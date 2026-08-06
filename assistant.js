// ── AI Voice Assistant brain ──────────────────────────────────────────────────
// A Siri-like agent powered by Claude. Understands natural language (Hebrew or
// English), searches the web on its own, and performs real actions through tools
// — with an explicit on-screen confirmation before anything leaves the device
// (sending/scheduling a WhatsApp, creating a calendar event, sending email).
//
// The turn loop can pause: when the model calls an action tool that needs the
// user's approval, runLoop() returns { status: 'confirm', actions } instead of
// executing. The client shows a confirm card and calls back into
// assistantConfirm() with the user's allow/deny decisions to resume.

import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-opus-5';
const MAX_ITERATIONS = 8;

const BASE_SYSTEM = `You are a smart personal voice assistant — like Siri but far more capable, powered by AI. You have real control over the tools you're connected to, and you act on the user's behalf.

Core behavior:
- The user talks to you (often by voice) in Hebrew or English. Always reply in the SAME language the user used; default to Hebrew when unsure.
- Keep spoken replies short, natural and conversational — they are read aloud by text-to-speech. Avoid markdown, bullet lists, emoji and code blocks unless the user explicitly asks for written/structured output.
- Be proactive and decisive. When the user asks for something you have a tool for, DO IT yourself rather than explaining how they could. "Find me flights to Rome" → search the web and present the best options. "Text mom I'm on my way" → send the WhatsApp message.
- When current information is involved (news, prices, flights, schedules, anything time-sensitive), use web_search before answering instead of guessing.

Actions and confirmation:
- Actions that leave the device — send_whatsapp, schedule_whatsapp, creating a calendar event, sending email — are protected: the app automatically shows the user an on-screen "Approve / Cancel" card before they run. You do NOT need to ask for confirmation in text; just call the tool with complete, correct details, and the app handles approval.
- Do make sure you actually have the details you need (who to send to, the exact message, the time). If something essential is missing or ambiguous, ask a short question first.
- If a tool result says the user declined, acknowledge it briefly and offer an alternative.
- If a tool reports it is not connected yet (calendar/email), tell the user plainly and offer what you can do instead.

Interpret relative times ("tomorrow at 9", "in 10 minutes") against the current date/time provided, in the user's timezone (Asia/Jerusalem).`;

// ── Tool definitions ──────────────────────────────────────────────────────────
function toolDefinitions() {
  return [
    { type: 'web_search_20260209', name: 'web_search', max_uses: 5 },
    {
      name: 'send_whatsapp',
      description:
        'Send a WhatsApp text message immediately. Use when the user asks to text/message/send something to someone now. If the recipient is a known contact, pass their phone number.',
      input_schema: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'Recipient phone number, e.g. 0501234567 or +972501234567' },
          message: { type: 'string', description: 'The message text to send' },
        },
        required: ['phone', 'message'],
      },
    },
    {
      name: 'schedule_whatsapp',
      description: 'Schedule a WhatsApp message for a future time (reminders, "send this at 18:00", "remind X tomorrow at 9").',
      input_schema: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'Recipient phone number' },
          message: { type: 'string', description: 'The message text' },
          sendAt: { type: 'string', description: 'ISO 8601 datetime in local (Asia/Jerusalem) time, e.g. 2026-08-07T09:00:00' },
        },
        required: ['phone', 'message', 'sendAt'],
      },
    },
    {
      name: 'list_schedules',
      description: 'List the currently scheduled WhatsApp messages.',
      input_schema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'cancel_schedule',
      description: 'Cancel a scheduled WhatsApp message by its id.',
      input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    },
    {
      name: 'calendar_action',
      description: 'Create or list Google Calendar events (meetings, appointments, agenda).',
      input_schema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'create'] },
          title: { type: 'string' },
          start: { type: 'string', description: 'ISO 8601 local time (for create)' },
          durationMinutes: { type: 'number' },
        },
        required: ['action'],
      },
    },
    {
      name: 'email_action',
      description: 'Summarize recent email or send an email (Gmail).',
      input_schema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['summarize', 'send'] },
          to: { type: 'string' },
          subject: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['action'],
      },
    },
  ];
}

const SERVER_TOOL_NAMES = new Set(['web_search']);

// Which tool calls require the user's on-screen approval before running.
function needsConfirmation(name, input = {}) {
  if (name === 'send_whatsapp' || name === 'schedule_whatsapp') return true;
  if (name === 'calendar_action') return input.action === 'create';
  if (name === 'email_action') return input.action === 'send';
  return false;
}

// A short human summary of an action, shown on the confirmation card.
function actionSummary(name, input = {}) {
  switch (name) {
    case 'send_whatsapp':
      return { icon: '📱', title: 'שליחת הודעת וואטסאפ', detail: `אל ${input.phone}`, body: input.message };
    case 'schedule_whatsapp':
      return { icon: '⏰', title: 'תזמון הודעת וואטסאפ', detail: `אל ${input.phone} • ${input.sendAt}`, body: input.message };
    case 'calendar_action':
      return { icon: '📅', title: 'יצירת אירוע ביומן', detail: input.start || '', body: input.title || '' };
    case 'email_action':
      return { icon: '📧', title: 'שליחת אימייל', detail: `אל ${input.to} • ${input.subject || ''}`, body: input.body || '' };
    default:
      return { icon: '⚙️', title: name, detail: '', body: JSON.stringify(input) };
  }
}

// ── Execute a client-side tool ────────────────────────────────────────────────
async function runTool(name, input, deps) {
  const { sendWhatsAppMessage, scheduleWhatsApp, listSchedules, cancelSchedule } = deps;
  try {
    switch (name) {
      case 'send_whatsapp':
        await sendWhatsAppMessage(input.phone, input.message);
        return { ok: true, note: `Message sent to ${input.phone}.` };
      case 'schedule_whatsapp':
        return scheduleWhatsApp(input.phone, input.message, input.sendAt);
      case 'list_schedules':
        return { schedules: listSchedules() };
      case 'cancel_schedule':
        return cancelSchedule(input.id);
      case 'calendar_action':
        return { ok: false, not_connected: true, note: 'Calendar (Google Calendar) is not connected yet.' };
      case 'email_action':
        return { ok: false, not_connected: true, note: 'Email (Gmail) is not connected yet.' };
      default:
        return { ok: false, error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Build tool_result blocks for every client tool_use in a turn.
// `decisions` maps tool_use_id -> 'allow' | 'deny' for confirmation-gated tools.
async function executeToolUses(toolUses, deps, decisions = {}) {
  const results = [];
  for (const tu of toolUses) {
    if (SERVER_TOOL_NAMES.has(tu.name)) continue; // Anthropic already ran it
    let output;
    if (needsConfirmation(tu.name, tu.input) && decisions[tu.id] !== 'allow') {
      output = { ok: false, declined: true, note: 'The user declined this action.' };
    } else {
      output = await runTool(tu.name, tu.input, deps);
    }
    results.push({ type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify(output) });
  }
  return results;
}

function buildSystem(ctx = {}) {
  const now = new Date();
  let sys = `${BASE_SYSTEM}\n\nCurrent date and time (Asia/Jerusalem): ${now.toLocaleString('en-GB', { timeZone: 'Asia/Jerusalem' })}.`;
  const contacts = Array.isArray(ctx.contacts) ? ctx.contacts.filter((c) => c.name && c.phone) : [];
  if (contacts.length) {
    sys += `\n\nKnown contacts (resolve names the user mentions to these numbers; if a name isn't here, ask for the number):\n` +
      contacts.map((c) => `- ${c.name}: ${c.phone}`).join('\n');
  }
  return sys;
}

function lastAssistantToolUses(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === 'assistant' && Array.isArray(m.content)) {
      const tus = m.content.filter((b) => b.type === 'tool_use');
      if (tus.length) return tus;
      return [];
    }
  }
  return [];
}

// ── Core loop: call the model, run tools, pause for confirmation ──────────────
async function runLoop(client, messages, deps, ctx) {
  const tools = toolDefinitions();
  const system = buildSystem(ctx);
  let finalText = '';

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system,
      tools,
      messages,
    });

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'pause_turn') continue; // server tool ran; resume

    const toolUses = response.content.filter((b) => b.type === 'tool_use');
    const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
    if (text) finalText = text;

    if (response.stop_reason !== 'tool_use' || toolUses.length === 0) {
      return { status: 'done', reply: finalText || 'סליחה, לא הצלחתי להפיק תשובה.', history: messages };
    }

    // If any tool in this turn needs approval, pause and ask the client.
    const pending = toolUses.filter((tu) => needsConfirmation(tu.name, tu.input));
    if (pending.length) {
      return {
        status: 'confirm',
        preface: finalText, // any words the model said before the action
        history: messages,
        actions: pending.map((tu) => ({ id: tu.id, name: tu.name, ...actionSummary(tu.name, tu.input) })),
      };
    }

    // Only non-confirm client tools (or server tools) → run and continue.
    const results = await executeToolUses(toolUses, deps, {});
    if (results.length === 0) {
      return { status: 'done', reply: finalText || '', history: messages };
    }
    messages.push({ role: 'user', content: results });
  }

  return { status: 'done', reply: finalText || 'סליחה, נגמרו לי הצעדים לפני שסיימתי.', history: messages };
}

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error('ANTHROPIC_API_KEY is not configured on the server.');
    err.code = 'NO_API_KEY';
    throw err;
  }
  return new Anthropic({ apiKey });
}

// Start a fresh turn (history already ends with the new user message).
export async function assistantTurn(history, deps, ctx = {}) {
  const client = getClient();
  return runLoop(client, [...history], deps, ctx);
}

// Resume after the user approved/declined a pending action.
// `decisions` maps tool_use_id -> 'allow' | 'deny'.
export async function assistantConfirm(history, decisions, deps, ctx = {}) {
  const client = getClient();
  const messages = [...history];
  const toolUses = lastAssistantToolUses(messages);
  if (!toolUses.length) {
    const err = new Error('No pending action to confirm.');
    err.code = 'NO_PENDING';
    throw err;
  }
  const results = await executeToolUses(toolUses, deps, decisions || {});
  messages.push({ role: 'user', content: results });
  return runLoop(client, messages, deps, ctx);
}
