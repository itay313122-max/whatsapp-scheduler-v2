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

/* Default palette — overridden per-app via <style>:root{}</style> in App() */
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
}

/* Reset */
*,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
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
  width: 100%; padding: 15px 24px;
  background: linear-gradient(135deg, var(--c-from), var(--c-to));
  color: #fff; font-weight: 700; font-size: 15px; font-family: inherit;
  border-radius: var(--r-md); border: none; cursor: pointer;
  box-shadow: 0 4px 14px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1);
  transition: transform 0.14s, box-shadow 0.14s; letter-spacing: 0.1px;
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
  background: var(--c-surface); border-radius: var(--r-lg); padding: 18px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06);
}
.card-sm {
  background: var(--c-surface); border-radius: var(--r-md); padding: 14px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.05);
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
  const safeName = appName.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] ?? c));

  return `<!DOCTYPE html>
<html lang="he">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <script src="https://unpkg.com/react@18.2.0/umd/react.production.min.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin="anonymous"></script>
  <script src="https://cdn.tailwindcss.com" crossorigin="anonymous"></script>
  <style>${DESIGN_SYSTEM_CSS}</style>
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
</body>
</html>`;
}
