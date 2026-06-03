import { NavLink, useNavigate } from 'react-router-dom'
import { useChatCtx } from '../lib/chatContext'

const LINKS = [
  { to: '/',         icon: '◈', label: 'CHAT'     },
  { to: '/memory',   icon: '🧠', label: 'MEMORY'   },
  { to: '/agents',   icon: '⚡', label: 'AGENTS'   },
  { to: '/settings', icon: '⚙', label: 'SETTINGS' },
]

function getSettings() {
  try { return JSON.parse(localStorage.getItem('itayai_settings') || '{}') }
  catch { return {} }
}

export default function Sidebar({ onClose }) {
  const navigate = useNavigate()
  const { clearChat } = useChatCtx()
  const s = getSettings()

  const modelStatus = [
    { model: 'Claude', ok: !!s.claudeKey, color: '#f59e0b' },
    { model: 'GPT',    ok: !!s.openaiKey, color: '#10b981' },
    { model: 'Groq',   ok: !!s.groqKey,   color: '#22d3ee' },
  ]

  const handleNewChat = () => {
    clearChat()
    navigate('/')
  }

  return (
    <aside
      className="w-56 shrink-0 flex flex-col h-full"
      style={{ background: '#07071a', borderLeft: '1px solid #1a1a3e' }}
    >
      {/* Logo + mobile close button */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid #1a1a3e' }}>
        <div className="flex items-center justify-between mb-1">
          {onClose && (
            <button
              onClick={onClose}
              className="sm:hidden text-lg font-mono order-first"
              style={{ color: '#475569' }}
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center gap-2.5 mb-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)', boxShadow: '0 0 14px rgba(99,102,241,0.5)' }}
          >
            🤖
          </div>
          <div>
            <div className="font-mono font-bold text-sm tracking-wider" style={{ color: '#6366f1' }}>
              ITAY AI
            </div>
            <div className="font-mono text-xs" style={{ color: '#334155' }}>
              Personal AI System
            </div>
          </div>
        </div>

        {/* Model status dots */}
        <div className="flex items-center gap-2 mt-2.5">
          {modelStatus.map(({ model, ok, color }) => (
            <div key={model} className="flex items-center gap-1" title={`${model}: ${ok ? 'מוגדר' : 'חסר'}`}>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: ok ? color : '#1a1a3e', boxShadow: ok ? `0 0 6px ${color}` : 'none' }}
              />
              <span className="text-xs font-mono" style={{ color: ok ? color : '#334155', fontSize: '0.6rem' }}>
                {model}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {LINKS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-mono transition-all animate-slide-in"
            style={({ isActive }) => ({
              color:      isActive ? '#6366f1' : '#64748b',
              background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
              border:     isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
              boxShadow:  isActive ? '0 0 12px rgba(99,102,241,0.15)' : 'none',
            })}
          >
            <span className="text-base">{icon}</span>
            <span className="tracking-wider">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* New chat */}
      <div className="px-3 pb-4" style={{ borderTop: '1px solid #1a1a3e', paddingTop: '12px' }}>
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider transition-all"
          style={{
            color: '#6366f1',
            border: '1px solid rgba(99,102,241,0.35)',
            background: 'rgba(99,102,241,0.06)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.15)'
            e.currentTarget.style.boxShadow  = '0 0 14px rgba(99,102,241,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.06)'
            e.currentTarget.style.boxShadow  = 'none'
          }}
        >
          <span className="text-lg leading-none">+</span>
          <span>NEW CHAT</span>
        </button>
      </div>
    </aside>
  )
}
