import { useState, useEffect } from 'react'
import { testKey } from '../lib/models'
import { clearHistory } from '../lib/memory'
import { resetMemories } from '../lib/memory'

const DEFAULT_SETTINGS = {
  claudeKey:     '',
  openaiKey:     '',
  groqKey:       '',
  customPersona: '',
  autoRoute:     true,
  forcedModel:   'claude',
}

function load() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('itayai_settings') || '{}') } }
  catch { return DEFAULT_SETTINGS }
}

function KeyField({ label, modelKey, value, onChange, color }) {
  const [show, setShow]     = useState(false)
  const [status, setStatus] = useState(null) // null | 'ok' | 'err' | 'testing'
  const [errMsg, setErrMsg] = useState('')

  const test = async () => {
    if (!value.trim()) return
    setStatus('testing')
    const res = await testKey(modelKey, value.trim())
    setStatus(res.ok ? 'ok' : 'err')
    setErrMsg(res.error || '')
    setTimeout(() => setStatus(null), 4000)
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-mono tracking-wider" style={{ color }}>
          {label}
        </label>
        {status === 'ok'      && <span className="text-xs font-mono" style={{ color: '#10b981' }}>✓ תקין</span>}
        {status === 'err'     && <span className="text-xs font-mono" style={{ color: '#ef4444' }} title={errMsg}>✗ שגיאה</span>}
        {status === 'testing' && <span className="text-xs font-mono animate-pulse" style={{ color: '#64748b' }}>בדיקה...</span>}
      </div>
      <div className="flex gap-2">
        <div
          className="flex-1 flex items-center rounded-lg overflow-hidden transition-all"
          style={{ background: '#0a0a1a', border: '1px solid #1a1a3e' }}
        >
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`הדבק ${label} key...`}
            className="flex-1 bg-transparent px-3 py-2 text-xs font-mono outline-none placeholder-muted"
            style={{ color: '#e2e8f0' }}
          />
          {value && (
            <button
              onClick={() => setShow((v) => !v)}
              className="px-2 text-xs font-mono transition-all"
              style={{ color: '#475569' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
            >
              {show ? '🙈' : '👁'}
            </button>
          )}
        </div>
        <button
          onClick={test}
          disabled={!value.trim() || status === 'testing'}
          className="shrink-0 px-3 py-2 text-xs font-mono rounded-lg transition-all"
          style={{
            background: value.trim() ? `${color}15` : '#1a1a3e',
            color: value.trim() ? color : '#334155',
            border: `1px solid ${value.trim() ? `${color}40` : '#1a1a3e'}`,
            cursor: value.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          בדוק
        </button>
      </div>
    </div>
  )
}

export default function Settings() {
  const [s, setS]               = useState(load)
  const [saved, setSaved]       = useState(false)
  const [showDanger, setShowDanger] = useState(false)

  const update = (key, val) => setS((prev) => ({ ...prev, [key]: val }))

  const save = () => {
    localStorage.setItem('itayai_settings', JSON.stringify(s))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Auto-save on change
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem('itayai_settings', JSON.stringify(s))
    }, 500)
    return () => clearTimeout(t)
  }, [s])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="shrink-0 flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid #1a1a3e', background: '#07071a' }}
      >
        <div>
          <div className="font-mono font-bold text-sm" style={{ color: '#6366f1' }}>⚙ הגדרות</div>
          <div className="font-mono text-xs mt-0.5" style={{ color: '#334155' }}>
            {saved ? '✓ נשמר' : 'שמירה אוטומטית'}
          </div>
        </div>
        <button
          onClick={save}
          className="px-4 py-1.5 text-xs font-mono font-bold rounded-lg transition-all"
          style={{
            background: saved ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
            color: saved ? '#10b981' : '#6366f1',
            border: `1px solid ${saved ? 'rgba(16,185,129,0.35)' : 'rgba(99,102,241,0.35)'}`,
          }}
        >
          {saved ? '✓ נשמר' : 'שמור'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-8">
        {/* API Keys */}
        <section>
          <SectionTitle>🔑 API KEYS</SectionTitle>
          <KeyField
            label="Anthropic (Claude) — נדרש"
            modelKey="claude"
            value={s.claudeKey}
            onChange={(v) => update('claudeKey', v)}
            color="#f59e0b"
          />
          <KeyField
            label="OpenAI (GPT-4o) — אופציונלי"
            modelKey="gpt"
            value={s.openaiKey}
            onChange={(v) => update('openaiKey', v)}
            color="#10b981"
          />
          <KeyField
            label="Groq (Llama Fast) — אופציונלי"
            modelKey="groq"
            value={s.groqKey}
            onChange={(v) => update('groqKey', v)}
            color="#22d3ee"
          />
          <p className="text-xs font-mono mt-2" style={{ color: '#334155' }}>
            🔒 מפתחות מאוחסנים ב-localStorage בדפדפן שלך בלבד. לא נשלחים לשום שרת.
          </p>
        </section>

        {/* Persona */}
        <section>
          <SectionTitle>🤖 PERSONA</SectionTitle>
          <div className="text-xs font-mono mb-2" style={{ color: '#475569' }}>
            ערוך את ה-system prompt של Itay AI (ריק = ברירת מחדל)
          </div>
          <textarea
            value={s.customPersona}
            onChange={(e) => update('customPersona', e.target.value)}
            placeholder="השאר ריק לשימוש ב-persona הברירת מחדל של Itay AI..."
            rows={7}
            className="w-full bg-transparent text-xs font-mono resize-none outline-none rounded-xl px-3 py-3"
            style={{
              background: '#0a0a1a',
              border: '1px solid #1a1a3e',
              color: '#e2e8f0',
              lineHeight: 1.7,
            }}
            onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
            onBlur={(e) => (e.target.style.borderColor = '#1a1a3e')}
          />
        </section>

        {/* Router */}
        <section>
          <SectionTitle>⚡ ROUTER</SectionTitle>
          <div className="flex items-center justify-between p-3 rounded-xl mb-3"
            style={{ background: '#0a0a1a', border: '1px solid #1a1a3e' }}
          >
            <div>
              <div className="text-sm font-mono font-semibold" style={{ color: '#e2e8f0' }}>
                ניתוב אוטומטי
              </div>
              <div className="text-xs font-mono mt-0.5" style={{ color: '#475569' }}>
                מנתב כל שאלה לאחד מ-Claude / GPT-4o / Groq
              </div>
            </div>
            {/* Toggle */}
            <button
              onClick={() => update('autoRoute', !s.autoRoute)}
              className="relative w-12 h-6 rounded-full transition-all shrink-0"
              style={{ background: s.autoRoute ? '#6366f1' : '#1a1a3e', boxShadow: s.autoRoute ? '0 0 10px rgba(99,102,241,0.4)' : 'none' }}
            >
              <span
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                style={{ right: s.autoRoute ? '4px' : '24px' }}
              />
            </button>
          </div>

          {!s.autoRoute && (
            <div>
              <div className="text-xs font-mono mb-2" style={{ color: '#475569' }}>
                מודל קבוע:
              </div>
              <div className="flex gap-2">
                {[
                  { id: 'claude', label: '🧠 Claude', color: '#f59e0b' },
                  { id: 'gpt',    label: '✍️ GPT-4o', color: '#10b981' },
                  { id: 'groq',   label: '⚡ Groq',   color: '#22d3ee' },
                ].map(({ id, label, color }) => (
                  <button
                    key={id}
                    onClick={() => update('forcedModel', id)}
                    className="flex-1 py-2 text-xs font-mono rounded-lg transition-all"
                    style={{
                      background: s.forcedModel === id ? `${color}18` : '#0a0a1a',
                      color: s.forcedModel === id ? color : '#475569',
                      border: `1px solid ${s.forcedModel === id ? `${color}50` : '#1a1a3e'}`,
                      boxShadow: s.forcedModel === id ? `0 0 10px ${color}25` : 'none',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Status */}
        <section>
          <SectionTitle>📊 STATUS</SectionTitle>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1a1a3e' }}>
            {[
              { label: 'Anthropic API', ok: !!s.claudeKey, val: s.claudeKey ? '● CONFIGURED' : '○ NOT SET' },
              { label: 'OpenAI API',    ok: !!s.openaiKey, val: s.openaiKey ? '● CONFIGURED' : '○ NOT SET' },
              { label: 'Groq API',      ok: !!s.groqKey,   val: s.groqKey   ? '● CONFIGURED' : '○ NOT SET' },
              { label: 'ניתוב',        ok: true,           val: s.autoRoute ? 'AUTO ROUTE' : `FIXED: ${s.forcedModel.toUpperCase()}` },
            ].map(({ label, ok, val }) => (
              <div
                key={label}
                className="flex justify-between items-center px-4 py-2.5 text-xs font-mono"
                style={{ borderBottom: '1px solid #1a1a3e' }}
              >
                <span style={{ color: '#64748b' }}>{label}</span>
                <span style={{ color: ok && val !== '○ NOT SET' ? '#10b981' : ok ? '#6366f1' : '#ef4444' }}>{val}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Danger zone */}
        <section>
          <SectionTitle>⚠ DANGER ZONE</SectionTitle>
          {!showDanger ? (
            <button
              onClick={() => setShowDanger(true)}
              className="text-xs font-mono px-3 py-2 rounded-lg transition-all"
              style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)' }}
            >
              הצג אפשרויות מחיקה
            </button>
          ) : (
            <div
              className="p-4 rounded-xl space-y-3"
              style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)' }}
            >
              <DangerBtn
                label="מחק כל ההיסטוריה"
                onConfirm={() => { clearHistory(); alert('היסטוריה נמחקה') }}
              />
              <DangerBtn
                label="אפס זיכרונות לברירת מחדל"
                onConfirm={() => { resetMemories(); alert('זיכרונות אופסו') }}
              />
              <DangerBtn
                label="מחק את כל ה-API keys"
                onConfirm={() => {
                  update('claudeKey', ''); update('openaiKey', ''); update('groqKey', '')
                  alert('מפתחות נמחקו')
                }}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-mono font-bold tracking-widest" style={{ color: '#6366f1' }}>
        {children}
      </span>
      <div className="flex-1 h-px" style={{ background: '#1a1a3e' }} />
    </div>
  )
}

function DangerBtn({ label, onConfirm }) {
  const [confirm, setConfirm] = useState(false)
  return confirm ? (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono" style={{ color: '#ef4444' }}>בטוח?</span>
      <button
        onClick={() => { onConfirm(); setConfirm(false) }}
        className="text-xs font-mono px-3 py-1 rounded"
        style={{ background: '#ef4444', color: '#fff' }}
      >
        כן, מחק
      </button>
      <button
        onClick={() => setConfirm(false)}
        className="text-xs font-mono px-3 py-1 rounded"
        style={{ background: '#1a1a3e', color: '#94a3b8' }}
      >
        בטל
      </button>
    </div>
  ) : (
    <button
      onClick={() => setConfirm(true)}
      className="text-xs font-mono px-3 py-2 rounded-lg w-full text-right transition-all"
      style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', background: 'transparent' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      🗑 {label}
    </button>
  )
}
