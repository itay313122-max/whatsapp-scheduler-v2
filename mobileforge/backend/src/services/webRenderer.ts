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
  padding: 14px 20px;
  display: flex; align-items: center; justify-content: space-between;
}
.app-content {
  flex: 1; overflow-y: auto;
  padding: 16px; padding-bottom: 90px;
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
}
.header-gradient {
  background: linear-gradient(135deg, var(--c-from), var(--c-to));
  color: #fff; padding: 18px 20px;
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
  width: 100%; padding: 15px 24px; min-height: 44px;
  background: var(--btn-bg); color: var(--btn-color);
  font-weight: 700; font-size: 15px; font-family: inherit;
  border-radius: var(--btn-radius);
  border: var(--btn-border-width) solid var(--btn-border-color);
  cursor: pointer; box-shadow: var(--btn-shadow);
  transition: transform 0.14s, opacity 0.14s; letter-spacing: 0.1px;
}
.btn-primary:hover  { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,0.22); }
.btn-primary:active { transform: scale(0.97); }

.btn-secondary {
  display: inline-flex; align-items: center; justify-content: center;
  width: 100%; padding: 13px 20px;
  background: var(--c-primary-light); color: var(--c-primary);
  font-weight: 600; font-size: 14px; font-family: inherit;
  border-radius: var(--r-md); border: none; cursor: pointer;
  transition: transform 0.14s, filter 0.14s;
}
.btn-secondary:active { transform: scale(0.97); }

.btn-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  background: var(--c-primary-light); color: var(--c-primary);
  font-size: 18px; border: none; cursor: pointer;
  transition: transform 0.14s;
}
.btn-icon:active { transform: scale(0.9); }

/* ── Cards ─────────────────────────────────────────────────────────────── */
.card {
  background: var(--card-bg); border-radius: var(--card-radius); padding: 18px;
  box-shadow: var(--card-shadow); border: var(--card-border);
}
.card-sm {
  background: var(--card-bg); border-radius: var(--r-md); padding: 14px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.05);
  border: var(--card-border);
}

/* ── Banners ───────────────────────────────────────────────────────────── */
.gradient-banner {
  background: linear-gradient(135deg, var(--c-from), var(--c-to));
  border-radius: var(--r-xl); padding: 24px 22px; color: #fff;
}

/* ── Typography ────────────────────────────────────────────────────────── */
.title    { font-size: 26px; font-weight: 800; color: var(--c-text); letter-spacing: -0.5px; line-height: 1.2; }
.subtitle { font-size: 16px; font-weight: 700; color: var(--c-text); line-height: 1.3; }
.body     { font-size: 14px; font-weight: 400; color: var(--c-text-2); line-height: 1.55; }
.caption  { font-size: 12px; font-weight: 400; color: var(--c-text-3); line-height: 1.4; }
.section-title {
  font-size: 11px; font-weight: 700; color: var(--c-text-3);
  text-transform: uppercase; letter-spacing: 1px;
}

/* ── List items ────────────────────────────────────────────────────────── */
.list-item {
  display: flex; align-items: center; gap: 14px;
  background: var(--c-surface); border-radius: var(--r-md);
  padding: 14px 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.05);
  cursor: pointer; transition: transform 0.14s;
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
  width: 100%; padding: 14px 16px;
  background: #f1f5f9; border: 1.5px solid transparent;
  border-radius: var(--r-sm); font-size: 15px;
  outline: none; font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
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

/* ── Touch targets ─────────────────────────────────────────────────────── */
.nav-tab { min-height: 44px; min-width: 44px; }
.btn-icon { min-width: 44px; min-height: 44px; }
.btn-secondary { min-height: 44px; }

/* ── Micro-interactions ────────────────────────────────────────────────── */
.btn-primary:hover  { opacity: 0.92; }
.btn-primary:active { transform: scale(0.97); }
.list-item { transition: transform 0.12s, box-shadow 0.12s; }
.list-item:active { transform: scale(0.98); box-shadow: none; }
.card { transition: box-shadow 0.15s; }

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
  <meta name="viewport" content="width=device-width, initial-scale=1" />
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
          '<div style="padding:24px;font-family:monospace;font-size:13px;color:#b45309;background:#fffbeb;min-height:100vh">'
          + '<b style="font-size:15px">⚠️ Babel CDN failed to load</b>'
          + '<p style="margin-top:8px">Check your internet connection.<br>The preview requires unpkg.com.</p></div>';
      }
    }, 8000);
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
      var editBtn = toolbar.querySelector('button:first-child');
      var doneBtn = document.getElementById('__mf_done');
      editBtn.style.display = 'none';
      doneBtn.style.display = 'block';
    }

    function finishEdit() {
      if (!selected) return;
      selected.contentEditable = 'false';
      selected.style.outline = '2px solid #22c55e';
      setTimeout(function() { selected.style.outline = ''; }, 800);

      // Flash green
      selected.style.transition = 'background 0.3s';
      selected.style.background = 'rgba(34,197,94,0.1)';
      setTimeout(function() { if(selected) selected.style.background = ''; }, 600);

      // Notify parent
      try {
        window.parent.postMessage({
          type: 'mf-edit',
          action: 'text-changed',
          newText: selected.textContent,
          tag: selected.tagName.toLowerCase(),
        }, '*');
      } catch(e) {}

      var editBtn = toolbar.querySelector('button:first-child');
      var doneBtn = document.getElementById('__mf_done');
      editBtn.style.display = 'block';
      doneBtn.style.display = 'none';
      editing = false;
      clearSelection();
    }

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
      var parts = path.split('>');
      var el = document.body;
      for (var i = 0; i < parts.length; i++) {
        var m = parts[i].match(/^(\w+)\[(\d+)\]$/);
        if (!m) return null;
        var children = el.querySelectorAll(':scope > ' + m[1]);
        el = children[parseInt(m[2])];
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
