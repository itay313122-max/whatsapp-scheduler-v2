import React from 'react'

export default function Header({ company }) {
  return (
    <header style={{
      background: 'var(--dark-blue)',
      color: 'var(--white)',
      padding: '0 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        padding: '0.9rem 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 42, height: 42,
            background: 'var(--gold)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 18, color: 'var(--dark-blue)',
            flexShrink: 0,
          }}>CI</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.15rem', lineHeight: 1.2 }}>
              {company.name}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.75, fontWeight: 400 }}>
              {company.nameHe}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
        }}>
          {['FinTech', 'AI פיננסי', 'תל אביב 2021'].map(tag => (
            <span key={tag} style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: 20,
              padding: '0.2rem 0.7rem',
              fontSize: '0.72rem',
              fontWeight: 500,
            }}>{tag}</span>
          ))}
        </div>

        <nav style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {['KPIs', 'מוצר', 'צוות', 'פרויקטים'].map(item => (
            <a key={item} href={`#${item}`} style={{
              color: 'rgba(255,255,255,0.82)',
              textDecoration: 'none',
              padding: '0.35rem 0.75rem',
              borderRadius: 6,
              fontSize: '0.85rem',
              fontWeight: 500,
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.target.style.background = 'transparent'}
            >{item}</a>
          ))}
        </nav>
      </div>
    </header>
  )
}
