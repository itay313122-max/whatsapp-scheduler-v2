// ── AI Voice Assistant brain ──────────────────────────────────────────────────
// A Siri-like assistant powered by Claude. Understands natural language (Hebrew
// or English), can search the web, and perform actions through tools.
//
// The tool set is pluggable: WhatsApp send/schedule are wired to the live
// functions in server.js; calendar & email are scaffolded and return a clear
// "not connected yet" result until OAuth is configured, so the model degrades
// gracefully instead of failing.

import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-opus-5';

const SYSTEM_PROMPT = `You are a smart personal voice assistant, like Siri but far more capable, powered by AI.

Core behavior:
- The user talks to you (often by voice) in Hebrew or English. Always reply in the SAME language the user used. Default to Hebrew when unsure.
- Keep spoken replies short, natural and conversational — they are read aloud by text-to-speech. Avoid markdown, bullet lists, emoji, and code blocks in your replies unless the user explicitly asks for written/structured output.
- Be proactive and decisive. When the user asks you to do something you have a tool for, do it. For minor choices, pick a sensible default and mention it briefly rather than asking.
- When you need current information (news, prices, recent events, anything time-sensitive), use web_search before answering instead of guessing.
- Before an action that is hard to reverse or sends something to another person (e.g. sending a WhatsApp message), confirm the key details in one short sentence unless the user already gave them clearly.

Tools:
- web_search: search the internet for up-to-date information.
- send_whatsapp: send a WhatsApp message right now.
- schedule_whatsapp: schedule a WhatsApp message to be sent at a future time.
- list_schedules / cancel_schedule: manage scheduled messages.
- calendar and email tools may report they are not connected yet — if so, tell the user plainly that this capability still needs to be connected, and offer what you CAN do.

Today's context is provided in each request. Interpret relative times ("tomorrow at 9", "in 10 minutes") against it, in the user's timezone (Asia/Jerusalem).`;

// ── Tool schema definitions given to the model ────────────────────────────────
function toolDefinitions() {
  return [
    { type: 'web_search_20260209', name: 'web_search', max_uses: 5 },
    {
      name: 'send_whatsapp',
      description:
        'Send a WhatsApp text message immediately to a phone number. Use when the user asks to text/message/send something to someone now.',
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
      description:
        'Schedule a WhatsApp message for a future time. Use for reminders like "remind X tomorrow at 9" or "send this at 18:00".',
      input_schema: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'Recipient phone number' },
          message: { type: 'string', description: 'The message text to send' },
          sendAt: {
            type: 'string',
            description: 'When to send, as an ISO 8601 datetime in local (Asia/Jerusalem) time, e.g. 2026-08-07T09:00:00',
          },
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
      input_schema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'The schedule id to cancel' } },
        required: ['id'],
      },
    },
    {
      name: 'calendar_action',
      description:
        'Create, list, or check calendar events (Google Calendar). Use for meetings, appointments and agenda questions.',
      input_schema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'create'], description: 'What to do' },
          title: { type: 'string', description: 'Event title (for create)' },
          start: { type: 'string', description: 'Event start, ISO 8601 local time (for create)' },
          durationMinutes: { type: 'number', description: 'Event length in minutes (for create)' },
        },
        required: ['action'],
      },
    },
    {
      name: 'email_action',
      description: 'Read a summary of, or send, email (Gmail).',
      input_schema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['summarize', 'send'], description: 'What to do' },
          to: { type: 'string', description: 'Recipient email (for send)' },
          subject: { type: 'string', description: 'Email subject (for send)' },
          body: { type: 'string', description: 'Email body (for send)' },
        },
        required: ['action'],
      },
    },
  ];
}

// ── Execute a client-side (custom) tool call ──────────────────────────────────
async function runTool(name, input, deps) {
  const { sendWhatsAppMessage, scheduleWhatsApp, listSchedules, cancelSchedule } = deps;
  try {
    switch (name) {
      case 'send_whatsapp': {
        await sendWhatsAppMessage(input.phone, input.message);
        return { ok: true, note: `Message sent to ${input.phone}.` };
      }
      case 'schedule_whatsapp': {
        const res = scheduleWhatsApp(input.phone, input.message, input.sendAt);
        return res;
      }
      case 'list_schedules':
        return { schedules: listSchedules() };
      case 'cancel_schedule':
        return cancelSchedule(input.id);
      case 'calendar_action':
        return {
          ok: false,
          not_connected: true,
          note: 'Calendar (Google Calendar) is not connected yet. Connect it to enable creating and reading events.',
        };
      case 'email_action':
        return {
          ok: false,
          not_connected: true,
          note: 'Email (Gmail) is not connected yet. Connect it to enable reading and sending mail.',
        };
      default:
        return { ok: false, error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// A tool is "server-side" (run by Anthropic) if it carries a `type` field.
const SERVER_TOOL_NAMES = new Set(['web_search']);

// ── Main entry: run one assistant turn over the conversation ───────────────────
// `history` is an array of { role: 'user' | 'assistant', content: <string|blocks> }.
// Returns { reply, history } where history is the updated array to send back next time.
export async function runAssistant(history, deps) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error('ANTHROPIC_API_KEY is not configured on the server.');
    err.code = 'NO_API_KEY';
    throw err;
  }

  const client = new Anthropic({ apiKey });
  const tools = toolDefinitions();
  const messages = [...history];

  const now = new Date();
  const dateContext = `Current date and time (Asia/Jerusalem): ${now.toLocaleString('en-GB', {
    timeZone: 'Asia/Jerusalem',
  })}.`;

  const MAX_ITERATIONS = 8;
  let finalText = '';

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: `${SYSTEM_PROMPT}\n\n${dateContext}`,
      tools,
      messages,
    });

    // Preserve the full assistant turn (needed for tool_use / thinking blocks).
    messages.push({ role: 'assistant', content: response.content });

    // Server tools paused the turn — resend to let Anthropic resume.
    if (response.stop_reason === 'pause_turn') continue;

    const toolUses = response.content.filter((b) => b.type === 'tool_use');

    // Collect any assistant text (spoken reply).
    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    if (text) finalText = text;

    if (response.stop_reason !== 'tool_use' || toolUses.length === 0) break;

    // Run all client-side tool calls; skip server tools (Anthropic ran those).
    const results = [];
    for (const tu of toolUses) {
      if (SERVER_TOOL_NAMES.has(tu.name)) continue;
      const output = await runTool(tu.name, tu.input, deps);
      results.push({
        type: 'tool_result',
        tool_use_id: tu.id,
        content: JSON.stringify(output),
      });
    }

    if (results.length === 0) break; // only server tools ran; model will continue on next loop via pause_turn otherwise
    messages.push({ role: 'user', content: results });
  }

  return { reply: finalText || 'סליחה, לא הצלחתי להפיק תשובה.', history: messages };
}
