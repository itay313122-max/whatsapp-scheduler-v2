import { useState, useRef, useCallback } from 'react'

export default function InputBar({ onSend, isLoading, hasKey }) {
  const [value, setValue] = useState('')
  const ref = useRef(null)

  const submit = useCallback(() => {
    const t = value.trim()
    if (!t || isLoading || !hasKey) return
    onSend(t)
    setValue('')
    if (ref.current) ref.current.style.height = 'auto'
  }, [value, isLoading, hasKey, onSend])

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const onChange = (e) => {
    setValue(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px'
  }

  const disabled = isLoading || !hasKey

  return (
    <div
      className="shrink-0 px-4 py-3"
      style={{ borderTop: '1px solid #1a1a3e', background: '#050510' }}
    >
      {!hasKey && (
        <div
          className="flex items-center gap-2 mb-2 text-xs font-mono px-3 py-1.5 rounded"
          style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
        >
          <span>⚠</span>
          <span>הוסף Anthropic API key בהגדרות כדי להתחיל</span>
        </div>
      )}

      <div
        className="flex items-end gap-2 rounded-xl px-3 py-2 transition-all"
        style={{
          background: '#0a0a1a',
          border: `1px solid ${disabled ? '#1a1a3e' : '#2a2a5e'}`,
          boxShadow: disabled ? 'none' : '0 0 12px rgba(99,102,241,0.15)',
        }}
      >
        {/* Prompt indicator */}
        <span
          className="text-sm font-mono shrink-0 pb-0.5 select-none"
          style={{ color: '#6366f1' }}
        >
          ›_
        </span>

        <textarea
          ref={ref}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder={
            isLoading
              ? 'Itay AI חושב...'
              : hasKey
              ? 'שאל כל דבר... (Enter לשליחה, Shift+Enter לשורה חדשה)'
              : 'הגדר API key קודם'
          }
          rows={1}
          className="flex-1 bg-transparent text-sm font-mono resize-none outline-none placeholder-muted disabled:opacity-40"
          style={{
            color: '#f1f5f9',
            minHeight: '28px',
            maxHeight: '180px',
            lineHeight: '1.6',
          }}
        />

        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider transition-all"
          style={{
            background: disabled || !value.trim() ? '#1a1a3e' : '#6366f1',
            color: disabled || !value.trim() ? '#475569' : '#fff',
            cursor: disabled || !value.trim() ? 'not-allowed' : 'pointer',
            boxShadow: !disabled && value.trim() ? '0 0 14px rgba(99,102,241,0.45)' : 'none',
          }}
        >
          {isLoading ? (
            <span className="flex items-center gap-1">
              <span className="dot-1 inline-block w-1 h-1 rounded-full bg-current" />
              <span className="dot-2 inline-block w-1 h-1 rounded-full bg-current" />
              <span className="dot-3 inline-block w-1 h-1 rounded-full bg-current" />
            </span>
          ) : (
            'שלח ▶'
          )}
        </button>
      </div>

      <div className="flex justify-between mt-1.5 px-1">
        <span className="text-xs font-mono" style={{ color: '#334155' }}>
          ENTER שלח · SHIFT+ENTER שורה חדשה
        </span>
        {value.length > 0 && (
          <span className="text-xs font-mono" style={{ color: '#475569' }}>
            {value.length} תווים
          </span>
        )}
      </div>
    </div>
  )
}
