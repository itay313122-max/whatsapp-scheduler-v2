import { useEffect, useRef } from 'react'
import MessageBubble from '../components/MessageBubble'
import InputBar from '../components/InputBar'
import { useChatCtx } from '../lib/chatContext'

function LoadingBubble() {
  return (
    <div className="flex justify-end mb-5">
      <div className="max-w-[82%]">
        <div className="flex justify-end mb-1.5">
          <div
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono"
            style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            🧠 <span className="animate-pulse">Itay AI חושב...</span>
          </div>
        </div>
        <div
          className="px-4 py-3 rounded-2xl rounded-br-sm"
          style={{ background: '#0a0a1a', border: '1px solid #1a1a3e' }}
        >
          <div className="flex items-center gap-2">
            <span className="dot-1 inline-block w-2 h-2 rounded-full" style={{ background: '#6366f1' }} />
            <span className="dot-2 inline-block w-2 h-2 rounded-full" style={{ background: '#6366f1' }} />
            <span className="dot-3 inline-block w-2 h-2 rounded-full" style={{ background: '#6366f1' }} />
            <span className="dot-4 inline-block w-2 h-2 rounded-full" style={{ background: '#6366f1' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-sm w-full text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)', boxShadow: '0 0 30px rgba(99,102,241,0.5)' }}
        >
          🤖
        </div>
        <div className="font-mono font-bold text-xl mb-1" style={{ color: '#6366f1' }}>
          ITAY AI
        </div>
        <div className="font-mono text-sm mb-6" style={{ color: '#334155' }}>
          Personal AI System // v1.0.0 // ONLINE
        </div>
        <div
          className="text-sm font-mono text-right p-4 rounded-xl space-y-2"
          style={{ background: '#0a0a1a', border: '1px solid #1a1a3e', color: '#64748b' }}
        >
          <div><span style={{ color: '#f59e0b' }}>⚡ Groq</span> — שאלות קצרות ומהירות</div>
          <div><span style={{ color: '#f59e0b' }}>🧠 Claude</span> — קוד, ניתוח, לוגיקה</div>
          <div><span style={{ color: '#10b981' }}>✍️ GPT-4o</span> — כתיבה יצירתית ותוכן</div>
        </div>
        <div className="mt-4 text-xs font-mono" style={{ color: '#1e293b' }}>
          מניתב אוטומטית לפי סוג השאלה
        </div>
      </div>
    </div>
  )
}

function getSettings() {
  try { return JSON.parse(localStorage.getItem('itayai_settings') || '{}') }
  catch { return {} }
}

export default function Chat() {
  const { messages, isLoading, error, sendMessage } = useChatCtx()
  const bottomRef = useRef(null)
  const s = getSettings()
  const hasKey = !!(s.claudeKey || s.openaiKey || s.groqKey)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div
        className="shrink-0 flex items-center justify-between px-5 py-2.5"
        style={{ borderBottom: '1px solid #1a1a3e', background: '#07071a' }}
      >
        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
          <span style={{ color: '#6366f1', fontWeight: 600 }}>ITAY AI</span>
          <span style={{ color: '#334155' }}>// צ'אט</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono" style={{ color: '#475569' }}>
          <span>{messages.length} הודעות</span>
          {error && <span style={{ color: '#ef4444' }}>⚠ שגיאה</span>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}
        {isLoading && <LoadingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <InputBar onSend={sendMessage} isLoading={isLoading} hasKey={hasKey} />
    </div>
  )
}
