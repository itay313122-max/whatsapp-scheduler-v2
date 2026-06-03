export default function AgentCard({ agent, onActivate }) {
  return (
    <div
      className="p-4 rounded-xl cursor-pointer transition-all group animate-fade-up"
      style={{
        background: '#0a0a1a',
        border: `1px solid #1a1a3e`,
      }}
      onClick={onActivate}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = agent.color
        e.currentTarget.style.boxShadow = `0 0 20px ${agent.color}22`
        e.currentTarget.style.background = `${agent.color}08`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#1a1a3e'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.background = '#0a0a1a'
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
          style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}40` }}
        >
          {agent.icon}
        </div>
        <div>
          <div className="font-mono font-semibold text-sm" style={{ color: agent.color }}>
            {agent.title}
          </div>
          <div className="text-xs font-mono" style={{ color: '#64748b' }}>
            {agent.description}
          </div>
        </div>
        {/* Claude badge */}
        <div className="mr-auto">
          <span
            className="text-xs font-mono px-2 py-0.5 rounded-full"
            style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            🧠 Claude
          </span>
        </div>
      </div>

      {/* Activate button */}
      <button
        className="w-full py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all"
        style={{
          background: `${agent.color}18`,
          color: agent.color,
          border: `1px solid ${agent.color}40`,
        }}
        onClick={onActivate}
      >
        ▶ הפעל Agent
      </button>
    </div>
  )
}
