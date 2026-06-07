/**
 * Wraps a React App() component function in a complete, self-contained HTML
 * document that runs in an iframe via srcDoc — no Expo, no external server.
 *
 * CDN stack: React 18 + ReactDOM + Babel Standalone (JSX) + Tailwind CSS
 */
export function buildHtmlDocument(componentCode: string, appName = 'MobileForge'): string {
  const stripped = componentCode
    // Multi-line: import { ... } from '...'  or  import X from '...'
    .replace(/import\s[\s\S]*?from\s+['"][^'"]+['"]\s*;?[ \t]*\n?/g, '')
    // Side-effect: import '...'
    .replace(/import\s+['"][^'"]+['"]\s*;?[ \t]*\n?/g, '')
    // Top-level React hook destructuring (we declare these in the wrapper below)
    .replace(/^const\s*\{[^}]*\}\s*=\s*React\s*;?[ \t]*$/gm, '')
    // export default / export function|class|const|let|var
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s+(function|class|const|let|var)\s/gm, '$1 ')
    .trim();

  // Prevent </script> inside component code from breaking out of the script block
  const safeCode = stripped.replace(/<\/script>/gi, '<\\/script>');

  const safeName = appName.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] ?? c));

  return `<!DOCTYPE html>
<html lang="he">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeName}</title>
  <!-- React 18 + ReactDOM via unpkg (reliable npm mirror) -->
  <script src="https://unpkg.com/react@18.2.0/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js" crossorigin></script>
  <!-- Babel Standalone — transforms JSX in-browser -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <!-- Tailwind CSS Play CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;padding:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  </style>
  <script>
    /* Plain-JS error overlay — works even if Babel or React fail to load */
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
    /* If Babel didn't load after 8 s, show a helpful message */
    setTimeout(function() {
      if (!window.Babel && document.getElementById('root') && !document.getElementById('root').firstChild) {
        document.getElementById('root').innerHTML =
          '<div style="padding:24px;font-family:monospace;font-size:13px;color:#b45309;background:#fffbeb;min-height:100vh">'
          + '<b style="font-size:15px">⚠️ Babel CDN failed to load</b>'
          + '<p style="margin-top:8px">Check your internet connection or network policy.<br>'
          + 'The preview requires unpkg.com to be reachable.</p></div>';
      }
    }, 8000);
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react,typescript">
    /* React hooks available globally for AI-generated code */
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

    ${safeCode}

    const _root = ReactDOM.createRoot(document.getElementById('root'));
    _root.render(<ErrorBoundary><App /></ErrorBoundary>);
  </script>
</body>
</html>`;
}
