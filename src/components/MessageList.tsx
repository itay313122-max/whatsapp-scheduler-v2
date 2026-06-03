import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Message } from '../store/chatStore'

interface Props {
  messages: Message[]
  isStreaming: boolean
}

export default function MessageList({ messages, isStreaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-sm w-full">
          <div className="text-terminal-amber font-mono text-sm font-bold tracking-widest uppercase mb-1">
            Personal AI OS
          </div>
          <div className="text-terminal-muted font-mono text-xs mb-6">
            v1.0.0 // SYSTEM READY
          </div>
          <div className="border border-terminal-border rounded p-4 space-y-2 text-xs font-mono text-terminal-muted">
            <div className="text-terminal-text font-semibold mb-3 tracking-wide">
              QUICK START
            </div>
            <div>
              <span className="text-terminal-amber">01</span> Open{' '}
              <span className="text-terminal-text">Settings</span> in the sidebar
            </div>
            <div>
              <span className="text-terminal-amber">02</span> Paste your{' '}
              <span className="text-terminal-text">Anthropic API key</span>
            </div>
            <div>
              <span className="text-terminal-amber">03</span> Start typing below
            </div>
          </div>
          <div className="mt-4 text-terminal-faint text-xs font-mono">
            ENTER to send · SHIFT+ENTER for newline
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-5">
      {messages.map((msg, idx) => {
        const isLast = idx === messages.length - 1
        const streaming = isLast && msg.role === 'assistant' && isStreaming
        return (
          <MessageRow key={`${msg.timestamp}-${idx}`} msg={msg} streaming={streaming} />
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}

function MessageRow({ msg, streaming }: { msg: Message; streaming: boolean }) {
  const isUser = msg.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[82%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Role label + timestamp */}
        <div
          className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <span
            className={`text-xs font-mono font-bold tracking-widest ${
              isUser ? 'text-terminal-amber' : 'text-terminal-green'
            }`}
          >
            {isUser ? 'USER' : 'CLAUDE'}
          </span>
          {streaming && (
            <span className="text-terminal-amber text-xs font-mono animate-pulse">
              ▶ STREAMING
            </span>
          )}
          <span className="text-terminal-faint text-xs font-mono">
            {fmtTime(msg.timestamp)}
          </span>
        </div>

        {/* Bubble */}
        <div
          className={`rounded px-3 py-2 text-sm font-mono leading-relaxed ${
            isUser
              ? 'bg-terminal-surface2 border border-terminal-amber/25 text-terminal-text'
              : 'bg-terminal-surface border border-terminal-border text-terminal-text'
          }`}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap break-words">{msg.content}</span>
          ) : (
            <AssistantContent content={msg.content} streaming={streaming} />
          )}
        </div>
      </div>
    </div>
  )
}

function AssistantContent({
  content,
  streaming,
}: {
  content: string
  streaming: boolean
}) {
  if (!content && streaming) {
    return <span className="cursor-blink text-terminal-amber">▋</span>
  }
  if (!content) {
    return <span className="text-terminal-faint italic">empty response</span>
  }

  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code(props: any) {
            const { children, className } = props
            const match = /language-(\w+)/.exec(className || '')
            return match ? (
              <SyntaxHighlighter
                PreTag="div"
                language={match[1]}
                style={vscDarkPlus}
                customStyle={{
                  margin: '0.5em 0',
                  borderRadius: '4px',
                  border: '1px solid #222',
                  fontSize: '0.82em',
                  fontFamily: 'JetBrains Mono, monospace',
                  background: '#0d0d0d',
                }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className}>{children}</code>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {streaming && <span className="cursor-blink text-terminal-amber">▋</span>}
    </div>
  )
}

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
