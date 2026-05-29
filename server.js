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
import { discover } from 'node-broadlink';

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

// ── AC / Broadlink ──────────────────────────────────────────────────────────

const AC_CODES_FILE = join(__dirname, 'ac_codes.json');

let acCodes = {};   // { commandKey: hexString }
let blDev   = null; // Broadlink RM device
let acState = { power: false, temperature: 24, mode: 'cool', fanSpeed: 'auto', swing: false };

function loadACCodes() {
  try {
    if (fs.existsSync(AC_CODES_FILE)) acCodes = JSON.parse(fs.readFileSync(AC_CODES_FILE, 'utf8'));
  } catch (_) {}
}
loadACCodes();

function saveACCodes() {
  fs.writeFileSync(AC_CODES_FILE, JSON.stringify(acCodes, null, 2));
}

// GET /api/broadlink/status
app.get('/api/broadlink/status', (_req, res) => {
  res.json({
    connected: !!blDev,
    device: blDev ? { host: blDev.host, mac: blDev.mac?.toString('hex') } : null,
    learnedCommands: Object.keys(acCodes),
  });
});

// POST /api/broadlink/discover
app.post('/api/broadlink/discover', async (_req, res) => {
  try {
    const devices = await discover(5000);
    if (!devices.length) return res.status(404).json({ error: 'לא נמצאו מכשירי Broadlink ברשת' });
    blDev = devices[0];
    await blDev.auth();
    res.json({ success: true, device: { host: blDev.host, mac: blDev.mac?.toString('hex') } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/broadlink/connect  { host }
app.post('/api/broadlink/connect', async (req, res) => {
  const { host } = req.body;
  if (!host) return res.status(400).json({ error: 'host נדרש' });
  try {
    const devices = await discover(5000, host);
    if (!devices.length) return res.status(404).json({ error: `לא נמצא מכשיר ב-${host}` });
    blDev = devices[0];
    await blDev.auth();
    res.json({ success: true, device: { host: blDev.host } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/broadlink/learn  { command }  – 15 sec window
app.post('/api/broadlink/learn', async (req, res) => {
  const { command } = req.body;
  if (!command)  return res.status(400).json({ error: 'command נדרש' });
  if (!blDev)    return res.status(400).json({ error: 'Broadlink לא מחובר' });

  try {
    await blDev.enterLearning();
    let code = null;
    for (let i = 0; i < 30 && !code; i++) {
      await new Promise(r => setTimeout(r, 500));
      try { code = await blDev.checkData(); } catch (_) {}
    }
    await blDev.cancelLearning().catch(() => {});
    if (!code) return res.status(408).json({ error: 'לא נקלט IR – כוון את השלט ולחץ שוב' });
    acCodes[command] = code.toString('hex');
    saveACCodes();
    res.json({ success: true, command });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/broadlink/codes/:command
app.delete('/api/broadlink/codes/:command', (req, res) => {
  delete acCodes[req.params.command];
  saveACCodes();
  res.json({ success: true });
});

// GET /api/ac/state
app.get('/api/ac/state', (_req, res) => {
  res.json({ ...acState, learnedCommands: Object.keys(acCodes) });
});

// POST /api/ac/command  { action, value? }
app.post('/api/ac/command', async (req, res) => {
  const { action, value } = req.body;
  let irKey = action;

  switch (action) {
    case 'power':
      acState.power = !acState.power;
      irKey = acState.power ? 'power_on' : 'power_off';
      break;
    case 'temp_up':
      if (acState.power && acState.temperature < 30) acState.temperature++;
      break;
    case 'temp_down':
      if (acState.power && acState.temperature > 16) acState.temperature--;
      break;
    case 'mode':
      if (acState.power && value) { acState.mode = value; irKey = `mode_${value}`; }
      break;
    case 'fan':
      if (acState.power && value) { acState.fanSpeed = value; irKey = `fan_${value}`; }
      break;
    case 'swing':
      if (acState.power) acState.swing = !acState.swing;
      break;
    default:
      return res.status(400).json({ error: `פעולה לא מוכרת: ${action}` });
  }

  let irSent = false;
  let irError = null;
  const hex = acCodes[irKey];
  if (blDev && hex) {
    try {
      await blDev.sendData(Buffer.from(hex, 'hex'));
      irSent = true;
    } catch (e) {
      irError = e.message;
    }
  }

  res.json({ success: true, state: acState, irKey, irSent, irError: irError || undefined });
});

// ── Start ────────────────────────────────────────────────────────────────────
connectToWhatsApp().catch(console.error);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
