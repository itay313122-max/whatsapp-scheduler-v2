/**
 * Wraps a React App() component function in a complete, self-contained HTML
 * document that runs in an iframe via srcDoc — no Expo, no external server.
 *
 * CDN stack: React 18 + ReactDOM + Babel Standalone (JSX/TS) + Tailwind CSS
 */
export function buildHtmlDocument(componentCode: string, appName = 'MobileForge'): string {
  // Strip any import/export statements the LLM might have added
  const stripped = componentCode
    .replace(/^import\s+.*?(?:from\s+['"][^'"]+['"])?\s*;?\s*$/gm, '')
    .replace(/^export\s+default\s+/gm, '')
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
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js" crossorigin></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.0/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;padding:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react,typescript">
    class ErrorBoundary extends React.Component {
      constructor(props) { super(props); this.state = { error: null }; }
      static getDerivedStateFromError(err) { return { error: err }; }
      render() {
        if (this.state.error) return (
          <div style={{padding:24,color:'#dc2626',fontFamily:'monospace',fontSize:13,background:'#fef2f2',minHeight:'100vh'}}>
            <div style={{fontWeight:'bold',fontSize:16,marginBottom:8}}>⚠️ Runtime Error</div>
            <pre style={{whiteSpace:'pre-wrap',lineHeight:1.5}}>{this.state.error.message}</pre>
          </div>
        );
        return this.props.children;
      }
    }
    const { useState, useEffect, useRef, useCallback, useMemo, useContext, createContext, useReducer } = React;
    ${safeCode}
    const _root = ReactDOM.createRoot(document.getElementById('root'));
    _root.render(<ErrorBoundary><App /></ErrorBoundary>);
  </script>
</body>
</html>`;
}
