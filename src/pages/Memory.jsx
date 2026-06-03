import { useState } from 'react'
import MemoryCard from '../components/MemoryCard'
import { useMemory } from '../hooks/useMemory'

export default function Memory() {
  const { memories, add, remove, reset } = useMemory()
  const [input, setInput] = useState('')
  const [showReset, setShowReset] = useState(false)

  const handleAdd = () => {
    if (!input.trim()) return
    add(input)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full pb-14 sm:pb-0">
      {/* Header */}
      <div
        className="shrink-0 px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid #1a1a3e', background: '#07071a' }}
      >
        <div>
          <div className="font-mono font-bold text-sm" style={{ color: '#6366f1' }}>
            🧠 מה Itay AI זוכר עליך
          </div>
          <div className="font-mono text-xs mt-0.5" style={{ color: '#334155' }}>
            זיכרונות אלו מוזרקים אוטומטית לכל שיחה
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-xs px-2 py-1 rounded"
            style={{ color: '#6366f1', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            {memories.length} זיכרונות
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* Add memory */}
        <div
          className="mb-5 p-4 rounded-xl"
          style={{ background: '#0a0a1a', border: '1px solid #1a1a3e' }}
        >
          <div className="font-mono text-xs mb-2" style={{ color: '#6366f1' }}>
            + הוסף זיכרון חדש
          </div>
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() }
              }}
              placeholder="לדוגמה: אני מעדיף Python על Node.js..."
              rows={2}
              className="flex-1 bg-transparent text-sm font-mono resize-none outline-none rounded-lg px-3 py-2"
              style={{
                border: '1px solid #1a1a3e',
                color: '#e2e8f0',
                lineHeight: 1.6,
              }}
              onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
              onBlur={(e) => (e.target.style.borderColor = '#1a1a3e')}
            />
            <button
              onClick={handleAdd}
              disabled={!input.trim()}
              className="shrink-0 px-4 py-2 rounded-lg text-sm font-mono font-bold transition-all"
              style={{
                background: input.trim() ? '#6366f1' : '#1a1a3e',
                color: input.trim() ? '#fff' : '#334155',
                boxShadow: input.trim() ? '0 0 14px rgba(99,102,241,0.4)' : 'none',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              שמור
            </button>
          </div>
        </div>

        {/* Memory grid */}
        <div className="grid grid-cols-1 gap-2">
          {memories.map((text, i) => (
            <MemoryCard key={`${i}-${text.slice(0, 10)}`} text={text} index={i} onDelete={remove} />
          ))}
        </div>

        {memories.length === 0 && (
          <div className="text-center py-12 font-mono" style={{ color: '#334155' }}>
            אין זיכרונות. הוסף את הראשון 👆
          </div>
        )}

        {/* Reset section */}
        <div className="mt-8 pt-5" style={{ borderTop: '1px solid #1a1a3e' }}>
          <div className="font-mono text-xs mb-2" style={{ color: '#475569' }}>
            Danger Zone
          </div>
          {!showReset ? (
            <button
              onClick={() => setShowReset(true)}
              className="text-xs font-mono px-3 py-1.5 rounded transition-all"
              style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)' }}
            >
              אפס לזיכרונות ברירת מחדל
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono" style={{ color: '#ef4444' }}>
                בטוח לאפס?
              </span>
              <button
                onClick={() => { reset(); setShowReset(false) }}
                className="text-xs font-mono px-3 py-1.5 rounded"
                style={{ background: '#ef4444', color: '#fff' }}
              >
                כן, אפס
              </button>
              <button
                onClick={() => setShowReset(false)}
                className="text-xs font-mono px-3 py-1.5 rounded"
                style={{ background: '#1a1a3e', color: '#94a3b8' }}
              >
                בטל
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
