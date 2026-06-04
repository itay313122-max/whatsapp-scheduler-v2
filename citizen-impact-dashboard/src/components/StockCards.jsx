import React from 'react'

const SIGNAL_STYLE = {
  BUY:  { bg: 'rgba(16,185,129,0.15)', text: '#10B981', border: 'rgba(16,185,129,0.4)' },
  HOLD: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B', border: 'rgba(245,158,11,0.4)' },
  SELL: { bg: 'rgba(239,68,68,0.15)',  text: '#EF4444', border: 'rgba(239,68,68,0.4)'  },
}

function SignalBadge({ signal }) {
  const s = SIGNAL_STYLE[signal] || SIGNAL_STYLE.HOLD
  return (
    <span style={{
      background: s.bg,
      color: s.text,
      border: `1px solid ${s.border}`,
      fontSize: '0.7rem',
      fontWeight: 800,
      padding: '0.15rem 0.55rem',
      borderRadius: 20,
      letterSpacing: '0.05em',
    }}>{signal}</span>
  )
}

export default function StockCards({ stocks }) {
  return (
    <section style={{ padding: '2.5rem 1.5rem 0' }}>
      <h2 style={{
        fontSize: '1.35rem', fontWeight: 700,
        color: 'var(--dark-blue)',
        maxWidth: 1200, margin: '0 auto 1.25rem',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        📊 מניות ושווקים
        <span style={{
          fontSize: '0.72rem', fontWeight: 600,
          background: 'var(--light-blue)', color: 'var(--mid-blue)',
          padding: '0.15rem 0.6rem', borderRadius: 20,
        }}>LIVE DATA</span>
      </h2>

      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '1rem',
      }}>
        {stocks.map(s => {
          const up   = s.change_pct > 0
          const down = s.change_pct < 0
          const priceColor = up ? '#10B981' : down ? '#EF4444' : '#94A3B8'
          const arrow = up ? '▲' : down ? '▼' : '—'

          return (
            <div key={s.symbol} style={{
              background: 'var(--white)',
              borderRadius: 12,
              padding: '1rem',
              border: '1px solid var(--gray-200)',
              boxShadow: '0 1px 6px rgba(26,58,92,0.07)',
              transition: 'transform 0.15s, box-shadow 0.15s',
              cursor: 'default',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(26,58,92,0.12)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 6px rgba(26,58,92,0.07)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '0.5rem',
              }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--gray-600)', fontWeight: 600 }}>
                  {s.symbol}
                </div>
                <SignalBadge signal={s.signal} />
              </div>

              <div style={{
                fontWeight: 700, fontSize: '0.88rem',
                color: 'var(--dark-blue)', marginBottom: '0.5rem',
                lineHeight: 1.3,
              }}>{s.name}</div>

              <div style={{
                fontSize: '1.3rem', fontWeight: 800,
                color: priceColor, lineHeight: 1,
              }}>
                {s.price > 0 ? s.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                marginTop: '0.35rem', fontSize: '0.82rem',
                fontWeight: 700, color: priceColor,
              }}>
                <span>{arrow}</span>
                <span>{s.change_pct > 0 ? '+' : ''}{s.change_pct.toFixed(2)}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
