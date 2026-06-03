import { useState } from 'react'
import { useChatStore } from '../store/chatStore'

const MODELS = [
  {
    id: 'claude-sonnet-4-20250514',
    label: 'Claude Sonnet 4',
    note: 'Balanced — fast & capable',
  },
  {
    id: 'claude-haiku-4-5-20251001',
    label: 'Claude Haiku 4.5',
    note: 'Fastest & most lightweight',
  },
  {
    id: 'claude-opus-4-8',
    label: 'Claude Opus 4',
    note: 'Most powerful',
  },
]

export default function Settings() {
  const { settings, updateSettings } = useChatStore()
  const [showKey, setShowKey] = useState(false)
  const [keyCopied, setKeyCopied] = useState(false)

  const clearKey = () => {
    updateSettings({ apiKey: '' })
  }

  const copyKey = async () => {
    if (!settings.apiKey) return
    await navigator.clipboard.writeText(settings.apiKey)
    setKeyCopied(true)
    setTimeout(() => setKeyCopied(false), 1500)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-3 border-b border-terminal-border bg-terminal-surface flex items-center gap-3">
        <span className="text-terminal-amber font-mono text-xs font-bold tracking-widest uppercase">
          System Configuration
        </span>
        <div className="flex-1 h-px bg-terminal-border" />
        <span className="text-terminal-faint text-xs font-mono">
          Changes saved automatically
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {/* API Credentials */}
        <Section title="API CREDENTIALS">
          <FieldLabel>Anthropic API Key</FieldLabel>
          <div className="flex gap-2 mt-1.5">
            <div className="flex-1 flex items-center bg-terminal-surface2 border border-terminal-border rounded focus-within:border-terminal-amber/40 transition-colors overflow-hidden">
              <input
                type={showKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={e => updateSettings({ apiKey: e.target.value })}
                placeholder="sk-ant-api03-…"
                className="flex-1 bg-transparent px-3 py-2 text-xs font-mono text-terminal-text placeholder-terminal-faint outline-none"
              />
              {settings.apiKey && (
                <button
                  onClick={copyKey}
                  className="px-2 py-2 text-xs font-mono text-terminal-faint hover:text-terminal-muted transition-colors"
                  title="Copy"
                >
                  {keyCopied ? '✓' : '⎘'}
                </button>
              )}
            </div>
            <button
              onClick={() => setShowKey(v => !v)}
              className="px-3 py-2 text-xs font-mono text-terminal-muted border border-terminal-border rounded hover:border-terminal-amber/30 hover:text-terminal-text transition-colors"
            >
              {showKey ? 'HIDE' : 'SHOW'}
            </button>
            {settings.apiKey && (
              <button
                onClick={clearKey}
                className="px-3 py-2 text-xs font-mono text-terminal-muted border border-terminal-border rounded hover:border-terminal-red/40 hover:text-terminal-red transition-colors"
              >
                CLR
              </button>
            )}
          </div>
          <p className="mt-2 text-terminal-faint text-xs font-mono">
            Stored in localStorage only. Sent directly to Anthropic — never proxied.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${settings.apiKey ? 'bg-terminal-green' : 'bg-terminal-red'}`}
            />
            <span
              className={`text-xs font-mono ${settings.apiKey ? 'text-terminal-green' : 'text-terminal-red'}`}
            >
              {settings.apiKey ? 'CONFIGURED' : 'NOT SET'}
            </span>
          </div>
        </Section>

        {/* Model */}
        <Section title="MODEL">
          <div className="space-y-2 mt-1.5">
            {MODELS.map(m => (
              <label
                key={m.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded border cursor-pointer transition-colors ${
                  settings.model === m.id
                    ? 'border-terminal-amber/50 bg-terminal-amber/5'
                    : 'border-terminal-border hover:border-terminal-border/70 hover:bg-terminal-surface2'
                }`}
              >
                <input
                  type="radio"
                  name="model"
                  value={m.id}
                  checked={settings.model === m.id}
                  onChange={() => updateSettings({ model: m.id })}
                  className="shrink-0 accent-amber-500"
                />
                <div className="min-w-0">
                  <div
                    className={`text-xs font-mono font-semibold ${
                      settings.model === m.id ? 'text-terminal-amber' : 'text-terminal-text'
                    }`}
                  >
                    {m.label}
                  </div>
                  <div className="text-terminal-faint text-xs font-mono truncate">{m.note}</div>
                </div>
              </label>
            ))}
          </div>
        </Section>

        {/* Generation parameters */}
        <Section title="GENERATION">
          <div className="space-y-5 mt-1.5">
            <SliderField
              label="Max Tokens"
              value={settings.maxTokens}
              min={256}
              max={8192}
              step={256}
              onChange={v => updateSettings({ maxTokens: v })}
              display={settings.maxTokens.toLocaleString()}
            />
            <SliderField
              label="Temperature"
              value={settings.temperature}
              min={0}
              max={1}
              step={0.05}
              onChange={v => updateSettings({ temperature: parseFloat(v.toFixed(2)) })}
              display={settings.temperature.toFixed(2)}
            />
          </div>
        </Section>

        {/* System prompt */}
        <Section title="SYSTEM PROMPT">
          <FieldLabel>Persona / Context</FieldLabel>
          <textarea
            value={settings.systemPrompt}
            onChange={e => updateSettings({ systemPrompt: e.target.value })}
            rows={7}
            placeholder="Define Claude's persona and context for all conversations…"
            className="mt-1.5 w-full bg-terminal-surface2 border border-terminal-border rounded px-3 py-2 text-xs font-mono text-terminal-text placeholder-terminal-faint outline-none focus:border-terminal-amber/40 transition-colors resize-none"
          />
          <p className="mt-1.5 text-terminal-faint text-xs font-mono">
            Sent as the <code className="text-terminal-amber">system</code> parameter on every
            request. Applied globally across all conversations.
          </p>
        </Section>

        {/* Status summary */}
        <Section title="STATUS">
          <div className="mt-1.5 divide-y divide-terminal-border/40">
            <StatusRow label="API key" ok={!!settings.apiKey} value={settings.apiKey ? 'CONFIGURED' : 'MISSING'} />
            <StatusRow label="Model" ok value={settings.model} />
            <StatusRow label="Max tokens" ok value={settings.maxTokens.toLocaleString()} />
            <StatusRow label="Temperature" ok value={settings.temperature.toFixed(2)} />
            <StatusRow
              label="System prompt"
              ok={settings.systemPrompt.length > 0}
              value={settings.systemPrompt.length > 0 ? `${settings.systemPrompt.length} chars` : 'EMPTY'}
            />
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-terminal-amber text-xs font-mono font-bold tracking-widest">
          {title}
        </span>
        <div className="flex-1 h-px bg-terminal-border" />
      </div>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-terminal-muted text-xs font-mono uppercase tracking-wider">
      {children}
    </div>
  )
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  display: string
}) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div>
      <div className="flex justify-between mb-2">
        <FieldLabel>{label}</FieldLabel>
        <span className="text-terminal-amber text-xs font-mono">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, #f59e0b ${pct}%, #222 ${pct}%)`,
        }}
        className="w-full"
      />
      <div className="flex justify-between mt-1">
        <span className="text-terminal-faint text-xs font-mono">{min}</span>
        <span className="text-terminal-faint text-xs font-mono">{max}</span>
      </div>
    </div>
  )
}

function StatusRow({
  label,
  ok,
  value,
}: {
  label: string
  ok: boolean
  value: string
}) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-terminal-muted text-xs font-mono">{label}</span>
      <span className={`text-xs font-mono ${ok ? 'text-terminal-green' : 'text-terminal-red'}`}>
        {value}
      </span>
    </div>
  )
}
