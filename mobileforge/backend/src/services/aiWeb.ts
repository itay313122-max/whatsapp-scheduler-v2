import Groq from 'groq-sdk';
import { getDemoResponse, getDemoEditResponse } from './demoApps';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY || 'placeholder-for-demo-mode' });
const MODEL = 'llama-3.3-70b-versatile';

// Log key status once on startup (last 4 chars only, never full key)
const _k = (v: string | undefined) => v ? (v.length > 4 ? `…${v.slice(-4)}` : '(set)') : '⚠️ MISSING';
console.log('[AI/web] Provider keys —', {
  GROQ:        _k(process.env.GROQ_API_KEY),
  GEMINI:      _k(process.env.GEMINI_API_KEY),
  OPENROUTER:  _k(process.env.OPENROUTER_API_KEY),
});

// ── Provider abstraction ────────────────────────────────────────────────────

interface ChatMessage { role: string; content: string; }

async function callGroq(messages: ChatMessage[]): Promise<string> {
  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 16000,
    messages: messages as Parameters<typeof client.chat.completions.create>[0]['messages'],
  });
  return response.choices[0]?.message?.content ?? '';
}

async function callGemini(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { const e = new Error('GEMINI_API_KEY not set'); (e as any).skip = true; throw e; }

  const systemMsg = messages.find(m => m.role === 'system');
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        ...(systemMsg && { systemInstruction: { parts: [{ text: systemMsg.content }] } }),
        generationConfig: { maxOutputTokens: 16384, temperature: 0.7 },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(`Gemini ${res.status}: ${(err as any)?.error?.message ?? 'unknown'}`);
    (e as any).status = res.status;
    throw e;
  }
  const data = await res.json() as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

async function callOpenRouter(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) { const e = new Error('OPENROUTER_API_KEY not set'); (e as any).skip = true; throw e; }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://mobileforge.app',
      'X-Title': 'MobileForge',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      messages,
      max_tokens: 16000,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(`OpenRouter ${res.status}: ${(err as any)?.error?.message ?? 'unknown'}`);
    (e as any).status = res.status;
    throw e;
  }
  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * Try Groq first (with 1 retry on rate-limit), then Gemini, then OpenRouter.
 * Throws only when ALL configured providers have failed.
 *
 * Bug fix: previously only fell back on 429 rate-limit. Now falls back on
 * ANY Groq failure (auth error, server error, network error, etc.) so that
 * a bad/missing Groq key still lets Gemini/OpenRouter serve the request.
 */
async function callWithFallback(messages: ChatMessage[]): Promise<string> {
  // Demo mode: skip network calls entirely if all API keys are placeholders
  const allPlaceholder = [process.env.GROQ_API_KEY, process.env.GEMINI_API_KEY, process.env.OPENROUTER_API_KEY]
    .every(k => !k || k.startsWith('__') || k.startsWith('placeholder'));
  if (allPlaceholder) {
    console.log('[AI/web] \u{1F3AD} Demo mode — all API keys are placeholders');
    const userMsg = messages.find(m => m.role === 'user');
    return getDemoResponse(userMsg?.content ?? '');
  }

  let groqLastError: unknown;

  // 1. Groq — up to 2 attempts, but only retry on 429 rate-limit
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      console.log(`[AI/web] Groq attempt ${attempt + 1}/2…`);
      const result = await callGroq(messages);
      console.log('[AI/web] ✓ Groq succeeded');
      return result;
    } catch (err) {
      groqLastError = err;
      const status = (err as any)?.status ?? (err as any)?.error?.status;
      const msg    = (err as Error).message ?? String(err);
      console.warn(`[AI/web] Groq attempt ${attempt + 1} failed — status=${status ?? 'n/a'} — ${msg}`);
      if (status !== 429) break;   // not rate-limited: don't retry, go to fallback
      if (attempt === 0) {
        console.warn('[AI/web] Groq rate-limited — retrying in 2 s…');
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  console.warn('[AI/web] Groq failed — trying fallback providers…');

  // 2. Gemini
  try {
    console.log('[AI/web] → Gemini');
    const result = await callGemini(messages);
    console.log('[AI/web] ✓ Gemini succeeded');
    return result;
  } catch (err) {
    if ((err as any).skip) console.log('[AI/web]   Gemini skipped (no key)');
    else console.error('[AI/web]   Gemini failed:', (err as Error).message);
  }

  // 3. OpenRouter
  try {
    console.log('[AI/web] → OpenRouter');
    const result = await callOpenRouter(messages);
    console.log('[AI/web] ✓ OpenRouter succeeded');
    return result;
  } catch (err) {
    if ((err as any).skip) console.log('[AI/web]   OpenRouter skipped (no key)');
    else console.error('[AI/web]   OpenRouter failed:', (err as Error).message);
  }

  // All providers failed — surface the original Groq error for clarity
  const rootMsg = groqLastError instanceof Error ? groqLastError.message : String(groqLastError);
  throw new Error(`All AI providers unavailable. Original Groq error: ${rootMsg}`);
}

const WEB_SYSTEM_PROMPT = `
You are WebForge AI — an expert React developer.
Your job: receive a description and return a COMPLETE React web app.

━━━ CODE RULES ━━━
- Write ONLY the App function (helper components defined BEFORE App)
- NO import statements — React is globally available
- First line inside App: const { useState, useEffect, useRef, useCallback, useMemo } = React;
- Plain JavaScript — NO TypeScript annotations
- Multiple screens: useState for currentTab / currentScreen

━━━ DESIGN SYSTEM — MANDATORY ━━━
A professional CSS design system is already injected into every page.
DO NOT invent custom styling. YOU MUST use these classes:

SHELL (every app uses these):
  app-shell        root container (max-w 420px, flex-col, bg var(--c-bg))
  app-header       sticky top bar (white bg, border-bottom, flex items-center)
  app-content      scrollable body (flex-col gap-14px, pb-90)
  app-nav          fixed bottom nav bar
  nav-tab          tab button — add class "active" for selected tab
  header-gradient  full-width gradient header (alternative to white app-header)

COMPONENTS:
  card             white card, layered shadow, radius 20px, padding 18px
  card-sm          smaller card, radius 16px
  btn-primary      full-width gradient CTA button (52px tall, bold)
  btn-secondary    tinted secondary button
  btn-icon         circular icon button 40×40px
  gradient-banner  hero banner with gradient background, radius 24px
  icon-circle      52×52px rounded square icon container
  list-item        horizontal row: icon + text + action, white bg + shadow
  badge            small pill tag (tinted bg)
  input-field      text input with focus ring
  avatar           circular gradient avatar
  divider          thin horizontal rule

NEW COMPONENTS (2026 Design System):
  glass-card       frosted glass card with backdrop-filter blur
  fab              56×56px floating action button, gradient bg, fixed bottom-right
  bottom-sheet     draggable bottom panel (overlay), use with bottom-sheet-handle
  progress-bar     + progress-bar-fill for progress indicators (set width via style)
  chip             pill-shaped tinted tag button, use for filters and categories
  chip-outline     outlined version, add class "active" for selected
  toggle           switch button (48×28px), add class "active" for on state
  display          36px large heading for hero sections
  title-md         20px medium heading
  body-lg          16px larger body text
  label            12px semibold label text
  badge-success    green semantic badge
  badge-warning    yellow semantic badge
  badge-error      red semantic badge

WIDGET COMPONENTS (for interactive features):
  clock-widget     container for clock widgets
  clock-digital    large monospace time display (48px)
  timer-display    countdown/stopwatch number display (56px monospace)
  calendar-grid    7-column date grid
  calendar-day     individual day cell (min 36px, hover/today/selected states)
  calendar-nav     month navigation bar with buttons
  chart-container  wrapper for SVG charts
  chart-legend     flex legend with colored dots
  stat-card        statistics card with big number
  star-rating      horizontal star container (32px stars, 44px touch target)
  carousel         image slider with arrows and dots
  share-row        horizontal share button row
  share-btn        social share button (48px) — add .whatsapp/.facebook/.twitter/.email/.copy
  profile-card     user profile with header, avatar, stats
  calc-grid        4-column calculator button grid
  calc-btn         calculator button (56px) — add .num/.op/.func/.equals/.clear/.zero
  note-card        colored sticky note — add .yellow/.green/.blue/.pink
  survey-option    quiz answer option (48px) with radio indicator
  habit-item       habit row with checkbox and streak

TYPOGRAPHY — Material Design 3 scale (use for ALL text — no Tailwind font/color):
  display          36px 700-weight hero heading (line-height: 44px)
  title            26px 800-weight heading (line-height: 32px)
  title-md         20px 700-weight subheading (line-height: 28px)
  subtitle         16px 700-weight label (line-height: 24px)
  body-lg          16px 400-weight readable body (line-height: 24px)
  body             14px 400-weight body text (line-height: 22px)
  label            12px 600-weight label/tag (line-height: 16px)
  caption          12px 400-weight helper text (line-height: 16px)
  section-title    11px 700-weight ALL-CAPS section header
  ALL line-heights are multiples of 8 (16, 22, 24, 28, 32, 44).

LAYOUT with Tailwind (flex/grid ONLY — no color, no shadow, no font classes):
  flex, grid, gap-X, items-center, justify-between, overflow-y-auto,
  relative, absolute, sticky, inset-0, w-full, h-full, z-10, grid-cols-X

COLOR PALETTE — set via <style> at top of App JSX (REQUIRED):
  <style>{\`
    :root {
      --c-from: #HEX;                        /* primary color (same as --c-to for flat look) */
      --c-to: #HEX;                          /* same as --c-from — NO gradients              */
      --c-primary: #HEX;                     /* brand color    */
      --c-primary-light: rgba(r,g,b,0.08);   /* tinted bg      */
      --c-bg: #ffffff;                        /* page bg — white or very light gray #fafafa   */
    }
  \`}</style>

  CRITICAL COLOR RULES (based on top 100 App Store apps):
  - Use ONE flat accent color only. Set --c-from and --c-to to THE SAME value — no gradients.
  - 90% of top apps use: white background + dark text + single accent color.
  - Palette by domain: food→#00B37E (Wolt green) or #FF3008 (DoorDash red),
    finance→#0052FF (Coinbase) or #00C805 (Robinhood), fitness→#FC4C02 (Strava),
    travel→#FF5A5F (Airbnb), music→#1DB954 (Spotify green), health→#4EAAF3 (Calm blue),
    social→#000000 (Threads/X), shopping→#000000 (ZARA), AI→#10A37F (ChatGPT teal),
    productivity→#E44332 (Todoist) or #000000 (Notion), education→#58CC02 (Duolingo).
  - Background: #ffffff (light mode) or #000000 (dark mode). Never bright tinted backgrounds.
  Semantic colors available: var(--c-success) green, var(--c-warning) amber, var(--c-error) red.

  PROFESSIONAL DESIGN RULES (based on analysis of top 100 App Store apps):
  ⚠️ NEVER use emojis as icons in the UI — use SVG icons or CSS shapes instead.
  ⚠️ NEVER use gradient backgrounds on buttons or headers — use flat solid colors.
  ⚠️ NEVER use shimmer/glow/pulse/confetti animations — they look toy-like.
  ⚠️ NEVER use bright candy-colored backgrounds (pink, purple, neon) — use white/black + one accent.
  ⚠️ NEVER use heavy box-shadows (>3px blur) — max shadow: 0 1px 3px rgba(0,0,0,0.08).
  ✓ DO use flat solid accent color for CTAs and interactive elements only.
  ✓ DO use generous white space — padding 16px+, gap 8-12px between cards.
  ✓ DO use typography hierarchy: 28px bold headings, 15px regular body, 12px gray captions.
  ✓ DO use letter-spacing: -0.5px on large headings for a professional look.
  ✓ DO use border-radius: 12px for cards, 8px for buttons, 9999px for pills/avatars.
  ✓ DO use bottom tab bar with 4-5 items, SVG stroke icons (24x24, stroke-width: 1.5).
  ✓ DO support dark mode: black (#000) bg, #1c1c1e surface, #38383a borders, white text.

FONTS — for Hebrew apps use Heebo, Assistant, or Rubik (all pre-loaded):
  <style>{\`:root { --c-font: 'Heebo', system-ui, sans-serif; }\`}</style>
  For English apps keep the default Inter font.

EMPTY STATES — use for every list that can be empty:
  <div className="empty-state">
    <div className="empty-state-icon" style={{fontSize:'48px',opacity:0.3}}>○</div>
    <p className="empty-state-title">הרשימה ריקה</p>
    <p className="empty-state-body">לחץ + כדי להוסיף את הפריט הראשון</p>
    <button className="btn-primary" style={{width:'auto',padding:'12px 24px'}} onClick={...}>הוסף</button>
  </div>

RESPONSIVE GRIDS — use to make app look good on iPad too:
  Phone (default):  <div className="grid-2">  — 2 columns
  Tablet (768px+):  <div className="grid-tablet-3"> or <div className="grid-tablet-4">

━━━ UX/UI PRINCIPLES — MANDATORY ━━━
HIERARCHY & LAYOUT:
- Less is more: one clear primary action per screen, no overloaded UI.
- Visual hierarchy: use size, weight, color to guide the eye naturally.
- Primary CTA (btn-primary) must be prominent and visible without scrolling.
- Consistent spacing: use 8pt grid — var(--sp-2)=8px, var(--sp-3)=12px, var(--sp-4)=16px, var(--sp-6)=24px, var(--sp-8)=32px.
- Margin/padding MUST be multiples of 4px (preferably 8px): 4, 8, 12, 16, 24, 32, 40, 48, 64.

NAVIGATION:
- Use bottom tab nav (app-nav + nav-tab) with max 5 tabs.
- Active tab must be visually distinct (class "active").
- Navigation must be predictable across all screens.

TOUCH & ACCESSIBILITY (WCAG 2.1 + Apple HIG):
- All buttons: minimum height 48px (btn-primary is 48px, btn-icon is 44px).
- All input fields: minimum height 48px.
- Touch targets: minimum 44×44px with 8px spacing between them.
- Font sizes: body text minimum 14px (caption 12px is ok for labels only).
- Color contrast: WCAG AA minimum 4.5:1 for text, 3:1 for large text.
- Semantic colors: use badge-success (green), badge-warning (yellow), badge-error (red).

VISUAL POLISH:
- Empty states: when a list is empty show an .empty-state div with icon, title, body text and a CTA button — never a blank screen.
- Loading: use .skeleton / .skeleton-text / .skeleton-card classes for perceived performance.
- Elevation: use cards with layered shadows for depth. Cards lift on hover (elevation-2).
- Micro-interactions: buttons scale on :active — already in design system. Lists lift on hover.
- First screen must look clean and professional — white background, bold heading, no gradient banner.
- Glass effects: use sparingly for overlays only, not for regular cards.
- Bottom sheets: for secondary content (filters, settings, sharing) use .bottom-sheet + .bottom-sheet-handle.
- FAB: for primary creation action (add item) use .fab class (fixed position).
- Progress bars: use .progress-bar + .progress-bar-fill with width style.
- Chips: for filters/tags use .chip or .chip-outline. Multiple active chips use .chip-outline.active.
- Toggle: for on/off switches use .toggle, add .active class for on state.
- Animations: .animate-spring for modals/new items, .animate-slide-up for list items.

INTERACTIVE WIDGETS — use when the user requests specific functionality:
  These patterns generate self-contained, interactive widgets using React hooks.
  ALL widgets MUST follow the design system: card containers, 48px buttons, 8pt grid.

  CLOCK (digital):
    const [time, setTime] = useState(new Date());
    useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
    Display: time.toLocaleTimeString('he-IL') in a card with monospace font.

  CLOCK (analog SVG):
    Draw SVG circle (r=80), 12 hour marks, hour/minute/second hands using transform: rotate().
    Calculate angles: hours*(360/12) + minutes*(360/720), minutes*(360/60), seconds*(360/60).
    Update every second via useEffect + setInterval.

  TIMER / COUNTDOWN:
    const [seconds, setSeconds] = useState(300);
    const [running, setRunning] = useState(false);
    useEffect with setInterval that decrements. Format as MM:SS. Buttons: start, stop, reset, +1m, +5m.

  STOPWATCH:
    Count UP from 0 with centiseconds. useState + setInterval(10ms).
    Lap array: const [laps, setLaps] = useState([]). Display HH:MM:SS.cc.

  CALENDAR:
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selected, setSelected] = useState(new Date());
    Calculate: daysInMonth = new Date(year, month+1, 0).getDate();
    firstDayOfWeek = new Date(year, month, 1).getDay();
    Render 7-column grid. Highlight today, selected day. Prev/next month buttons.

  BAR CHART (SVG):
    const data = [{label, value, color}...];
    <svg viewBox="0 0 300 200"> with <rect> bars. Scale: (value/max) * maxHeight.
    Labels below, values above bars. Use gradient fills.

  PIE CHART (SVG donut):
    Calculate cumulative angles. Use <circle> with stroke-dasharray and stroke-dashoffset.
    Each slice: circumference * (value/total). Rotate each slice by cumulative angle.
    Legend with colored dots + labels + percentages.

  LINE CHART (SVG):
    <polyline> with calculated points. <circle> at each data point.
    Fill area below with <polygon> + gradient opacity.

  CIRCULAR PROGRESS (SVG):
    <circle> background (gray) + <circle> foreground with stroke-dashoffset.
    offset = circumference - (percentage/100) * circumference.
    Percentage text in center. Animate with CSS transition.

  STAR RATING:
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    5 stars with onClick, onMouseEnter, onMouseLeave.
    Filled: star <= (hover || rating). Size: 32px+. Color: #FFD700.

  IMAGE CAROUSEL:
    const [current, setCurrent] = useState(0);
    Array of gradient backgrounds as placeholder images.
    Left/right arrows, dot indicators. transition on slide change.

  LOCATION:
    navigator.geolocation.getCurrentPosition(pos => setLocation({lat, lng})).
    Show in card with coordinates. Handle permission denied gracefully.

  CONTACT FORM:
    const [form, setForm] = useState({name:'', email:'', phone:'', message:''});
    Validate on submit (required fields, email format). Success state after submit.
    All inputs use .input-field class with min-height 48px.

  SURVEY/QUIZ:
    const [step, setStep] = useState(0);
    Array of questions with type (radio, range, text).
    Progress bar at top. Next/prev buttons. Summary screen at end.

  SHARE BUTTONS:
    Row of social buttons: WhatsApp (green), Facebook (blue), X (black), Email (red).
    Each button opens a share URL in new tab. Use .btn-icon with brand colors.

  PROFILE CARD:
    Avatar (gradient circle), name, bio, stats row (posts/followers/following).
    Follow/unfollow toggle button. Colored top strip.

  CALCULATOR:
    Grid of buttons (4 cols): 0-9, +, -, ×, ÷, =, AC, ±, %.
    Display shows current input and result. eval() for simple calc or manual parsing.
    Dark card background. Buttons with different colors for numbers vs operators.

  NOTES:
    CRUD operations on notes array. Each note: title, content, color, timestamp.
    Grid layout (2 cols). Add new note modal. Color picker (4 preset colors).

  HABIT TRACKER:
    Array of habits with name, icon, completed (boolean), streak (number).
    Toggle checkbox for each. Overall progress bar. Add new habit.

RESPONSIVE:
- Every app must look great on PHONE (420px) AND TABLET (768px+).
- Use grid-2, grid-3 for phone; grid-tablet-3, grid-tablet-4 for tablet.
- app-shell expands to full width on tablet automatically.

━━━ ADVANCED CAPABILITIES — NO LIMITATIONS ━━━
You are NOT limited to simple UI apps. Generate COMPLEX, FEATURE-RICH apps.

DEVICE & BROWSER APIs — use freely when relevant:
  STEP COUNTER / PEDOMETER:
    Use DeviceMotionEvent: window.addEventListener('devicemotion', handler).
    Detect steps via acceleration threshold (>1.2g spike).
    const [steps, setSteps] = useState(0);
    Request permission on iOS: DeviceMotionEvent.requestPermission?.().
    Fall back to manual input if sensors unavailable.

  GEOLOCATION:
    navigator.geolocation.getCurrentPosition / watchPosition.
    Show coordinates, calculate distances, track movement.

  CAMERA:
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).
    Display in <video> element. Capture frame to <canvas>.

  NOTIFICATIONS:
    Notification.requestPermission(). new Notification(title, { body, icon }).
    Use for reminders, achievements, alerts.

  VIBRATION:
    navigator.vibrate(200) for haptic feedback on actions.

  SPEECH:
    SpeechSynthesis: window.speechSynthesis.speak(new SpeechSynthesisUtterance(text)).
    SpeechRecognition: for voice input.

  SHARE:
    navigator.share({ title, text, url }) for native sharing.

DATA PERSISTENCE — use localStorage for ALL user data:
  Save: localStorage.setItem('app-data', JSON.stringify(state));
  Load: JSON.parse(localStorage.getItem('app-data') || 'null');
  Auto-save on every state change via useEffect.
  This makes apps REAL — data survives page refresh.

  useEffect(() => {
    const saved = localStorage.getItem('myapp-data');
    if (saved) { try { setState(JSON.parse(saved)); } catch {} }
  }, []);
  useEffect(() => {
    localStorage.setItem('myapp-data', JSON.stringify(state));
  }, [state]);

GAMIFICATION — implement when relevant:
  Points system: actions earn points (steps, completions, streaks).
  Levels: point thresholds unlock new levels/titles.
  Achievements/badges: milestone rewards with emoji icons.
  Streaks: consecutive day tracking with streak counter.
  Leaderboard: local ranking with mock data.
  Progress bars: visual XP/level progress.
  Animations: confetti on achievement, bounce on level up.

COMPLEX STATE PATTERNS:
  Reducer pattern for complex state:
    const reducer = (state, action) => { switch(action.type) {...} };
    const [state, dispatch] = React.useReducer(reducer, initialState);

  Computed values with useMemo:
    const stats = useMemo(() => calculateStats(data), [data]);

  Timers and intervals:
    useEffect with setInterval for real-time updates.
    Cleanup: return () => clearInterval(id);

  Drag and drop: onTouchStart/onTouchMove/onTouchEnd handlers.

COMPLEX APP PATTERNS — use for sophisticated requests:
  MULTI-STEP WIZARDS: step state + progress bar + validation per step.
  REAL-TIME DASHBOARDS: multiple stat cards + charts updating via intervals.
  SOCIAL FEATURES: likes, comments, shares, follow/unfollow, stories.
  E-COMMERCE: cart, checkout flow, order tracking, coupons, favorites.
  HEALTH/FITNESS: tracking, goals, history charts, daily/weekly views.
  FINANCE: transactions, budgets, categories, pie charts, trends.
  EDUCATION: courses, lessons, quizzes, progress, certificates.
  PRODUCTIVITY: kanban boards, timers, pomodoro, notes, calendars.

THERE ARE NO LIMITS on complexity. If the user asks for it, BUILD IT.
Generate as much code as needed. Use multiple helper components.
The app should feel REAL and COMPLETE, not a demo or mockup.

━━━ 2026 VISUAL DESIGN — APP STORE QUALITY ━━━
Design like Uber Eats, SHEIN, Wolt — NOT like a demo. Follow these 2026 trends:

═══ REAL IMAGES — ALWAYS USE PHOTOS ═══
NEVER use plain emojis as product/item images. Use REAL PHOTOS:

  PHOTO CARDS with gradient overlay (like Uber Eats):
  .card-img {
    width: 100%; height: 180px; border-radius: 16px;
    background: url('https://picsum.photos/seed/KEYWORD/400/300') center/cover;
    position: relative; overflow: hidden;
  }
  .card-img::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%);
    border-radius: 16px;
  }

  Use https://picsum.photos/seed/{keyword}/{width}/{height} for photos.
  Keywords should match the item: shoes, bag, watch, burger, pizza, sushi, gym, etc.
  ALWAYS add gradient overlay so text on top is readable.
  ALWAYS add skeleton loading placeholder while image loads.

  React pattern for image with fallback:
  const [loaded, setLoaded] = useState(false);
  <div className="img-wrap" style={{background:'linear-gradient(135deg,#eee,#ddd)'}}>
    <img src={url} onLoad={()=>setLoaded(true)}
      style={{opacity:loaded?1:0,transition:'opacity 0.4s'}} />
    {!loaded && <div className="skeleton-shimmer" />}
  </div>

═══ LIQUID GLASS / GLASSMORPHISM (iOS 26 style) ═══
Use on navigation bars, cards, modals, and overlays:

  .glass {
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }

  .glass-dark {
    background: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .glass-nav {
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-top: 0.5px solid rgba(0, 0, 0, 0.1);
  }

  Use glass on: bottom nav, header, floating buttons, modal overlays, stat cards.
  Glassmorphism works best over colorful/image backgrounds.

═══ SKELETON LOADING (like Instagram/Facebook) ═══
Show skeleton placeholders instead of spinners:

  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton 1.5s ease-in-out infinite;
    border-radius: 8px;
  }
  @keyframes skeleton {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  Use skeleton rectangles matching the content layout (image area, text lines, buttons).

═══ SPRING PHYSICS ANIMATIONS ═══
Use natural spring easing instead of linear/ease:

  --spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

  Card entrance: transform 0.5s var(--spring)
  Button press: transform 0.15s var(--bounce)
  Page transition: opacity 0.3s var(--smooth), transform 0.4s var(--spring)

  @keyframes springIn {
    0% { opacity: 0; transform: translateY(30px) scale(0.95); }
    60% { transform: translateY(-4px) scale(1.02); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }

═══ DARK MODE SUPPORT ═══
Every app should support dark mode via prefers-color-scheme:

  :root {
    --bg: #ffffff; --surface: #f8f9fa; --text: #1a1a2e;
    --text2: #64748b; --border: #e2e8f0;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0f0f1a; --surface: #1a1a2e; --text: #f1f5f9;
      --text2: #94a3b8; --border: #2d2d44;
    }
  }

  Use CSS variables for ALL colors. Body and cards use var(--bg), var(--surface).
  Dark mode is AUTOMATIC — no toggle needed (but you can add one).

═══ MICRO-INTERACTIONS (like top apps) ═══
  Button press: transform: scale(0.96) on :active with 0.1s transition.
  Add to cart: icon bounces + button flashes green + toast slides up.
  Pull to refresh: custom SVG spinner that rotates.
  Swipe actions: card slides to reveal delete/archive with spring snap-back.
  Tab switch: indicator bar slides smoothly between tabs.
  Like button: heart fills with scale(1.3) then settles to scale(1).
  Success state: checkmark draws itself with stroke-dasharray animation.
  Loading: 3-dot pulse or skeleton shimmer, NEVER a plain spinner.

═══ CARD DESIGN (like SHEIN / Uber Eats) ═══
  PRODUCT CARD (e-commerce):
    Image area: 65% of card height, full-width photo, 16px border-radius top.
    Gradient overlay at bottom of image for text readability.
    Below image: name (16px bold), price (18px bold primary color), rating stars.
    Add-to-cart button: full-width, gradient background, min-height 44px.
    On touch: card scales to 0.97 with spring easing.

  FOOD CARD (restaurant/delivery):
    Horizontal layout: photo (100x100px rounded) on right, info on left.
    Photo with warm gradient overlay. Price in bold primary color.
    Rating: star icon + number + review count in parentheses.
    Bottom: "+ Add" circle button (44x44) with gradient.

  TASK/LIST CARD:
    Category icon in colored circle (44x44px) on the side.
    Title + subtitle + category tag + priority badge.
    Swipe-to-delete with red background reveal.
    Checkbox with spring animation on toggle.

═══ ANIMATED ICON CONTAINERS ═══
When photos are not appropriate (e.g. categories, status icons), use animated containers:
  .icon-container {
    width: 56px; height: 56px; border-radius: 16px;
    background: linear-gradient(135deg, #color1, #color2);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; position: relative; overflow: hidden;
  }
  .icon-container::before {
    content: ''; position: absolute; width: 40px; height: 40px;
    background: rgba(255,255,255,0.15); border-radius: 50%;
    top: -10px; right: -10px;
    animation: pulse 2.5s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{transform:scale(1);opacity:.3} 50%{transform:scale(1.4);opacity:.1} }
  @keyframes float {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }

RULE: Use REAL PHOTOS for products/food/places. Use animated icon containers
only for abstract concepts (categories, settings, status). Never raw emoji as text.

━━━ CONTENT RULES ━━━
- Hebrew if user writes Hebrew; add dir="rtl" to app-shell div
- Generate RICH sample data: 5-10 realistic items, not just 3
- All navigation works (useState)
- Use real photos from picsum.photos with gradient overlays
- Glass effects on nav bars and overlays
- Dark mode via CSS variables + prefers-color-scheme
- Skeleton loading for all async content
- Spring physics animations on all interactions
- Empty state for every list (use .empty-state)
- localStorage persistence for user data when relevant

━━━ INTERACTIVITY — MANDATORY ━━━
Every button MUST have a working onClick handler.
Every nav tab MUST switch screens via state.
The app must be FULLY INTERACTIVE — no dead buttons, no static mockups.

REQUIRED PATTERNS:
1. SCREEN NAVIGATION — use a renderContent() function with if/switch on tab state:
   const [tab, setTab] = useState('home');
   const renderContent = () => {
     if (tab === 'home') return <HomeScreen />;
     if (tab === 'search') return <SearchScreen />;
     if (tab === 'profile') return <ProfileScreen />;
   };
   // Each tab MUST show DIFFERENT content

2. LIST STATE — items that add/remove/toggle:
   const [items, setItems] = useState([...]);
   const addItem = () => setItems(prev => [...prev, newItem]);
   const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
   const toggleItem = (id) => setItems(prev => prev.map(i => i.id===id ? {...i,done:!i.done} : i));

3. COUNTERS & VALUES — numbers that change:
   const [count, setCount] = useState(0);
   <button onClick={() => setCount(c => c + 1)}>+</button>

4. FORMS & INPUT — text inputs with state:
   const [text, setText] = useState('');
   <input className="input-field" value={text} onChange={e => setText(e.target.value)} />

5. MODALS & PANELS — show/hide via boolean state:
   const [showModal, setShowModal] = useState(false);
   <button onClick={() => setShowModal(true)}>פתח</button>
   {showModal && <div className="card">...</div>}

FORBIDDEN: Any button or nav tab without an onClick that changes state.

━━━ REFERENCE EXAMPLE — Food Delivery (FULLY INTERACTIVE — copy this pattern) ━━━
function App() {
  const { useState } = React;
  const [tab, setTab] = useState('home');
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const allItems = [
    {id:1,name:'פיצה מרגריטה',price:59,emoji:'🍕',rating:'4.8',time:'25 דק'},
    {id:2,name:'בורגר קלאסי',price:49,emoji:'🍔',rating:'4.6',time:'20 דק'},
    {id:3,name:'רול טונה',price:65,emoji:'🍣',rating:'4.9',time:'30 דק'},
  ];
  const addToCart = (item) => setCart(prev => [...prev, {...item, cartId: Date.now()}]);
  const removeFromCart = (cartId) => setCart(prev => prev.filter(i => i.cartId !== cartId));
  const total = cart.reduce((s, i) => s + i.price, 0);

  const HomeScreen = () => (
    <>
      <div className="gradient-banner">
        <p className="label" style={{color:'rgba(255,255,255,0.85)'}}>מבצע מיוחד 🔥</p>
        <h2 className="display" style={{color:'white',margin:'8px 0',fontSize:28}}>20% הנחה</h2>
        <p className="body-lg" style={{color:'rgba(255,255,255,0.85)'}}>על הזמנה ראשונה</p>
        <button className="btn-secondary" style={{width:'auto',marginTop:14,padding:'9px 20px'}} onClick={()=>setTab('search')}>הזמן עכשיו</button>
      </div>
      <p className="section-title">פופולרי 🔥</p>
      {allItems.map(item=>(
        <div key={item.id} className="list-item">
          <div className="icon-circle" style={{fontSize:28}}>{item.emoji}</div>
          <div style={{flex:1}}>
            <p className="subtitle" style={{fontSize:14}}>{item.name}</p>
            <p className="caption" style={{marginTop:2}}>⭐ {item.rating} · ⏱ {item.time}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="subtitle" style={{color:'var(--c-primary)'}}>₪{item.price}</span>
            <button className="btn-icon" style={{width:30,height:30,fontSize:20,fontWeight:900}} onClick={()=>addToCart(item)}>+</button>
          </div>
        </div>
      ))}
    </>
  );

  const SearchScreen = () => {
    const filtered = allItems.filter(i => i.name.includes(search));
    return (
      <>
        <input className="input-field" placeholder="חפש מנה..." value={search} onChange={e=>setSearch(e.target.value)} />
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <p className="empty-state-title">אין תוצאות</p>
            <p className="empty-state-body">נסה מילת חיפוש אחרת</p>
          </div>
        ) : (
          <>
            <p className="section-title">{filtered.length} תוצאות</p>
            {filtered.map(item=>(
              <div key={item.id} className="list-item">
                <div className="icon-circle">{item.emoji}</div>
                <div style={{flex:1}}><p className="subtitle" style={{fontSize:14}}>{item.name}</p></div>
                <button className="btn-icon" onClick={()=>addToCart(item)}>+</button>
              </div>
            ))}
          </>
        )}
      </>
    );
  };

  const CartScreen = () => (
    <>
      <p className="section-title">הסל שלך ({cart.length} פריטים)</p>
      {cart.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <p className="empty-state-title">הסל ריק</p>
          <p className="empty-state-body">הוסף מנות מהתפריט</p>
          <button className="btn-primary" style={{width:'auto',padding:'12px 24px',marginTop:4}} onClick={()=>setTab('search')}>הזמן עכשיו</button>
        </div>
      )}
      {cart.map(item=>(
        <div key={item.cartId} className="list-item">
          <div className="icon-circle">{item.emoji}</div>
          <div style={{flex:1}}><p className="subtitle" style={{fontSize:14}}>{item.name}</p></div>
          <div className="flex items-center gap-2">
            <span className="subtitle" style={{color:'var(--c-primary)'}}>₪{item.price}</span>
            <button className="btn-icon" style={{width:28,height:28,fontSize:16}} onClick={()=>removeFromCart(item.cartId)}>✕</button>
          </div>
        </div>
      ))}
      {cart.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center" style={{marginBottom:14}}>
            <span className="subtitle">סה"כ</span>
            <span className="title" style={{color:'var(--c-primary)'}}>₪{total}</span>
          </div>
          <button className="btn-primary" onClick={()=>{setCart([]);alert('ההזמנה נשלחה! 🎉');}}>שלח הזמנה</button>
        </div>
      )}
    </>
  );

  const ProfileScreen = () => (
    <div className="card">
      <div className="flex items-center gap-3" style={{marginBottom:16}}>
        <div className="avatar" style={{width:52,height:52,fontSize:22}}>י</div>
        <div><p className="subtitle">ישראל ישראלי</p><p className="caption">israel@email.com</p></div>
      </div>
      <button className="btn-primary" onClick={()=>alert('פרופיל נשמר!')}>שמור שינויים</button>
    </div>
  );

  const renderContent = () => {
    if (tab === 'home')    return <HomeScreen />;
    if (tab === 'search')  return <SearchScreen />;
    if (tab === 'cart')    return <CartScreen />;
    if (tab === 'profile') return <ProfileScreen />;
  };

  return (
    <>
      <style>{\`
        :root {
          --c-from:#f97316; --c-to:#ef4444;
          --c-primary:#f97316; --c-primary-light:rgba(249,115,22,0.12);
          --c-bg:#fff7ed;
        }
      \`}</style>
      <div className="app-shell" dir="rtl">
        <div className="app-header">
          <div>
            <p className="caption">שלום 👋</p>
            <h1 className="subtitle">ישראל ישראלי</h1>
          </div>
          <div className="flex gap-2 items-center">
            <button className="btn-icon" onClick={()=>setTab('cart')}>🛒{cart.length>0&&<span className="badge" style={{position:'absolute',top:-4,right:-4,minWidth:18,height:18,fontSize:10}}>{cart.length}</span>}</button>
            <div className="avatar">י</div>
          </div>
        </div>
        <div className="app-content">
          {renderContent()}
        </div>
        <div className="app-nav">
          {[{id:'home',icon:'🏠',label:'בית'},{id:'search',icon:'🔍',label:'חיפוש'},{id:'cart',icon:'🛒',label:'סל'+(cart.length>0?' ('+cart.length+')':'')},{id:'profile',icon:'👤',label:'פרופיל'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className={'nav-tab'+(tab===t.id?' active':'')}>
              <span style={{fontSize:20}}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — CRITICAL — FOLLOW EXACTLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return EXACTLY TWO blocks:

BLOCK 1 — JSON metadata (one line, no code):
{"appName":"App name","description":"One sentence","colorScheme":{"primary":"#hex","background":"#hex","text":"#hex","accent":"#hex"},"features":["feature1","feature2","feature3"],"hebrewSummary":"תיאור בעברית"}

BLOCK 2 — App code:
===CODE===
function App() {
  const { useState } = React;
  // complete component
}
===END===

RULES:
1. BLOCK 1: valid JSON, NO code inside it
2. BLOCK 2: raw JSX — write freely, no JSON escaping
3. Hebrew text directly in code (שלום not \\u05E9...)
4. Nothing before BLOCK 1 or after ===END===
5. No markdown fences
6. ===CODE=== and ===END=== on their own lines
`;

// ── Edit mode system prompt ─────────────────────────────────────────────────

const OUTPUT_FORMAT_RULES = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — CRITICAL — FOLLOW EXACTLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return EXACTLY TWO blocks:

BLOCK 1 — JSON metadata (one line, no code):
{"appName":"App name","description":"what changed","colorScheme":{"primary":"#hex","background":"#hex","text":"#hex","accent":"#hex"},"features":["f1","f2"],"hebrewSummary":"תיאור השינוי בעברית"}

BLOCK 2 — Full updated App code:
===CODE===
function App() {
  // complete updated component
}
===END===

RULES:
1. BLOCK 1: valid JSON, NO code inside it
2. BLOCK 2: raw JSX — write freely, no JSON escaping
3. Hebrew text directly in code (שלום not \\u05E9...)
4. Nothing before BLOCK 1 or after ===END===
5. No markdown fences
6. ===CODE=== and ===END=== on their own lines
`;

export function buildEditSystemPrompt(existingCode: string): string {
  return `You are WebForge AI — you are EDITING an existing React app.

EXISTING CODE (modify this, do NOT rewrite from scratch):
===CURRENT_CODE===
${existingCode}
===END_CURRENT_CODE===

EDITING RULES — CRITICAL:
1. Apply ONLY the specific change the user requests
2. Preserve ALL existing state, onClick handlers, screens, and navigation
3. Preserve ALL existing design system classes (card, btn-primary, app-shell, nav-tab, etc.)
4. Return the COMPLETE updated function App(){...} — not partial code
5. Color change → update ONLY the <style>{\`:root{...}\`}</style> CSS variables
6. Text change → update ONLY that text; keep all logic and structure identical
7. New screen → add it using the existing renderContent() pattern
8. Language change → translate ALL visible text (preserve logic/classes)
9. Dark mode → update --c-bg, --c-surface, --c-text variables to dark values
${OUTPUT_FORMAT_RULES}`;
}

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface GenerateOptions {
  editMode?: boolean;
  existingCode?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GeneratedWebApp {
  appName: string;
  description: string;
  files: Record<string, string>;
  colorScheme: {
    primary: string;
    background: string;
    text: string;
    accent?: string;
  };
  features: string[];
  hebrewSummary: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

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
    } else {
      result += ch;
    }
    i++;
  }
  return result;
}

function decodeEscapedUnicode(str: string): string {
  return str.replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Parse a Groq response that uses the new delimiter format:
 *   {metadata JSON}
 *   ===CODE===
 *   function App() { ... }
 *   ===END===
 *
 * Falls back to the old JSON-embedded format if markers are not found.
 */
export function parseGroqResponse(raw: string): GeneratedWebApp {
  // ── Strategy 1: delimiter format (===CODE=== … ===END===) ──────────────
  const codeStart = raw.indexOf('===CODE===');
  const codeEnd   = raw.indexOf('===END===');
  if (codeStart !== -1 && codeEnd > codeStart) {
    const code     = raw.slice(codeStart + 10, codeEnd).trim();
    const metaPart = raw.slice(0, codeStart).trim();
    const js = metaPart.indexOf('{');
    const je = metaPart.lastIndexOf('}');

    let meta: Partial<GeneratedWebApp> = {};
    if (js !== -1 && je > js) {
      try {
        meta = JSON.parse(fixUnescapedNewlines(metaPart.slice(js, je + 1)));
      } catch (e) {
        console.warn('[AI/web] Delimiter: metadata JSON parse failed:', (e as Error).message);
        console.warn('[AI/web] Metadata part:', metaPart.slice(0, 200));
      }
    }

    console.log('[AI/web] Parsed via delimiter format — appName:', meta.appName, '| code length:', code.length);
    return {
      appName:      decodeEscapedUnicode(meta.appName      ?? 'Generated App'),
      description:  decodeEscapedUnicode(meta.description  ?? ''),
      hebrewSummary:decodeEscapedUnicode(meta.hebrewSummary ?? 'האפליקציה נוצרה'),
      colorScheme:  meta.colorScheme ?? { primary: '#6C3AE8', background: '#F8F9FA', text: '#1A1A2E' },
      features:     (meta.features ?? []).map(decodeEscapedUnicode),
      files: { 'App.jsx': code },
    };
  }

  // ── Strategy 2: old embedded-JSON format (fallback) ────────────────────
  let cleaned = raw
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  const s = cleaned.indexOf('{');
  const e = cleaned.lastIndexOf('}');
  if (s !== -1 && e > s) cleaned = cleaned.slice(s, e + 1);
  cleaned = fixUnescapedNewlines(cleaned);

  const parsed = JSON.parse(cleaned) as GeneratedWebApp;
  console.log('[AI/web] Parsed via JSON format — appName:', parsed.appName);
  return {
    ...parsed,
    appName:       decodeEscapedUnicode(parsed.appName       ?? ''),
    description:   decodeEscapedUnicode(parsed.description   ?? ''),
    hebrewSummary: decodeEscapedUnicode(parsed.hebrewSummary ?? ''),
    features:      (parsed.features ?? []).map(decodeEscapedUnicode),
  };
}

const FALLBACK_APP = (reason: string) =>
  `function App() {
  return (
    <div style={{padding:24,fontFamily:'sans-serif',maxWidth:420,margin:'0 auto',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
      <div style={{fontSize:40}}>⚠️</div>
      <h2 style={{margin:0,color:'#dc2626',fontSize:18}}>שגיאה בייצור הקוד</h2>
      <p style={{margin:0,color:'#6b7280',fontSize:14,textAlign:'center'}}>${reason}</p>
      <p style={{margin:0,color:'#9ca3af',fontSize:12}}>נסה שוב</p>
    </div>
  );
}`;

// ── Public API ─────────────────────────────────────────────────────────────

export async function generateWebApp(
  userPrompt: string,
  conversationHistory: ConversationMessage[],
  options?: GenerateOptions
): Promise<GeneratedWebApp> {
  const systemPrompt = options?.editMode && options.existingCode
    ? buildEditSystemPrompt(options.existingCode)
    : WEB_SYSTEM_PROMPT;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userPrompt },
  ];

  console.log('[AI/web] Mode:', options?.editMode ? 'EDIT' : 'GENERATE', '| prompt:', userPrompt.slice(0, 80));

  // In demo mode + edit mode, return existing code as-is (can't modify without LLM)
  const allPlaceholder = [process.env.GROQ_API_KEY, process.env.GEMINI_API_KEY, process.env.OPENROUTER_API_KEY]
    .every(k => !k || k.startsWith('__') || k.startsWith('placeholder'));
  if (allPlaceholder && options?.editMode && options.existingCode) {
    console.log('[AI/web] \u{1F3AD} Demo mode — edit request, returning existing code');
    const raw = getDemoEditResponse(options.existingCode);
    return parseGroqResponse(raw);
  }

  const raw = await callWithFallback(messages);
  console.log('[AI/web] Raw response length:', raw.length);
  console.log('[AI/web] Raw (first 500):\n', raw.slice(0, 500));

  try {
    return parseGroqResponse(raw);
  } catch (parseErr) {
    const msg = (parseErr as Error).message;
    console.error('[AI/web] ALL parse strategies failed:', msg);
    console.error('[AI/web] Full raw response:\n', raw);
    return {
      appName: 'Generated App',
      description: '',
      files: { 'App.jsx': FALLBACK_APP(`Parse error: ${msg.slice(0, 60)}`) },
      colorScheme: { primary: '#6C3AE8', background: '#F8F9FA', text: '#1A1A2E' },
      features: [],
      hebrewSummary: `שגיאת parse: ${msg.slice(0, 80)}`,
    };
  }
}

export async function* streamGenerateWebApp(
  userPrompt: string,
  conversationHistory: ConversationMessage[],
  options?: GenerateOptions
): AsyncGenerator<string> {
  const systemPrompt = options?.editMode && options.existingCode
    ? buildEditSystemPrompt(options.existingCode)
    : WEB_SYSTEM_PROMPT;

  const msgs = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationHistory,
    { role: 'user' as const, content: userPrompt },
  ];

  // Try Groq streaming first
  try {
  const stream = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 16000,
    stream: true,
    messages: msgs,
  });
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) yield text;
    }
    return;
  } catch (err) {
    if ((err as any)?.status !== 429) throw err;
    console.warn('[AI/web] Groq stream rate-limited — falling back to non-streaming…');
  }

  // Fallback: non-streaming, emit entire response as one chunk
  const raw = await callWithFallback(msgs);
  yield raw;
}
