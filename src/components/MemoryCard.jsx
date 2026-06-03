export default function MemoryCard({ text, index, onDelete }) {
  return (
    <div
      className="group relative p-3 rounded-lg text-sm font-mono transition-all animate-fade-up"
      style={{
        background: '#0a0a1a',
        border: '1px solid #1a1a3e',
        color: '#cbd5e1',
        lineHeight: 1.6,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#6366f1'
        e.currentTarget.style.boxShadow = '0 0 12px rgba(99,102,241,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#1a1a3e'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div className="flex items-start gap-2">
        <span style={{ color: '#6366f1', fontSize: '0.7rem', marginTop: '0.15rem' }}>
          #{String(index + 1).padStart(2, '0')}
        </span>
        <span className="flex-1 leading-relaxed" style={{ color: '#e2e8f0' }}>
          {text}
        </span>
      </div>

      <button
        onClick={() => onDelete(index)}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-all text-xs w-6 h-6 rounded flex items-center justify-center"
        style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
        title="מחק זיכרון"
      >
        ×
      </button>
    </div>
  )
}
