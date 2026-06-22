'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface CodeViewerProps {
  files: Record<string, string>;
  appName?: string;
}

export default function CodeViewer({ files, appName }: CodeViewerProps) {
  const fileNames = Object.keys(files);
  const [activeFile, setActiveFile] = useState(fileNames[0] || 'App.tsx');
  const [copied, setCopied] = useState(false);

  const activeCode = files[activeFile] || '';

  async function copyCode() {
    await navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function downloadZip() {
    const zip = new JSZip();
    for (const [name, content] of Object.entries(files)) {
      zip.file(name, content);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${appName || 'mobileforge-app'}.zip`);
  }

  const langMap: Record<string, string> = {
    tsx: 'tsx',
    ts: 'typescript',
    js: 'javascript',
    json: 'json',
    md: 'markdown',
  };

  const ext = activeFile.split('.').pop() || 'tsx';
  const language = langMap[ext] || 'tsx';

  return (
    <div className="flex flex-col h-full bg-[#0D0D0F] rounded-xl border border-[#2A2A2E] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2E] bg-[#141416]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-text-secondary text-xs font-code">{appName || 'App'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary border border-border hover:border-primary transition-all"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                הועתק!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                העתק
              </>
            )}
          </button>
          <button
            onClick={downloadZip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            הורד ZIP
          </button>
        </div>
      </div>

      {/* File tabs */}
      {fileNames.length > 1 && (
        <div className="flex gap-1 px-4 py-2 border-b border-border overflow-x-auto">
          {fileNames.map((name) => (
            <button
              key={name}
              onClick={() => setActiveFile(name)}
              className={`flex-shrink-0 px-3 py-1 rounded-md text-xs font-code transition-all ${
                activeFile === name
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Code */}
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '16px',
            background: 'transparent',
            fontSize: '12px',
            lineHeight: '1.6',
            height: '100%',
          }}
          showLineNumbers
          lineNumberStyle={{ color: '#3a3a5a', minWidth: '2.5em' }}
        >
          {activeCode}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
