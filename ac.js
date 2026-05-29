#!/usr/bin/env node
/**
 * AC Remote – standalone single-file server
 * Usage: node ac.js
 * Then open http://<your-ip>:3000 on your phone
 */
import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { discover } from 'node-broadlink';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CODES_FILE = join(__dirname, 'ac_codes.json');
const PORT = 3000;

// ── State ─────────────────────────────────────────────────────────────────────
let blDev = null;
let acState = { power: false, temperature: 24, mode: 'cool', fanSpeed: 'auto', swing: false };
let acCodes = fs.existsSync(CODES_FILE) ? JSON.parse(fs.readFileSync(CODES_FILE)) : {};

function saveCodes() { fs.writeFileSync(CODES_FILE, JSON.stringify(acCodes, null, 2)); }

// ── Router ────────────────────────────────────────────────────────────────────
async function handler(req, res) {
  const url = new URL(req.url, `http://localhost`);
  const path = url.pathname;

  const json = (obj, code = 200) => {
    res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(obj));
  };

  let body = '';
  if (req.method === 'POST') {
    await new Promise(r => { req.on('data', c => body += c); req.on('end', r); });
  }
  const data = body ? JSON.parse(body) : {};

  // ── Broadlink: auto-discover ──
  if (req.method === 'POST' && path === '/bl/discover') {
    try {
      const devs = await discover(5000);
      if (!devs.length) return json({ error: 'לא נמצאו מכשירי Broadlink ברשת' }, 404);
      blDev = devs[0]; await blDev.auth();
      return json({ ok: true, host: blDev.host });
    } catch (e) { return json({ error: e.message }, 500); }
  }

  // ── Broadlink: connect by IP ──
  if (req.method === 'POST' && path === '/bl/connect') {
    try {
      const devs = await discover(5000, data.host);
      if (!devs.length) return json({ error: `לא נמצא ב-${data.host}` }, 404);
      blDev = devs[0]; await blDev.auth();
      return json({ ok: true, host: blDev.host });
    } catch (e) { return json({ error: e.message }, 500); }
  }

  // ── Broadlink: learn IR code ──
  if (req.method === 'POST' && path === '/bl/learn') {
    if (!blDev) return json({ error: 'Broadlink לא מחובר' }, 400);
    try {
      await blDev.enterLearning();
      let code = null;
      for (let i = 0; i < 30 && !code; i++) {
        await new Promise(r => setTimeout(r, 500));
        try { code = await blDev.checkData(); } catch (_) {}
      }
      await blDev.cancelLearning().catch(() => {});
      if (!code) return json({ error: 'לא נקלט IR – נסה שוב' }, 408);
      acCodes[data.cmd] = code.toString('hex');
      saveCodes();
      return json({ ok: true, cmd: data.cmd });
    } catch (e) { return json({ error: e.message }, 500); }
  }

  // ── AC: get state ──
  if (req.method === 'GET' && path === '/state') {
    return json({ ...acState, learned: Object.keys(acCodes), connected: !!blDev });
  }

  // ── AC: send command ──
  if (req.method === 'POST' && path === '/cmd') {
    const { action, value } = data;
    let irKey = action;
    switch (action) {
      case 'power':     acState.power = !acState.power; irKey = acState.power ? 'power_on' : 'power_off'; break;
      case 'temp_up':   if (acState.power && acState.temperature < 30) acState.temperature++; break;
      case 'temp_down': if (acState.power && acState.temperature > 16) acState.temperature--; break;
      case 'mode':      if (acState.power && value) { acState.mode = value; irKey = `mode_${value}`; } break;
      case 'fan':       if (acState.power && value) { acState.fanSpeed = value; irKey = `fan_${value}`; } break;
      case 'swing':     if (acState.power) acState.swing = !acState.swing; break;
    }
    let sent = false;
    if (blDev && acCodes[irKey]) {
      try { await blDev.sendData(Buffer.from(acCodes[irKey], 'hex')); sent = true; } catch (_) {}
    }
    return json({ ok: true, state: acState, irKey, sent });
  }

  // ── Serve UI ──
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(UI);
}

// ── Start ─────────────────────────────────────────────────────────────────────
const server = http.createServer(handler);
server.listen(PORT, '0.0.0.0', () => {
  // Print local IP for phone access
  import { networkInterfaces } from 'os';
  const nets = networkInterfaces();
  const ips = Object.values(nets).flat().filter(n => n.family === 'IPv4' && !n.internal).map(n => n.address);
  console.log('\n🌀 AC Remote מוכן!');
  console.log('──────────────────────────────');
  ips.forEach(ip => console.log(`📱 פתח בטלפון: http://${ip}:${PORT}`));
  console.log(`💻 מחשב זה:     http://localhost:${PORT}`);
  console.log('──────────────────────────────\n');
});

// ── UI (embedded HTML) ────────────────────────────────────────────────────────
const UI = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<title>שלט מזגן</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0d1117;--s:#161b22;--b:#30363d;--t:#e6edf3;--m:#8b949e;--on:#00cfff;--gr:#3fb950;--re:#f85149;--ye:#e3b341}
body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--t);min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:16px 12px 32px}
h1{font-size:1.1rem;color:var(--on);text-align:center;margin-bottom:14px}
.remote{width:100%;max-width:340px;background:linear-gradient(160deg,#1c2333,#111827);border:1px solid #2a3a50;border-radius:28px;padding:20px 16px 24px;box-shadow:0 8px 40px rgba(0,0,0,.6)}
/* display */
.disp{background:#020c14;border:1px solid #0a2030;border-radius:14px;padding:16px;margin-bottom:20px;text-align:center;position:relative;transition:opacity .3s}
.disp.off{opacity:.3}
.brand{font-size:.6rem;letter-spacing:.15em;color:#2a5070;margin-bottom:4px}
.temp-big{font-size:4.5rem;font-weight:700;line-height:1;color:var(--on);text-shadow:0 0 20px rgba(0,207,255,.3);transition:color .3s}
.disp.off .temp-big{color:#1a3a50;text-shadow:none}
.tags{display:flex;justify-content:center;gap:12px;margin-top:8px}
.tag{background:rgba(0,207,255,.08);border:1px solid rgba(0,207,255,.15);border-radius:8px;padding:3px 10px;font-size:.75rem;color:var(--on)}
.disp.off .tag{background:transparent;border-color:#0a2030;color:#1a3a50}
.pill{position:absolute;top:8px;left:12px;font-size:.62rem;padding:2px 8px;border-radius:10px;background:rgba(63,185,80,.15);color:var(--gr);border:1px solid rgba(63,185,80,.25)}
.pill.off{background:rgba(248,81,73,.1);color:var(--re);border-color:rgba(248,81,73,.2)}
/* power */
.pw-row{display:flex;justify-content:center;margin-bottom:20px}
.pw{width:68px;height:68px;border-radius:50%;border:3px solid var(--re);background:transparent;color:var(--re);font-size:1.7rem;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center}
.pw.on{border-color:var(--gr);color:var(--gr);box-shadow:0 0 16px rgba(63,185,80,.3)}
.pw:active{transform:scale(.9)}
/* temp */
.tr{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:20px}
.tb{width:54px;height:54px;border-radius:50%;border:1px solid var(--b);background:var(--s);color:var(--t);font-size:1.5rem;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center}
.tb:hover{border-color:var(--on);color:var(--on)}
.tb:active{transform:scale(.86)}
.tb:disabled{opacity:.3;cursor:default}
.tc{text-align:center}
.tc-val{font-size:1.4rem;color:var(--on);font-weight:700}
.tc-lbl{font-size:.65rem;color:var(--m);margin-top:2px}
/* sections */
.slbl{font-size:.68rem;color:var(--m);letter-spacing:.1em;text-transform:uppercase;text-align:center;margin-bottom:8px}
/* mode */
.mr{display:flex;gap:6px;justify-content:center;margin-bottom:18px}
.mb{flex:1;max-width:58px;aspect-ratio:1;border-radius:12px;border:1px solid var(--b);background:var(--s);color:var(--m);font-size:.62rem;cursor:pointer;transition:all .18s;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.mb .ic{font-size:1.3rem}
.mb:disabled{opacity:.3;cursor:default}
.mb.act{border-color:var(--on);background:rgba(0,207,255,.1);color:var(--on)}
/* fan */
.fr{display:flex;gap:6px;justify-content:center;margin-bottom:16px}
.fb{flex:1;padding:8px 0;border-radius:9px;border:1px solid var(--b);background:var(--s);color:var(--m);font-size:.8rem;cursor:pointer;transition:all .18s}
.fb:disabled{opacity:.3;cursor:default}
.fb.act{border-color:#58a6ff;background:rgba(88,166,255,.1);color:#58a6ff}
/* swing */
.sr{display:flex;justify-content:center}
.sb{padding:8px 24px;border-radius:9px;border:1px solid var(--b);background:var(--s);color:var(--m);font-size:.82rem;cursor:pointer;transition:all .18s}
.sb:disabled{opacity:.3;cursor:default}
.sb.act{border-color:var(--ye);background:rgba(227,179,65,.1);color:var(--ye)}
/* flash */
.fl{position:fixed;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,207,255,.15);border:1px solid rgba(0,207,255,.3);color:var(--on);padding:5px 16px;border-radius:18px;font-size:.8rem;pointer-events:none;opacity:0;transition:opacity .2s;z-index:99;white-space:nowrap}
.fl.show{opacity:1}
.fl.err{background:rgba(248,81,73,.15);border-color:rgba(248,81,73,.3);color:var(--re)}
/* setup */
details{width:100%;max-width:340px;margin-top:14px;background:var(--s);border:1px solid var(--b);border-radius:12px}
summary{padding:12px 16px;cursor:pointer;font-size:.85rem;color:var(--m);list-style:none;display:flex;justify-content:space-between}
summary::after{content:'▾';font-size:.75rem}
details[open] summary{color:var(--t);border-bottom:1px solid var(--b)}
.sb2{padding:14px 16px}
.fi{width:100%;padding:7px 10px;background:var(--bg);border:1px solid var(--b);border-radius:7px;color:var(--t);font-size:.88rem;outline:none;margin:6px 0 10px}
.fi:focus{border-color:#58a6ff}
.br{display:flex;gap:6px}
.bn{flex:1;padding:8px 0;border-radius:7px;border:1px solid var(--b);background:transparent;color:var(--t);font-size:.82rem;cursor:pointer}
.bn.p{background:#1f6feb;border-color:#1f6feb}
.sm{margin-top:8px;font-size:.78rem;min-height:18px;color:var(--gr)}
.sm.e{color:var(--re)}
.lg{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:12px}
.li{display:flex;align-items:center;gap:5px;background:var(--bg);border:1px solid var(--b);border-radius:7px;padding:6px 8px;font-size:.74rem}
.ld{width:7px;height:7px;border-radius:50%;background:var(--b);flex-shrink:0}
.ld.d{background:var(--gr)}
.ln{flex:1;color:var(--m);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lbtn{padding:2px 7px;border-radius:4px;border:1px solid var(--b);background:transparent;color:var(--t);font-size:.7rem;cursor:pointer;white-space:nowrap}
.lbtn:hover{border-color:var(--on);color:var(--on)}
.lbtn.lrn{border-color:var(--ye);color:var(--ye)}
</style>
</head>
<body>
<h1>🌀 שלט מזגן – Tornado</h1>
<div id="fl" class="fl"></div>

<div class="remote">
  <div class="disp off" id="disp">
    <span class="pill off" id="pill">כבוי</span>
    <div class="brand">TORNADO · MASTER 35</div>
    <div class="temp-big"><span id="tv">24</span>°</div>
    <div class="tags">
      <span class="tag" id="mt">❄️ <span id="ml">קירור</span></span>
      <span class="tag">🌀 <span id="fl2">אוטו</span></span>
    </div>
  </div>

  <div class="pw-row"><button class="pw" id="pw" onclick="cmd('power')">⏻</button></div>

  <div class="tr">
    <div><button class="tb" id="bu" onclick="cmd('temp_up')" disabled>▲</button><div style="font-size:.65rem;color:var(--m);text-align:center;margin-top:3px">חם</div></div>
    <div class="tc"><div class="tc-val" id="tv2">24°C</div><div class="tc-lbl">16°–30°C</div></div>
    <div><button class="tb" id="bd" onclick="cmd('temp_down')" disabled>▼</button><div style="font-size:.65rem;color:var(--m);text-align:center;margin-top:3px">קר</div></div>
  </div>

  <div class="slbl">מצב</div>
  <div class="mr">
    <button class="mb" data-m="cool" onclick="cmd('mode','cool')" disabled><span class="ic">❄️</span>קירור</button>
    <button class="mb" data-m="heat" onclick="cmd('mode','heat')" disabled><span class="ic">♨️</span>חימום</button>
    <button class="mb" data-m="fan"  onclick="cmd('mode','fan')"  disabled><span class="ic">🌬️</span>מאוורר</button>
    <button class="mb" data-m="auto" onclick="cmd('mode','auto')" disabled><span class="ic">🔄</span>אוטו</button>
    <button class="mb" data-m="dry"  onclick="cmd('mode','dry')"  disabled><span class="ic">💧</span>ייבוש</button>
  </div>

  <div class="slbl">מאוורר</div>
  <div class="fr">
    <button class="fb" data-f="auto"   onclick="cmd('fan','auto')"   disabled>אוטו</button>
    <button class="fb" data-f="low"    onclick="cmd('fan','low')"    disabled>1</button>
    <button class="fb" data-f="medium" onclick="cmd('fan','medium')" disabled>2</button>
    <button class="fb" data-f="high"   onclick="cmd('fan','high')"   disabled>3</button>
  </div>

  <div class="sr"><button class="sb" id="swb" onclick="cmd('swing')" disabled>↕ סוויפ</button></div>
</div>

<details>
  <summary>⚙️ הגדרת Broadlink</summary>
  <div class="sb2">
    <div style="font-size:.78rem;color:var(--m);margin-bottom:6px">IP של ה-Broadlink (ריק = חיפוש אוטומטי)</div>
    <input class="fi" id="blip" placeholder="192.168.1.xx"/>
    <div class="br">
      <button class="bn" onclick="discover()">🔍 חפש</button>
      <button class="bn p" onclick="connect()">🔌 התחבר</button>
    </div>
    <p class="sm" id="sm"></p>
    <div style="font-size:.76rem;color:var(--m);margin-top:12px;line-height:1.5">
      לכל כפתור: לחץ <b>למד</b> → כוון שלט טורנדו ל-Broadlink → לחץ על הכפתור בשלט המקורי
    </div>
    <div class="lg" id="lg"></div>
  </div>
</details>

<script>
const CMDS=[
  {k:'power_on',l:'הדלקה'},{k:'power_off',l:'כיבוי'},
  {k:'temp_up',l:'טמפ ▲'},{k:'temp_down',l:'טמפ ▼'},
  {k:'mode_cool',l:'❄️ קירור'},{k:'mode_heat',l:'♨️ חימום'},
  {k:'mode_fan',l:'🌬️ מאוורר'},{k:'mode_auto',l:'🔄 אוטו'},{k:'mode_dry',l:'💧 ייבוש'},
  {k:'fan_auto',l:'🌀 אוטו'},{k:'fan_low',l:'מהירות 1'},{k:'fan_medium',l:'מהירות 2'},{k:'fan_high',l:'מהירות 3'},
  {k:'swing',l:'↕ סוויפ'}
];
const MODES={cool:{i:'❄️',l:'קירור'},heat:{i:'♨️',l:'חימום'},fan:{i:'🌬️',l:'מאוורר'},auto:{i:'🔄',l:'אוטו'},dry:{i:'💧',l:'ייבוש'}};
const FAN={auto:'אוטו',low:'נמוך',medium:'בינוני',high:'גבוה'};
let st={power:false,temperature:24,mode:'cool',fanSpeed:'auto',swing:false};
let learned=new Set();
let activeLearn=null;

function flash(msg,err=false){
  const e=document.getElementById('fl');
  e.textContent=msg; e.className='fl show'+(err?' err':'');
  clearTimeout(e._t); e._t=setTimeout(()=>{e.className='fl'},2000);
}
function render(){
  const on=st.power;
  document.getElementById('disp').className='disp'+(on?'':' off');
  document.getElementById('pill').textContent=on?'פעיל':'כבוי';
  document.getElementById('pill').className='pill'+(on?'':' off');
  document.getElementById('pw').className='pw'+(on?' on':'');
  document.getElementById('tv').textContent=st.temperature;
  document.getElementById('tv2').textContent=st.temperature+'°C';
  const m=MODES[st.mode]||{i:'❄️',l:st.mode};
  document.getElementById('mt').innerHTML=m.i+' <span id="ml">'+m.l+'</span>';
  document.getElementById('fl2').textContent=FAN[st.fanSpeed]||st.fanSpeed;
  document.querySelectorAll('.tb,.mb,.fb,.sb').forEach(b=>b.disabled=!on);
  document.querySelectorAll('.mb').forEach(b=>b.classList.toggle('act',b.dataset.m===st.mode));
  document.querySelectorAll('.fb').forEach(b=>b.classList.toggle('act',b.dataset.f===st.fanSpeed));
  document.getElementById('swb').classList.toggle('act',st.swing);
  renderLearn();
}
function renderLearn(){
  document.getElementById('lg').innerHTML=CMDS.map(c=>`
    <div class="li">
      <div class="ld ${learned.has(c.k)?'d':''}"></div>
      <span class="ln">${c.l}</span>
      <button class="lbtn ${activeLearn===c.k?'lrn':''}" onclick="learn('${c.k}')">
        ${activeLearn===c.k?'⏳...':(learned.has(c.k)?'↺':'למד')}
      </button>
    </div>`).join('');
}
async function cmd(action,value){
  const body={action};
  if(value!==undefined)body.value=value;
  const r=await fetch('/cmd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const d=await r.json();
  if(d.ok){st=d.state;render();if(d.sent)flash('📡 '+d.irKey);}
  else flash(d.error,true);
}
function smsg(t,e=false){const el=document.getElementById('sm');el.textContent=t;el.className='sm'+(e?' e':'');}
async function discover(){
  smsg('🔍 מחפש...');
  const r=await fetch('/bl/discover',{method:'POST'}).catch(e=>({ok:false,json:()=>({error:e.message})}));
  const d=await r.json();
  if(d.ok){smsg('✓ מחובר: '+d.host);await poll();}else smsg(d.error,true);
}
async function connect(){
  const ip=document.getElementById('blip').value.trim();
  if(!ip)return discover();
  smsg('🔌 מתחבר...');
  const r=await fetch('/bl/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({host:ip})});
  const d=await r.json();
  if(d.ok){smsg('✓ מחובר: '+d.host);await poll();}else smsg(d.error,true);
}
async function learn(cmd){
  smsg('⏳ לחץ כפתור בשלט המקורי...');
  activeLearn=cmd; renderLearn();
  const r=await fetch('/bl/learn',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cmd})});
  const d=await r.json();
  if(d.ok){learned.add(cmd);smsg('✓ '+cmd+' נלמד!');}else smsg(d.error,true);
  activeLearn=null; renderLearn();
}
async function poll(){
  const r=await fetch('/state').catch(()=>null);
  if(!r)return;
  const d=await r.json();
  st={power:d.power,temperature:d.temperature,mode:d.mode,fanSpeed:d.fanSpeed,swing:d.swing};
  learned=new Set(d.learned||[]);
  render();
}
poll(); setInterval(poll,3000);
</script>
</body>
</html>`;
