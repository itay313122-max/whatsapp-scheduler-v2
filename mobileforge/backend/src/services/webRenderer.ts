/**
 * Wraps a React App() component function in a complete, self-contained HTML
 * document that runs in an iframe via srcDoc.
 *
 * CDN stack: React 18 + ReactDOM + Babel Standalone + Tailwind (layout) +
 *            MobileForge Design System (injected CSS)
 */

/** Pre-built design system — injected into every generated app.
 *  AI only needs to set CSS variable palette and use class names. */
const DESIGN_SYSTEM_CSS = `
/* ── MobileForge Design System ─────────────────────────────────────────── */

/* Default palette — AI overrides these by adding a <style> tag inside App() JSX */
:root {
  --c-from:          #6366f1;
  --c-to:            #8b5cf6;
  --c-primary:       #6366f1;
  --c-primary-light: rgba(99,102,241,0.12);
  --c-bg:            #f8fafc;
  --c-surface:       #ffffff;
  --c-border:        #e2e8f0;
  --c-text:          #0f172a;
  --c-text-2:        #475569;
  --c-text-3:        #94a3b8;
  --r-sm: 12px; --r-md: 16px; --r-lg: 20px; --r-xl: 24px;
  /* Typography — overrideable by quick-edit panel */
  --c-font:           'Inter', system-ui, -apple-system, sans-serif;
  --c-text-size:      14px;
  /* Buttons — overrideable by quick-edit panel */
  --btn-radius:       var(--r-md);
  --btn-bg:           linear-gradient(135deg, var(--c-from), var(--c-to));
  --btn-color:        #ffffff;
  --btn-border-width: 0px;
  --btn-border-color: transparent;
  --btn-shadow:       0 4px 14px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1);
  /* Cards — overrideable by quick-edit panel */
  --card-radius:      var(--r-lg);
  --card-bg:          var(--c-surface);
  --card-shadow:      0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06);
  --card-border:      none;
  /* Spacing scale */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px;
  --sp-5: 20px; --sp-6: 24px; --sp-7: 28px; --sp-8: 32px;
  --sp-9: 36px; --sp-10: 40px; --sp-12: 48px; --sp-16: 64px;
  /* Elevation shadows (Material Design 3) */
  --elevation-1: 0 1px 2px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1);
  --elevation-2: 0 2px 4px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.1);
  --elevation-3: 0 4px 8px rgba(0,0,0,0.06), 0 8px 16px rgba(0,0,0,0.1);
  --elevation-4: 0 8px 16px rgba(0,0,0,0.08), 0 16px 32px rgba(0,0,0,0.12);
  /* Motion tokens */
  --duration-micro: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-decelerate: cubic-bezier(0, 0, 0, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  /* Semantic colors */
  --c-success: #22c55e;
  --c-success-light: rgba(34,197,94,0.12);
  --c-warning: #f59e0b;
  --c-warning-light: rgba(245,158,11,0.12);
  --c-error: #ef4444;
  --c-error-light: rgba(239,68,68,0.12);
}

/* Reset */
*,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: var(--c-font);
  font-size: var(--c-text-size);
  background: var(--c-bg); color: var(--c-text);
  -webkit-font-smoothing: antialiased;
}

/* ── Shell ─────────────────────────────────────────────────────────────── */
.app-shell {
  max-width: 420px; margin: 0 auto;
  min-height: 100vh; background: var(--c-bg);
  display: flex; flex-direction: column;
  overflow: hidden; position: relative;
}
.app-header {
  position: sticky; top: 0; z-index: 10;
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  /* Safe area: clear the notch / Dynamic Island on real phones */
  padding: calc(14px + env(safe-area-inset-top, 0px)) calc(20px + env(safe-area-inset-right, 0px)) 14px calc(20px + env(safe-area-inset-left, 0px));
  display: flex; align-items: center; justify-content: space-between;
}
.app-content {
  flex: 1; overflow-y: auto;
  padding: 16px; padding-left: calc(16px + env(safe-area-inset-left, 0px)); padding-right: calc(16px + env(safe-area-inset-right, 0px));
  /* Clear the fixed bottom nav + home indicator */
  padding-bottom: calc(90px + env(safe-area-inset-bottom, 0px));
  display: flex; flex-direction: column; gap: 14px;
}
.app-nav {
  position: fixed; bottom: 0;
  left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 420px;
  background: var(--c-surface);
  border-top: 1px solid var(--c-border);
  display: flex; z-index: 100;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
  /* Safe area: lift tabs above the home indicator */
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.header-gradient {
  background: linear-gradient(135deg, var(--c-from), var(--c-to));
  color: #fff;
  /* Safe area: gradient hero also clears the notch */
  padding: calc(18px + env(safe-area-inset-top, 0px)) calc(20px + env(safe-area-inset-right, 0px)) 18px calc(20px + env(safe-area-inset-left, 0px));
}

/* ── Nav tabs ──────────────────────────────────────────────────────────── */
.nav-tab {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 10px 0 8px; gap: 3px;
  font-size: 11px; font-weight: 500; color: var(--c-text-3);
  border: none; background: none; cursor: pointer;
  transition: color 0.15s;
}
.nav-tab.active { color: var(--c-primary); font-weight: 700; }

/* ── Buttons ───────────────────────────────────────────────────────────── */
.btn-primary {
  display: inline-flex; align-items: center; justify-content: center;
  width: 100%; padding: 15px 24px; min-height: 48px;
  background: var(--btn-bg); color: var(--btn-color);
  font-weight: 700; font-size: 15px; font-family: inherit;
  border-radius: var(--btn-radius);
  border: var(--btn-border-width) solid var(--btn-border-color);
  cursor: pointer; box-shadow: var(--btn-shadow);
  transition: transform var(--duration-fast) var(--ease-standard), opacity var(--duration-fast), box-shadow var(--duration-normal); letter-spacing: 0.1px;
}
.btn-primary:hover  { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,0.22); }
.btn-primary:active { transform: scale(0.97); }

.btn-secondary {
  display: inline-flex; align-items: center; justify-content: center;
  width: 100%; padding: 13px 20px;
  background: var(--c-primary-light); color: var(--c-primary);
  font-weight: 600; font-size: 14px; font-family: inherit;
  border-radius: var(--r-md); border: none; cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-standard), filter var(--duration-fast);
  min-height: 48px;
}
.btn-secondary:active { transform: scale(0.97); }

.btn-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  background: var(--c-primary-light); color: var(--c-primary);
  font-size: 18px; border: none; cursor: pointer;
  transition: transform var(--duration-micro) var(--ease-spring);
}
.btn-icon:active { transform: scale(0.9); }

/* ── Cards ─────────────────────────────────────────────────────────────── */
.card {
  background: var(--card-bg); border-radius: var(--card-radius); padding: var(--sp-4);
  box-shadow: var(--card-shadow); border: var(--card-border);
  transition: box-shadow var(--duration-normal) var(--ease-standard), transform var(--duration-normal) var(--ease-standard);
}
.card:active { transform: scale(0.98); }
.card-sm {
  background: var(--card-bg); border-radius: var(--r-md); padding: var(--sp-3);
  box-shadow: var(--elevation-1); border: var(--card-border);
}

/* ── Banners ───────────────────────────────────────────────────────────── */
.gradient-banner {
  background: linear-gradient(135deg, var(--c-from), var(--c-to));
  border-radius: var(--r-xl); padding: 24px 22px; color: #fff;
}

/* ── Typography (Material Design 3 scale) ─────────────────────────── */
.display    { font-size: 36px; font-weight: 700; color: var(--c-text); letter-spacing: -0.5px; line-height: 44px; }
.title      { font-size: 26px; font-weight: 800; color: var(--c-text); letter-spacing: -0.5px; line-height: 32px; }
.title-md   { font-size: 20px; font-weight: 700; color: var(--c-text); line-height: 28px; }
.subtitle   { font-size: 16px; font-weight: 700; color: var(--c-text); line-height: 24px; }
.body       { font-size: 14px; font-weight: 400; color: var(--c-text-2); line-height: 22px; }
.body-lg    { font-size: 16px; font-weight: 400; color: var(--c-text-2); line-height: 24px; }
.caption    { font-size: 12px; font-weight: 400; color: var(--c-text-3); line-height: 16px; }
.label      { font-size: 12px; font-weight: 600; color: var(--c-text-2); line-height: 16px; letter-spacing: 0.3px; }
.section-title {
  font-size: 11px; font-weight: 700; color: var(--c-text-3);
  text-transform: uppercase; letter-spacing: 1px; line-height: 16px;
}

/* ── List items ────────────────────────────────────────────────────────── */
.list-item {
  display: flex; align-items: center; gap: var(--sp-3);
  background: var(--c-surface); border-radius: var(--r-md);
  padding: var(--sp-3) var(--sp-4);
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.05);
  cursor: pointer; transition: transform var(--duration-fast) var(--ease-standard), box-shadow var(--duration-normal);
}
.list-item:active { transform: scale(0.98); }

/* ── Components ────────────────────────────────────────────────────────── */
.icon-circle {
  width: 52px; height: 52px; border-radius: 16px; flex-shrink: 0;
  background: var(--c-primary-light);
  display: flex; align-items: center; justify-content: center; font-size: 24px;
}
.badge {
  display: inline-flex; align-items: center;
  padding: 4px 10px; border-radius: 100px;
  background: var(--c-primary-light); color: var(--c-primary);
  font-size: 12px; font-weight: 600;
}
.input-field {
  width: 100%; padding: var(--sp-3) var(--sp-4); min-height: 48px;
  background: #f1f5f9; border: 1.5px solid transparent;
  border-radius: var(--r-sm); font-size: 15px;
  outline: none; font-family: inherit;
  transition: border-color var(--duration-normal), box-shadow var(--duration-normal), background var(--duration-normal);
}
.input-field:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px var(--c-primary-light);
  background: #fff;
}
.avatar {
  width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--c-from), var(--c-to));
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 16px;
}
.divider { height: 1px; background: var(--c-border); }

/* ── Status/Semantic badges ───────────────────────────────────────── */
.badge-success { background: var(--c-success-light); color: var(--c-success); }
.badge-warning { background: var(--c-warning-light); color: var(--c-warning); }
.badge-error   { background: var(--c-error-light); color: var(--c-error); }

/* ── Glassmorphism card ───────────────────────────────────────────── */
.glass-card {
  background: rgba(255,255,255,0.5);
  backdrop-filter: blur(12px) saturate(1.6);
  -webkit-backdrop-filter: blur(12px) saturate(1.6);
  border: 1px solid rgba(255,255,255,0.35);
  border-radius: var(--r-lg);
  padding: var(--sp-4);
  box-shadow: 0 8px 32px rgba(31,38,135,0.12);
}

/* ── Floating Action Button (FAB) ─────────────────────────────────── */
.fab {
  position: fixed; bottom: 80px; right: 20px;
  width: 56px; height: 56px; border-radius: 16px;
  background: linear-gradient(135deg, var(--c-from), var(--c-to));
  color: #fff; font-size: 24px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: none; cursor: pointer; z-index: 50;
  box-shadow: var(--elevation-3);
  transition: transform var(--duration-fast) var(--ease-spring), box-shadow var(--duration-normal);
}
.fab:hover { transform: scale(1.05); box-shadow: var(--elevation-4); }
.fab:active { transform: scale(0.95); }

/* ── Bottom sheet ─────────────────────────────────────────────────── */
.bottom-sheet {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 420px;
  background: var(--c-surface);
  border-radius: var(--r-xl) var(--r-xl) 0 0;
  padding: var(--sp-4); padding-bottom: var(--sp-8);
  box-shadow: 0 -4px 24px rgba(0,0,0,0.12);
  z-index: 200;
}
.bottom-sheet-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: var(--c-border); margin: 0 auto var(--sp-4);
}

/* ── Progress bar ─────────────────────────────────────────────────── */
.progress-bar {
  height: 8px; border-radius: 4px; background: var(--c-border); overflow: hidden;
}
.progress-bar-fill {
  height: 100%; border-radius: 4px;
  background: linear-gradient(90deg, var(--c-from), var(--c-to));
  transition: width var(--duration-slow) var(--ease-decelerate);
}

/* ── Chip / Tag ───────────────────────────────────────────────────── */
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 100px;
  background: var(--c-primary-light); color: var(--c-primary);
  font-size: 13px; font-weight: 600; cursor: pointer;
  border: none; transition: background var(--duration-fast);
}
.chip:active { background: rgba(var(--c-from), 0.2); }
.chip-outline {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 14px; border-radius: 100px;
  background: transparent; color: var(--c-text-2);
  font-size: 13px; font-weight: 500; cursor: pointer;
  border: 1.5px solid var(--c-border);
  transition: all var(--duration-fast);
}
.chip-outline:active, .chip-outline.active {
  border-color: var(--c-primary); color: var(--c-primary); background: var(--c-primary-light);
}

/* ── Toggle / Switch ──────────────────────────────────────────────── */
.toggle {
  width: 48px; height: 28px; border-radius: 14px;
  background: var(--c-border); border: none; cursor: pointer;
  position: relative; transition: background var(--duration-normal);
  padding: 0; flex-shrink: 0;
}
.toggle::after {
  content: ''; position: absolute; top: 3px; left: 3px;
  width: 22px; height: 22px; border-radius: 50%;
  background: #fff; box-shadow: var(--elevation-1);
  transition: transform var(--duration-normal) var(--ease-spring);
}
.toggle.active { background: var(--c-primary); }
.toggle.active::after { transform: translateX(20px); }

/* ── Spring animation ─────────────────────────────────────────────── */
@keyframes springIn {
  0% { transform: scale(0.9); opacity: 0; }
  70% { transform: scale(1.03); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes slideUp {
  0% { transform: translateY(16px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
.animate-spring { animation: springIn 0.35s var(--ease-spring) forwards; }
.animate-slide-up { animation: slideUp 0.3s var(--ease-standard) forwards; }

/* ── Touch targets ─────────────────────────────────────────────────────── */
.nav-tab { min-height: 44px; min-width: 44px; }
.btn-icon { min-width: 44px; min-height: 44px; }
.btn-secondary { min-height: 44px; }

/* ── Micro-interactions ────────────────────────────────────────────────── */
.btn-primary:hover  { opacity: 0.92; }
.btn-primary:active { transform: scale(0.97); }
.list-item { transition: transform var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast); }
.list-item:hover { box-shadow: var(--elevation-2); }
.list-item:active { transform: scale(0.98); box-shadow: none; }
.card { transition: box-shadow var(--duration-normal) var(--ease-standard); }
.card:hover { box-shadow: var(--elevation-2); }

/* ── Skeleton loader ───────────────────────────────────────────────────── */
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.skeleton {
  border-radius: var(--r-sm);
  background: linear-gradient(90deg, var(--c-border) 25%, #f0f4f8 50%, var(--c-border) 75%);
  background-size: 800px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}
.skeleton-text   { height: 14px; width: 100%; }
.skeleton-avatar { width: 42px; height: 42px; border-radius: 50%; }
.skeleton-card   { height: 80px; border-radius: var(--r-lg); }

/* ── Empty state ───────────────────────────────────────────────────────── */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 48px 24px; text-align: center; gap: 12px;
}
.empty-state-icon { font-size: 48px; }
.empty-state-title { font-size: 18px; font-weight: 700; color: var(--c-text); }
.empty-state-body  { font-size: 14px; color: var(--c-text-2); max-width: 260px; }

/* ── Error state (a failed action — show a clear message + retry) ───────── */
.error-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 40px 24px; text-align: center; gap: 12px;
}
.error-state-icon  { color: var(--c-error); opacity: 0.9; }
.error-state-title { font-size: 17px; font-weight: 700; color: var(--c-text); }
.error-state-body  { font-size: 14px; color: var(--c-text-2); max-width: 260px; line-height: 20px; }

/* ── Inline form validation (field-level error feedback) ───────────────── */
.input-field.invalid { border-color: var(--c-error); }
.field-error {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: var(--c-error); margin-top: 5px; line-height: 16px;
}

/* ── Grid helpers ──────────────────────────────────────────────────────── */
.grid-2 { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
.grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }

/* ── Responsive — Tablet (768px+) ─────────────────────────────────────── */
@media (min-width: 768px) {
  .app-shell   { max-width: 100%; padding: 0; }
  .app-content { padding: 28px 32px; padding-bottom: 100px; gap: 20px; }
  .app-nav     { max-width: 100%; left: 0; right: 0; transform: none; }
  .app-header  { padding: 18px 32px; }
  .header-gradient { padding: 28px 32px; }

  .title    { font-size: 32px; }
  .subtitle { font-size: 18px; }
  .display { font-size: 44px; line-height: 52px; }
  .title-md { font-size: 24px; line-height: 32px; }
  .body-lg { font-size: 17px; }
  .body     { font-size: 15px; }

  .card    { padding: 24px; }
  .card-sm { padding: 18px; }
  .btn-primary  { padding: 16px 28px; font-size: 16px; }
  .gradient-banner { padding: 32px 32px; }

  .grid-2          { gap: 16px; }
  .grid-3          { grid-template-columns: repeat(3,1fr); gap: 14px; }
  .grid-tablet-2   { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; }
  .grid-tablet-3   { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
  .grid-tablet-4   { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
  .grid-tablet-5   { display: grid; grid-template-columns: repeat(5,1fr); gap: 12px; }
}

/* ── Widget components ────────────────────────────────────────────── */

/* Clock widget */
.clock-widget {
  text-align: center;
  padding: var(--sp-4);
}
.clock-digital {
  font-family: 'Courier New', monospace;
  font-size: 48px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--c-text);
  line-height: 56px;
}
.clock-label {
  font-size: 12px;
  color: var(--c-text-3);
  margin-top: var(--sp-1);
}

/* Timer display */
.timer-display {
  font-family: 'Courier New', monospace;
  font-size: 56px;
  font-weight: 800;
  text-align: center;
  letter-spacing: 3px;
  padding: var(--sp-6) 0;
  line-height: 64px;
}

/* Calendar grid */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  padding: var(--sp-2);
}
.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-sm);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  min-height: 36px;
  transition: all var(--duration-fast) var(--ease-standard);
}
.calendar-day:hover { background: var(--c-primary-light); }
.calendar-day.today {
  background: var(--c-primary);
  color: #fff;
  font-weight: 700;
}
.calendar-day.selected {
  outline: 2px solid var(--c-primary);
  outline-offset: -2px;
}
.calendar-day-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--c-text-3);
  text-align: center;
  padding: var(--sp-1) 0;
}
.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-3) var(--sp-2);
}
.calendar-nav button {
  min-width: 44px;
  min-height: 44px;
  border: none;
  background: var(--c-primary-light);
  color: var(--c-primary);
  border-radius: var(--r-sm);
  font-size: 16px;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard);
}
.calendar-nav button:hover { background: var(--c-primary); color: #fff; }
.calendar-month {
  font-size: 16px;
  font-weight: 700;
}

/* Chart containers */
.chart-container {
  padding: var(--sp-4);
  background: var(--c-surface);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}
.chart-container svg {
  width: 100%;
  height: auto;
}
.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
  margin-top: var(--sp-3);
  justify-content: center;
}
.chart-legend-item {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  font-size: 12px;
  color: var(--c-text-2);
}
.chart-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

/* Stat card */
.stat-card {
  background: var(--c-surface);
  border-radius: var(--card-radius);
  padding: var(--sp-4);
  text-align: center;
  box-shadow: var(--card-shadow);
}
.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--c-text);
  line-height: 32px;
}
.stat-change {
  font-size: 12px;
  font-weight: 600;
  margin-top: var(--sp-1);
}
.stat-change.up { color: var(--c-success); }
.stat-change.down { color: var(--c-error); }

/* Star rating */
.star-rating {
  display: flex;
  gap: 4px;
  justify-content: center;
}
.star-rating .star {
  font-size: 32px;
  cursor: pointer;
  transition: color var(--duration-fast), transform var(--duration-fast) var(--ease-spring);
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.star-rating .star:hover { transform: scale(1.2); }
.star-rating .star.filled { color: #FFD700; }
.star-rating .star.empty { color: var(--c-border); }

/* Carousel */
.carousel {
  position: relative;
  overflow: hidden;
  border-radius: var(--r-lg);
}
.carousel-slide {
  width: 100%;
  aspect-ratio: 16/9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  transition: transform var(--duration-normal) var(--ease-standard);
}
.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  color: #fff;
  border: none;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
.carousel-arrow.prev { left: 8px; }
.carousel-arrow.next { right: 8px; }
.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: var(--sp-2) 0;
}
.carousel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--c-border);
  cursor: pointer;
  transition: background var(--duration-fast);
}
.carousel-dot.active { background: var(--c-primary); width: 24px; border-radius: 4px; }

/* Share buttons */
.share-row {
  display: flex;
  gap: var(--sp-2);
  justify-content: center;
  flex-wrap: wrap;
}
.share-btn {
  min-width: 48px;
  min-height: 48px;
  border-radius: var(--r-sm);
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--duration-fast) var(--ease-spring), box-shadow var(--duration-fast);
}
.share-btn:active { transform: scale(0.93); }
.share-btn.whatsapp { background: #25D366; }
.share-btn.facebook { background: #1877F2; }
.share-btn.twitter { background: #000; }
.share-btn.email { background: #EA4335; }
.share-btn.copy { background: var(--c-primary); }

/* Profile card */
.profile-card {
  background: var(--c-surface);
  border-radius: var(--card-radius);
  overflow: hidden;
  box-shadow: var(--card-shadow);
}
.profile-header {
  height: 80px;
  background: linear-gradient(135deg, var(--c-from), var(--c-to));
}
.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c-from), var(--c-to));
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: -36px auto 0;
  border: 4px solid var(--c-surface);
  position: relative;
  z-index: 1;
}
.profile-stats {
  display: flex;
  justify-content: space-around;
  padding: var(--sp-4);
  border-top: 1px solid var(--c-border);
}
.profile-stat {
  text-align: center;
}
.profile-stat-value {
  font-size: 18px;
  font-weight: 800;
}
.profile-stat-label {
  font-size: 11px;
  color: var(--c-text-3);
}

/* Calculator */
.calc-display {
  padding: var(--sp-6) var(--sp-4);
  text-align: right;
  direction: ltr;
}
.calc-result {
  font-size: 48px;
  font-weight: 800;
  font-family: 'Courier New', monospace;
  line-height: 56px;
}
.calc-history {
  font-size: 14px;
  color: var(--c-text-3);
  margin-bottom: var(--sp-2);
}
.calc-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-2);
  padding: var(--sp-2);
}
.calc-btn {
  min-height: 56px;
  border: none;
  border-radius: var(--r-sm);
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--duration-micro) var(--ease-spring);
}
.calc-btn:active { transform: scale(0.93); }
.calc-btn.num { background: var(--c-surface); color: var(--c-text); box-shadow: var(--elevation-1); }
.calc-btn.op { background: var(--c-primary); color: #fff; }
.calc-btn.func { background: var(--c-primary-light); color: var(--c-primary); }
.calc-btn.equals { background: var(--c-success); color: #fff; }
.calc-btn.clear { background: rgba(239,68,68,0.12); color: var(--c-error); }
.calc-btn.zero { grid-column: span 2; }

/* Note card */
.note-card {
  border-radius: var(--r-md);
  padding: var(--sp-3);
  min-height: 100px;
}
.note-card.yellow { background: #fef9c3; border-left: 4px solid #f59e0b; }
.note-card.green { background: #dcfce7; border-left: 4px solid #22c55e; }
.note-card.blue { background: #dbeafe; border-left: 4px solid #3b82f6; }
.note-card.pink { background: #fce7f3; border-left: 4px solid #ec4899; }
.note-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: var(--sp-1);
}
.note-body {
  font-size: 12px;
  color: var(--c-text-2);
  line-height: 18px;
}
.note-time {
  font-size: 10px;
  color: var(--c-text-3);
  margin-top: var(--sp-2);
}

/* Survey/Quiz */
.survey-progress {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-4);
}
.survey-step {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--c-border);
}
.survey-step.done { background: var(--c-primary); }
.survey-step.current { background: var(--c-primary); opacity: 0.5; }
.survey-option {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  border: 1.5px solid var(--c-border);
  border-radius: var(--r-md);
  margin-bottom: var(--sp-2);
  cursor: pointer;
  min-height: 48px;
  transition: all var(--duration-fast) var(--ease-standard);
}
.survey-option:hover { border-color: var(--c-primary); background: var(--c-primary-light); }
.survey-option.selected {
  border-color: var(--c-primary);
  background: var(--c-primary-light);
}
.survey-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--c-border);
  flex-shrink: 0;
}
.survey-option.selected .survey-radio {
  border-color: var(--c-primary);
  background: var(--c-primary);
  box-shadow: inset 0 0 0 3px var(--c-surface);
}

/* Habit tracker */
.habit-item {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: var(--c-surface);
  border-radius: var(--r-md);
  box-shadow: var(--elevation-1);
  margin-bottom: var(--sp-2);
  min-height: 56px;
}
.habit-check {
  width: 28px;
  height: 28px;
  border-radius: var(--r-sm);
  border: 2px solid var(--c-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--duration-fast) var(--ease-spring);
}
.habit-check.done {
  background: var(--c-success);
  border-color: var(--c-success);
  color: #fff;
}
.habit-streak {
  font-size: 11px;
  color: var(--c-text-3);
  display: flex;
  align-items: center;
  gap: 4px;
}
`;

export function buildHtmlDocument(componentCode: string, appName = 'MobileForge'): string {
  const stripped = componentCode
    .replace(/import\s[\s\S]*?from\s+['"][^'"]+['"]\s*;?[ \t]*\n?/g, '')
    .replace(/import\s+['"][^'"]+['"]\s*;?[ \t]*\n?/g, '')
    .replace(/^const\s*\{[^}]*\}\s*=\s*React\s*;?[ \t]*$/gm, '')
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s+(function|class|const|let|var)\s/gm, '$1 ')
    .trim();

  const safeCode = stripped.replace(/<\/script>/gi, '<\\/script>');
  // Guard: </style> inside a <style> block terminates the element — strip it from CSS
  const safeCss = DESIGN_SYSTEM_CSS.replace(/<\/style>/gi, '');
  const safeName = appName.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] ?? c));

  return `<!DOCTYPE html>
<html lang="he">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${safeName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Heebo:wght@400;500;600;700;800;900&family=Assistant:wght@400;500;600;700;800&family=Rubik:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <script src="https://unpkg.com/react@18.2.0/umd/react.production.min.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@babel/standalone@7.26.10/babel.min.js" crossorigin="anonymous"></script>
  <script src="https://cdn.tailwindcss.com/3.4.17" crossorigin="anonymous"></script>
  <style>${safeCss}</style>
  <script>
    window.onerror = function(msg, _src, line, col) {
      var d = document.getElementById('__err');
      if (!d) {
        d = document.createElement('div');
        d.id = '__err';
        d.style.cssText = 'position:fixed;inset:0;background:#fef2f2;padding:24px;font-family:monospace;font-size:13px;color:#dc2626;z-index:9999;overflow:auto';
        document.body.appendChild(d);
      }
      d.innerHTML = '<b style="font-size:16px">⚠️ Error</b><pre style="margin-top:8px;white-space:pre-wrap">'
        + String(msg).replace(/</g,'&lt;') + '\\nLine: ' + line + ', Col: ' + col + '</pre>';
      return true;
    };
    setTimeout(function() {
      if (!window.Babel && document.getElementById('root') && !document.getElementById('root').firstChild) {
        document.getElementById('root').innerHTML =
          '<div style="padding:32px;font-family:-apple-system,sans-serif;text-align:center;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#fffbeb;color:#92400e">'
          + '<div style="font-size:40px">⚠️</div>'
          + '<b style="font-size:16px">לא ניתן לטעון את התצוגה</b>'
          + '<p style="font-size:13px;color:#a16207;max-width:260px;line-height:1.5">בדוק חיבור לאינטרנט ורענן את הדף.<br>התצוגה דורשת גישה ל-unpkg.com ו-cdn.tailwindcss.com</p>'
          + '<button onclick="location.reload()" style="margin-top:8px;padding:8px 20px;border-radius:8px;background:#f59e0b;color:#fff;border:none;font-weight:600;font-size:13px;cursor:pointer">נסה שוב</button></div>';
      }
    }, 5000);
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react,typescript">
    /* Wrapped in IIFE so try/catch is in the same eval context as the code.
       This makes real error messages visible instead of "Script error Line 0". */
    (function __mf_run() {
      const { useState, useEffect, useRef, useCallback, useMemo, useContext, createContext, useReducer } = React;

      class ErrorBoundary extends React.Component {
        constructor(props) { super(props); this.state = { error: null }; }
        static getDerivedStateFromError(err) { return { error: err }; }
        render() {
          if (this.state.error) return (
            <div style={{position:'fixed',inset:0,background:'#fef2f2',padding:24,fontFamily:'monospace',fontSize:13,color:'#dc2626',overflow:'auto',zIndex:9999}}>
              <div style={{fontWeight:'bold',fontSize:16,marginBottom:8}}>⚠️ Runtime Error</div>
              <pre style={{whiteSpace:'pre-wrap',lineHeight:1.5}}>{this.state.error.message}</pre>
            </div>
          );
          return this.props.children;
        }
      }

      try {
        ${safeCode}
        const _root = ReactDOM.createRoot(document.getElementById('root'));
        _root.render(<ErrorBoundary><App /></ErrorBoundary>);
      } catch (__err) {
        var __msg = (__err && __err.message) ? __err.message : String(__err);
        var __stack = (__err && __err.stack) ? __err.stack : '';
        var __d = document.getElementById('root');
        if (__d) __d.innerHTML =
          '<div style="position:fixed;inset:0;background:#fef2f2;padding:24px;font-family:monospace;font-size:13px;color:#dc2626;overflow:auto;z-index:9999">'
          + '<b style="font-size:16px">⚠️ JS Error (real)</b>'
          + '<pre style="margin-top:10px;white-space:pre-wrap;line-height:1.5">'
          + __msg.replace(/</g,'&lt;')
          + '\\n\\n' + __stack.replace(/</g,'&lt;')
          + '</pre></div>';
      }
    })();
  </script>
  <!-- MobileForge Edit Overlay -->
  <script>
  (function() {
    var EDITABLE = 'p,h1,h2,h3,h4,h5,h6,span,button,a,label,li,td,th,div';
    var selected = null;
    var toolbar = null;
    var editing = false;
    // Click-to-edit is only meaningful inside the builder (the preview iframe).
    // In a standalone/shared page opened directly on a device, it must stay off.
    var __embedded = (function() { try { return window.self !== window.top; } catch(e) { return true; } })();

    function createToolbar() {
      var t = document.createElement('div');
      t.id = '__mf_toolbar';
      t.style.cssText = 'position:fixed;z-index:99999;display:none;background:#1e293b;border-radius:10px;padding:4px;gap:4px;box-shadow:0 8px 32px rgba(0,0,0,0.25),0 2px 8px rgba(0,0,0,0.15);font-family:-apple-system,sans-serif;font-size:12px;align-items:center;backdrop-filter:blur(8px);';

      var editBtn = document.createElement('button');
      editBtn.textContent = '\\u270F\\uFE0F \\u05E2\\u05E8\\u05D5\\u05DA';
      editBtn.style.cssText = 'background:rgba(99,102,241,0.2);color:#a5b4fc;border:none;padding:6px 12px;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;white-space:nowrap;';
      editBtn.onclick = function() { startEdit(); };

      var doneBtn = document.createElement('button');
      doneBtn.textContent = '\\u2713 \\u05E1\\u05D9\\u05D5\\u05DD';
      doneBtn.id = '__mf_done';
      doneBtn.style.cssText = 'background:rgba(34,197,94,0.2);color:#86efac;border:none;padding:6px 12px;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;display:none;white-space:nowrap;';
      doneBtn.onclick = function() { finishEdit(); };

      t.appendChild(editBtn);
      t.appendChild(doneBtn);
      document.body.appendChild(t);
      return t;
    }

    function positionToolbar(el) {
      if (!toolbar) toolbar = createToolbar();
      var r = el.getBoundingClientRect();
      toolbar.style.display = 'flex';
      toolbar.style.left = Math.max(4, r.left) + 'px';
      toolbar.style.top = Math.max(4, r.top - 40) + 'px';
    }

    function clearSelection() {
      if (selected) {
        selected.style.outline = '';
        selected.style.outlineOffset = '';
      }
      if (toolbar) toolbar.style.display = 'none';
      selected = null;
      editing = false;
    }

    function startEdit() {
      if (!selected) return;
      selected.contentEditable = 'true';
      selected.focus();
      selected.style.outline = '2px solid #22c55e';
      editing = true;
      var editBtn = toolbar ? toolbar.querySelector('button:first-child') : null;
      var doneBtn = document.getElementById('__mf_done');
      if (editBtn) editBtn.style.display = 'none';
      if (doneBtn) doneBtn.style.display = 'block';
    }

    function finishEdit() {
      if (!selected) return;
      var el = selected; // capture — clearSelection() below nulls the var
      el.contentEditable = 'false';
      el.style.outline = '2px solid #22c55e';
      setTimeout(function() { if (el) el.style.outline = ''; }, 800);

      // Flash green
      el.style.transition = 'background 0.3s';
      el.style.background = 'rgba(34,197,94,0.1)';
      setTimeout(function() { if (el) el.style.background = ''; }, 600);

      // Notify parent
      try {
        window.parent.postMessage({
          type: 'mf-edit',
          action: 'text-changed',
          newText: el.textContent,
          tag: el.tagName.toLowerCase(),
        }, '*');
      } catch(e) {}

      var editBtn = toolbar ? toolbar.querySelector('button:first-child') : null;
      var doneBtn = document.getElementById('__mf_done');
      if (editBtn) editBtn.style.display = 'block';
      if (doneBtn) doneBtn.style.display = 'none';
      editing = false;
      clearSelection();
    }

    // Interactive editing handlers — attached ONLY when embedded in the builder
    // iframe. Standalone/shared previews stay clean and never become editable.
    if (__embedded) {
    // Hover
    document.addEventListener('mouseover', function(e) {
      if (editing) return;
      var el = e.target.closest(EDITABLE);
      if (!el || el.id === '__mf_toolbar' || el.closest('#__mf_toolbar') || el.id === '__err') return;
      el.style.outline = '2px dashed rgba(99,102,241,0.5)';
      el.style.outlineOffset = '2px';
      el.addEventListener('mouseout', function handler() {
        if (el !== selected) { el.style.outline = ''; el.style.outlineOffset = ''; }
        el.removeEventListener('mouseout', handler);
      });
    });

    // Click
    document.addEventListener('click', function(e) {
      if (editing) return;
      // Let navigation tabs work normally — don't intercept them for editing
      if (e.target.closest && e.target.closest('.nav-tab')) return;
      var el = e.target.closest(EDITABLE);
      if (!el || el.id === '__mf_toolbar' || el.closest('#__mf_toolbar')) return;
      e.preventDefault();
      e.stopPropagation();
      clearSelection();
      selected = el;
      el.style.outline = '2px solid #6366f1';
      el.style.outlineOffset = '2px';
      positionToolbar(el);

      // Report selected element to parent
      try {
        var cs = getComputedStyle(el);
        var r = el.getBoundingClientRect();
        window.parent.postMessage({
          type: 'mf-element-selected',
          tag: el.tagName.toLowerCase(),
          text: el.textContent || '',
          styles: {
            color: cs.color,
            backgroundColor: cs.backgroundColor,
            fontSize: cs.fontSize,
            padding: cs.padding,
            fontWeight: cs.fontWeight,
            borderRadius: cs.borderRadius,
            boxShadow: cs.boxShadow,
            border: cs.border,
            textAlign: cs.textAlign,
            opacity: cs.opacity,
            width: cs.width,
          },
          rect: { top: r.top, left: r.left, width: r.width, height: r.height },
          path: buildPath(el),
        }, '*');
      } catch(e) {}
    }, true);

    // Double-click to edit directly
    document.addEventListener('dblclick', function(e) {
      var el = e.target.closest(EDITABLE);
      if (!el || el.id === '__mf_toolbar' || el.closest('#__mf_toolbar')) return;
      e.preventDefault();
      clearSelection();
      selected = el;
      el.style.outline = '2px solid #6366f1';
      el.style.outlineOffset = '2px';
      positionToolbar(el);
      startEdit();
    }, true);

    // Escape to cancel
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        if (editing) finishEdit();
        else clearSelection();
      }
      if (e.key === 'Enter' && editing && !e.shiftKey) {
        e.preventDefault();
        finishEdit();
      }
    });

    // Click on empty space to deselect
    document.addEventListener('click', function(e) {
      if (!e.target.closest(EDITABLE) && !e.target.closest('#__mf_toolbar')) {
        clearSelection();
        try { window.parent.postMessage({ type: 'mf-element-deselected' }, '*'); } catch(x) {}
      }
    });
    } // end if (__embedded) — interactive editing handlers

    // Build unique path for element
    function buildPath(el) {
      var parts = [];
      while (el && el !== document.body) {
        var tag = el.tagName.toLowerCase();
        var idx = 0;
        var sib = el;
        while ((sib = sib.previousElementSibling)) { if (sib.tagName === el.tagName) idx++; }
        parts.unshift(tag + '[' + idx + ']');
        el = el.parentElement;
      }
      return parts.join('>');
    }

    // Find element by path
    function findByPath(path) {
      if (!path) return null;
      var parts = path.split('>');
      var el = document.body;
      for (var i = 0; i < parts.length; i++) {
        var m = parts[i].match(/^(\\w+)\\[(\\d+)\\]$/);
        if (!m || !el) return null;
        var tag = m[1].toUpperCase();
        var idx = parseInt(m[2]);
        var count = 0;
        var found = null;
        for (var c = el.firstElementChild; c; c = c.nextElementSibling) {
          if (c.tagName === tag) {
            if (count === idx) { found = c; break; }
            count++;
          }
        }
        el = found;
        if (!el) return null;
      }
      return el;
    }

    // Listen for commands from parent
    window.addEventListener('message', function(e) {
      var d = e.data;
      if (!d || !d.type) return;

      if (d.type === 'mf-navigate') {
        var tabs = document.querySelectorAll('.nav-tab');
        if (tabs[d.index]) tabs[d.index].click();
      }

      if (d.type === 'mf-update-style' && d.path) {
        var el = findByPath(d.path);
        if (el) el.style[d.property] = d.value;
      }

      if (d.type === 'mf-update-text' && d.path) {
        var el = findByPath(d.path);
        if (el) el.textContent = d.text;
      }

      if (d.type === 'mf-insert-icon' && d.path) {
        var el = findByPath(d.path);
        if (el) {
          var span = document.createElement('span');
          span.textContent = d.icon + ' ';
          span.style.marginInlineEnd = '4px';
          el.insertBefore(span, el.firstChild);
        }
      }

      if (d.type === 'mf-deselect') {
        clearSelection();
      }
    });

    // Screen discovery — report nav tabs to parent
    function reportScreens() {
      var tabs = document.querySelectorAll('.nav-tab');
      if (!tabs.length) return;
      var screens = [];
      for (var i = 0; i < tabs.length; i++) {
        screens.push({
          label: tabs[i].textContent.trim(),
          index: i,
          active: tabs[i].classList.contains('active') ||
                  tabs[i].style.color === 'var(--c-primary)' ||
                  tabs[i].getAttribute('data-active') === 'true',
        });
      }
      try { window.parent.postMessage({ type: 'mf-screens', screens: screens }, '*'); } catch(x) {}
    }
    setTimeout(reportScreens, 500);
    setTimeout(reportScreens, 1500);
    new MutationObserver(function() { setTimeout(reportScreens, 100); })
      .observe(document.documentElement, { childList: true, subtree: true, attributes: true });
  })();
  </script>
</body>
</html>`;
}
