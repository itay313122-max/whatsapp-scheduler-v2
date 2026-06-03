import React from 'react'

export default function StepsTimeline({ steps }) {
  return (
    <section id="מוצר" style={{ padding: '2.5rem 1.5rem 0' }}>
      <h2 style={{
        fontSize: '1.35rem', fontWeight: 700,
        color: 'var(--dark-blue)',
        maxWidth: 1200, margin: '0 auto 1.5rem',
      }}>🔄 5 שלבי הפלטפורמה</h2>

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        {/* vertical line */}
        <div style={{
          position: 'absolute',
          right: 20, top: 24, bottom: 24,
          width: 2,
          background: 'linear-gradient(to bottom, var(--mid-blue), var(--green))',
          borderRadius: 2,
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {steps.map((step, i) => (
            <div key={step.num} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1.25rem',
              paddingRight: '0',
            }}>
              {/* circle number */}
              <div style={{
                flexShrink: 0,
                width: 42, height: 42,
                borderRadius: '50%',
                background: i === 0 ? 'var(--dark-blue)' : i === steps.length - 1 ? 'var(--green)' : 'var(--mid-blue)',
                color: 'var(--white)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.85rem',
                position: 'relative', zIndex: 1,
                boxShadow: '0 0 0 4px var(--gray-50)',
              }}>{step.num}</div>

              {/* content card */}
              <div style={{
                flex: 1,
                background: 'var(--white)',
                borderRadius: 12,
                padding: '1rem 1.25rem',
                boxShadow: '0 1px 8px rgba(26,58,92,0.07)',
                border: '1px solid var(--gray-200)',
                marginBottom: '0.25rem',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
                  marginBottom: '0.35rem',
                }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--dark-blue)' }}>
                    {step.title}
                  </span>
                  <span style={{
                    background: 'var(--light-blue)',
                    color: 'var(--mid-blue)',
                    fontSize: '0.72rem', fontWeight: 600,
                    padding: '0.15rem 0.6rem',
                    borderRadius: 20,
                    border: '1px solid rgba(37,99,235,0.2)',
                  }}>{step.tech}</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--gray-600)', lineHeight: 1.55 }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
