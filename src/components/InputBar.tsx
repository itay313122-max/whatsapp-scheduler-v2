import { useState, useRef, useCallback } from 'react'

interface Props {
  onSend: (content: string) => void
  isStreaming: boolean
  hasApiKey: boolean
}

export default function InputBar({ onSend, isStreaming, hasApiKey }: Props) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  const submit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming || !hasApiKey) return
    onSend(trimmed)
    setValue('')
    if (ref.current) ref.current.style.height = 'auto'
  }, [value, isStreaming, hasApiKey, onSend])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px'
  }

  const disabled = isStreaming || !hasApiKey

  return (
    <div className="shrink-0 border-t border-terminal-border bg-terminal-surface px-4 pt-3 pb-3">
      {!hasApiKey && (
        <div className="text-terminal-amber text-xs font-mono mb-2 flex items-center gap-2">
          <span>⚠</span>
          <span>
            No API key — open <strong>Settings</strong> in the sidebar to add yours.
          </span>
        </div>
      )}

      <div
        className={`flex items-end gap-2 bg-terminal-bg border rounded transition-colors ${
          disabled
            ? 'border-terminal-border'
            : 'border-terminal-border focus-within:border-terminal-amber/40'
        }`}
      >
        <span className="text-terminal-amber font-mono text-sm px-3 py-2 shrink-0 select-none">
          ›_
        </span>
        <textarea
          ref={ref}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          rows={1}
          disabled={disabled}
          placeholder={
            isStreaming
              ? 'Waiting for response…'
              : hasApiKey
                ? 'Type a message…'
                : 'Configure API key in Settings first'
          }
          className="flex-1 bg-transparent text-terminal-text font-mono text-sm resize-none outline-none py-2 pr-2 placeholder-terminal-faint disabled:opacity-40"
          style={{ minHeight: '36px', maxHeight: '180px' }}
        />
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="shrink-0 mr-2 mb-2 px-3 py-1.5 text-xs font-mono font-bold tracking-widest bg-terminal-amber text-terminal-bg rounded hover:bg-terminal-amber/85 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          {isStreaming ? '···' : 'SEND'}
        </button>
      </div>

      <div className="flex justify-between mt-1.5 text-terminal-faint text-xs font-mono">
        <span>ENTER send · SHIFT+ENTER newline</span>
        <span className={value.length > 0 ? 'text-terminal-muted' : ''}>
          {value.length > 0 ? `${value.length} chars` : ''}
        </span>
      </div>
    </div>
  )
}
