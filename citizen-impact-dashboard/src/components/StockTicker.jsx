import React, { useEffect, useRef } from 'react'

export default function StockTicker({ stocks }) {
  const trackRef = useRef(null)

  // Duplicate items so the scroll loops seamlessly
  const items = [...stocks, ...stocks]

  return (
    <div style={{
      background: 'var(--dark-blue)',
      borderBottom: '2px solid var(--gold)',
      overflow: 'hidden',
      padding: '0',
      height: 38,
      display: 'flex',
      alignItems: 'center',
    }}>
      <div style={{
        background: 'var(--gold)',
        color: 'var(--dark-blue)',
        fontWeight: 800,
        fontSize: '0.72rem',
        padding: '0 0.9rem',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}>LIVE</div>

      <div style={{ overflow: 'hidden', flex: 1, position: 'relative' }}>
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            gap: '2.5rem',
            padding: '0 1.5rem',
            animation: 'tickerScroll 40s linear infinite',
            whiteSpace: 'nowrap',
          }}
        >
          {items.map((s, i) => {
            const up    = s.change_pct > 0
            const down  = s.change_pct < 0
            const color = up ? '#4ade80' : down ? '#f87171' : '#94a3b8'
            const arrow = up ? '▲' : down ? '▼' : '—'

            return (
              <span key={i} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                color: 'rgba(255,255,255,0.9)',
              }}>
                <span style={{ fontWeight: 700, color: 'var(--light-blue)' }}>
                  {s.name}
                </span>
                <span style={{ fontWeight: 600 }}>{s.price.toLocaleString()}</span>
                <span style={{ color, fontWeight: 700 }}>
                  {arrow} {s.change_pct > 0 ? '+' : ''}{s.change_pct.toFixed(2)}%
                </span>
              </span>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
