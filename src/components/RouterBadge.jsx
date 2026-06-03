const MODELS = {
  claude: { icon: '🧠', label: 'Claude',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)' },
  gpt:    { icon: '✍️',  label: 'GPT-4o', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)'  },
  groq:   { icon: '⚡',  label: 'Groq',   color: '#22d3ee', bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.35)'  },
  error:  { icon: '❌',  label: 'Error',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)'  },
}

export default function RouterBadge({ route }) {
  if (!route) return null
  const cfg = MODELS[route.model] || MODELS.claude

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono animate-badge-pop"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <span>{cfg.icon}</span>
      <span className="font-semibold">{cfg.label}</span>
      {route.reason && (
        <>
          <span style={{ color: '#475569' }}>—</span>
          <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{route.reason}</span>
        </>
      )}
    </div>
  )
}
