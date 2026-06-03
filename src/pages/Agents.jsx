import { useState } from 'react'
import AgentCard from '../components/AgentCard'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { callClaude } from '../lib/models'
import { buildSystemPrompt } from '../lib/persona'
import { getMemories } from '../lib/memory'

const AGENTS = [
  {
    id: 'realestate',
    icon: '🏠',
    title: 'נדל"ן אנליסט',
    description: 'ניתוח נכסים, שכונות ותשואות',
    placeholder: 'תאר את הנכס: מיקום, מחיר, גודל, מצב...',
    system: 'אתה מנתח נדל"ן ישראלי מומחה עם 20 שנות ניסיון. אתה מנתח נכסים, שכונות, מחשב תשואות ומספק המלצות השקעה מבוססות נתונים. אתה מכיר את שוק הנדל"ן הישראלי לעומק. תמיד כלול: ניתוח מחיר, פוטנציאל השכרה, סיכונים, והמלצה סופית.',
    color: '#10b981',
  },
  {
    id: 'trading',
    icon: '📈',
    title: 'Trading Scout',
    description: 'ניתוח שוק ומזהה הזדמנויות',
    placeholder: 'סמל נכס + שאלה (למשל: NVDA — האם לקנות עכשיו?)',
    system: 'אתה מנתח שוק פיננסי מומחה. אתה מנתח מניות, מטבעות קריפטו ופורקס. אתה מספק ניתוח טכני ופונדמנטלי, מזהה patterns, רמות support/resistance, ומסיק המלצות ברורות. תמיד כלול: מגמה, רמות מפתח, risk/reward, ומסקנה.',
    color: '#f59e0b',
  },
  {
    id: 'startup',
    icon: '🚀',
    title: 'Startup Advisor',
    description: 'Validation, GTM, Pricing, Pitch',
    placeholder: 'תאר את הרעיון שלך: מה הוא, למי, ומה הבעיה שהוא פותר...',
    system: 'אתה יועץ סטארטאפים מנוסה שעבד עם 100+ סטארטאפים. אתה עוזר ב-product-market fit, GTM strategy, pricing, ו-pitch deck. תמיד כלול: SWOT analysis, ICP, go-to-market plan, המלצות pricing, ו-3 next steps קונקרטיים.',
    color: '#6366f1',
  },
  {
    id: 'codereview',
    icon: '💻',
    title: 'Code Reviewer',
    description: 'מוצא באגים, מציע שיפורים, מסביר',
    placeholder: 'הדבק קוד + תאר מה הוא אמור לעשות ומה הבעיה...',
    system: 'אתה code reviewer בכיר עם 15+ שנות ניסיון ב-Node.js, Python, React. אתה מוצא באגים, בעיות ביצועים, security issues, ומציע refactoring. תמיד כלול: רשימת בעיות ממוינת לפי חומרה, קוד מתוקן מלא, והסבר על כל תיקון.',
    color: '#22d3ee',
  },
]

function AgentModal({ agent, onClose }) {
  const [input, setInput]     = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [copied, setCopied]     = useState(false)

  const run = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    setError('')
    setResponse('')

    try {
      const s = JSON.parse(localStorage.getItem('itayai_settings') || '{}')
      if (!s.claudeKey) throw new Error('חסר Anthropic API key — הוסף בהגדרות')

      const memories    = getMemories()
      const sysPrompt   = buildSystemPrompt(memories, agent.system)
      const result      = await callClaude(
        [{ role: 'user', content: input }],
        sysPrompt,
        s.claudeKey
      )
      setResponse(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(response)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,5,16,0.9)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden animate-fade-up"
        style={{ background: '#07071a', border: `1px solid ${agent.color}50`, boxShadow: `0 0 40px ${agent.color}20` }}
      >
        {/* Modal header */}
        <div
          className="shrink-0 flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${agent.color}25` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
              style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}40` }}
            >
              {agent.icon}
            </div>
            <div>
              <div className="font-mono font-bold text-sm" style={{ color: agent.color }}>
                {agent.title}
              </div>
              <div className="font-mono text-xs" style={{ color: '#475569' }}>
                {agent.description}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-lg transition-all"
            style={{ color: '#475569', background: '#1a1a3e' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
          >
            ×
          </button>
        </div>

        {/* Input */}
        <div className="shrink-0 p-4" style={{ borderBottom: '1px solid #1a1a3e' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={agent.placeholder}
            rows={4}
            className="w-full bg-transparent text-sm font-mono resize-none outline-none rounded-lg px-3 py-2"
            style={{ border: '1px solid #1a1a3e', color: '#e2e8f0', lineHeight: 1.6 }}
            onFocus={(e) => (e.target.style.borderColor = agent.color)}
            onBlur={(e) => (e.target.style.borderColor = '#1a1a3e')}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={run}
              disabled={!input.trim() || loading}
              className="px-5 py-2 rounded-lg text-sm font-mono font-bold tracking-wide transition-all"
              style={{
                background: !input.trim() || loading ? '#1a1a3e' : agent.color,
                color: !input.trim() || loading ? '#334155' : '#050510',
                cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                boxShadow: input.trim() && !loading ? `0 0 16px ${agent.color}50` : 'none',
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="dot-1 inline-block w-1.5 h-1.5 rounded-full bg-current" />
                  <span className="dot-2 inline-block w-1.5 h-1.5 rounded-full bg-current" />
                  <span className="dot-3 inline-block w-1.5 h-1.5 rounded-full bg-current" />
                </span>
              ) : (
                '▶ הפעל'
              )}
            </button>
          </div>
        </div>

        {/* Response */}
        {(response || error) && (
          <div className="flex-1 overflow-y-auto p-4">
            {error ? (
              <div
                className="text-sm font-mono p-3 rounded-lg"
                style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                ❌ {error}
              </div>
            ) : (
              <div className="relative group">
                <div
                  className="text-sm p-4 rounded-xl ai-md"
                  style={{ background: '#0a0a1a', border: `1px solid ${agent.color}25`, color: '#e2e8f0', fontFamily: 'Georgia, serif', lineHeight: 1.7 }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{response}</ReactMarkdown>
                </div>
                <button
                  onClick={copy}
                  className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-all text-xs px-2 py-0.5 rounded"
                  style={{ background: '#1a1a3e', color: copied ? '#10b981' : '#64748b', border: '1px solid #2a2a5e' }}
                >
                  {copied ? '✓ הועתק' : '⎘ העתק'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Agents() {
  const [activeAgent, setActiveAgent] = useState(null)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="shrink-0 px-5 py-3"
        style={{ borderBottom: '1px solid #1a1a3e', background: '#07071a' }}
      >
        <div className="font-mono font-bold text-sm" style={{ color: '#6366f1' }}>
          ⚡ Agents
        </div>
        <div className="font-mono text-xs mt-0.5" style={{ color: '#334155' }}>
          AI agents מומחים — כולם מופעלים על Claude
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {AGENTS.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onActivate={() => setActiveAgent(agent)}
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      {activeAgent && (
        <AgentModal agent={activeAgent} onClose={() => setActiveAgent(null)} />
      )}
    </div>
  )
}
