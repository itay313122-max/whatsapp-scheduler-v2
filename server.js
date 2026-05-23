import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cron from 'node-cron';
import qrcode from 'qrcode';
import pino from 'pino';
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = pino({ level: 'silent' });
const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

// State
let sock = null;
let qrDataURL = null;
let connectionStatus = 'disconnected'; // disconnected | connecting | qr | connected
const schedules = new Map(); // id -> { id, phone, message, sendAt, cronJob, status }

// ── Auth state dir ──────────────────────────────────────────────────────────
const AUTH_DIR = join(__dirname, 'auth_info');
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

// ── WhatsApp connection ─────────────────────────────────────────────────────
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: true,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    generateHighQualityLinkPreview: false,
  });

  connectionStatus = 'connecting';
  qrDataURL = null;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      connectionStatus = 'qr';
      qrDataURL = await qrcode.toDataURL(qr);
      console.log('QR code generated – scan it at /api/qr');
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed, status:', statusCode, 'reconnect:', shouldReconnect);
      connectionStatus = 'disconnected';
      qrDataURL = null;
      if (shouldReconnect) {
        setTimeout(connectToWhatsApp, 3000);
      }
    } else if (connection === 'open') {
      connectionStatus = 'connected';
      qrDataURL = null;
      console.log('WhatsApp connected!');
    }
  });
}

// ── Helper: normalize phone ─────────────────────────────────────────────────
function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  // If starts with 0, assume Israeli number
  if (digits.startsWith('0')) return '972' + digits.slice(1) + '@s.whatsapp.net';
  return digits + '@s.whatsapp.net';
}

// ── Helper: send message ────────────────────────────────────────────────────
async function sendWhatsAppMessage(phone, message) {
  if (connectionStatus !== 'connected' || !sock) {
    throw new Error('WhatsApp is not connected');
  }
  const jid = normalizePhone(phone);
  await sock.sendMessage(jid, { text: message });
}

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /api/status
app.get('/api/status', (_req, res) => {
  res.json({
    status: connectionStatus,
    schedulesCount: schedules.size,
    activeSchedules: [...schedules.values()].filter(s => s.status === 'pending').length,
  });
});

// GET /api/qr
app.get('/api/qr', (_req, res) => {
  if (!qrDataURL) {
    return res.status(404).json({ error: 'No QR code available', status: connectionStatus });
  }
  res.json({ qr: qrDataURL });
});

// POST /api/send  { phone, message }
app.post('/api/send', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: 'phone and message are required' });
  }
  try {
    await sendWhatsAppMessage(phone, message);
    res.json({ success: true, phone, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/schedule-once  { id, phone, message, sendAt }
// sendAt: ISO 8601 string  e.g. "2025-07-01T14:30:00"
app.post('/api/schedule-once', (req, res) => {
  const { id, phone, message, sendAt } = req.body;
  if (!id || !phone || !message || !sendAt) {
    return res.status(400).json({ error: 'id, phone, message, sendAt are required' });
  }
  if (schedules.has(id)) {
    return res.status(409).json({ error: `Schedule with id "${id}" already exists` });
  }

  const sendDate = new Date(sendAt);
  if (isNaN(sendDate.getTime())) {
    return res.status(400).json({ error: 'Invalid sendAt date' });
  }
  if (sendDate <= new Date()) {
    return res.status(400).json({ error: 'sendAt must be in the future' });
  }

  const min   = sendDate.getMinutes();
  const hour  = sendDate.getHours();
  const day   = sendDate.getDate();
  const month = sendDate.getMonth() + 1;
  const expression = `${min} ${hour} ${day} ${month} *`;

  const entry = { id, phone, message, sendAt, status: 'pending' };

  const job = cron.schedule(expression, async () => {
    console.log(`Running scheduled job "${id}"`);
    try {
      await sendWhatsAppMessage(phone, message);
      entry.status = 'sent';
    } catch (err) {
      entry.status = 'failed';
      entry.error = err.message;
      console.error(`Job "${id}" failed:`, err.message);
    } finally {
      job.stop();
    }
  }, { timezone: 'Asia/Jerusalem' });

  entry.cronJob = job;
  schedules.set(id, entry);

  res.status(201).json({ success: true, id, phone, message, sendAt });
});

// DELETE /api/schedule/:id
app.delete('/api/schedule/:id', (req, res) => {
  const { id } = req.params;
  const entry = schedules.get(id);
  if (!entry) {
    return res.status(404).json({ error: `Schedule "${id}" not found` });
  }
  entry.cronJob?.stop();
  schedules.delete(id);
  res.json({ success: true, id });
});

// GET /api/schedules
app.get('/api/schedules', (_req, res) => {
  const list = [...schedules.values()].map(({ cronJob, ...rest }) => rest);
  res.json(list);
});

// ── Start ────────────────────────────────────────────────────────────────────
connectToWhatsApp().catch(console.error);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
