import React, { useEffect, useRef, useState } from 'react'

function KPICard({ kpi, index }) {
  const [animated, setAnimated] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimated(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const colors = ['var(--mid-blue)', 'var(--gold)', 'var(--green)']
  const color = colors[index % colors.length]

  return (
    <div ref={ref} style={{
      background: 'var(--white)',
      borderRadius: 14,
      padding: '1.5rem',
      boxShadow: '0 2px 12px rgba(26,58,92,0.08)',
      border: '1px solid var(--gray-200)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,58,92,0.14)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(26,58,92,0.08)'
      }}
    >
      <div style={{
        fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-600)',
        marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        {kpi.label}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.25rem', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '3rem', fontWeight: 800, color, lineHeight: 1 }}>
          {kpi.value}
        </span>
        <span style={{ fontSize: '1.5rem', fontWeight: 700, color, marginBottom: '0.3rem' }}>
          {kpi.unit}
        </span>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
        {kpi.desc}
      </div>

      <div style={{
        height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: animated ? `${kpi.value}%` : '0%',
          background: color,
          borderRadius: 4,
          transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: `${index * 0.15}s`,
        }} />
      </div>
    </div>
  )
}

export default function KPICards({ kpis }) {
  return (
    <section id="KPIs" style={{ padding: '2.5rem 1.5rem 0' }}>
      <SectionTitle>📊 KPIs מוכחים</SectionTitle>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} kpi={kpi} index={i} />
        ))}
      </div>
    </section>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontSize: '1.35rem', fontWeight: 700,
      color: 'var(--dark-blue)',
      marginBottom: '1.25rem',
      maxWidth: 1200, margin: '0 auto 1.25rem',
      display: 'flex', alignItems: 'center', gap: '0.5rem',
    }}>{children}</h2>
  )
}
