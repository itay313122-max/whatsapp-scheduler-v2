import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import RouterBadge from './RouterBadge'

export default function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false)
  const isUser      = msg.role === 'user'
  const isStreaming  = msg.streaming === true

  const copy = async () => {
    await navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  if (isUser) {
    return (
      <div className="flex justify-start mb-5 animate-fade-up">
        <div
          className="max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
            color: '#f1f5f9',
            fontFamily: 'JetBrains Mono, monospace',
            boxShadow: '0 0 24px rgba(99,102,241,0.4)',
            border: '1px solid rgba(99,102,241,0.5)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {msg.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-end mb-5 animate-fade-up">
      <div className="max-w-[82%]">
        {/* Badge row */}
        <div className="flex justify-end mb-1.5">
          <RouterBadge route={msg.route} />
        </div>

        {/* Bubble */}
        <div
          className="relative group px-4 py-3 rounded-2xl rounded-br-sm text-sm"
          style={{
            background: '#0a0a1a',
            border: '1px solid #1a1a3e',
            color: '#e2e8f0',
            fontFamily: 'Georgia, serif',
            lineHeight: 1.7,
            boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
          }}
        >
          <div className="ai-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.content || '​'}
            </ReactMarkdown>
            {isStreaming && (
              <span
                className="stream-cursor"
                style={{ display: 'inline-block', width: 2, height: '0.9em', background: '#6366f1', marginRight: 2, verticalAlign: 'text-bottom' }}
              />
            )}
          </div>

          {/* Copy button — hidden while streaming */}
          <button
            onClick={copy}
            className={`absolute top-2 left-2 transition-all text-xs px-2 py-0.5 rounded ${isStreaming ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}
            style={{
              background: '#1a1a3e',
              color: copied ? '#10b981' : '#64748b',
              border: '1px solid #2a2a5e',
            }}
            title="העתק"
          >
            {copied ? '✓ הועתק' : '⎘ העתק'}
          </button>
        </div>
      </div>
    </div>
  )
}
