import React, { useState } from 'react'

function timeAgo(isoStr) {
  if (!isoStr) return ''
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000)
  if (diff < 1)   return 'עכשיו'
  if (diff < 60)  return `לפני ${diff} דק'`
  const h = Math.floor(diff / 60)
  if (h < 24) return `לפני ${h} ש'`
  return `לפני ${Math.floor(h / 24)} ימים`
}

export default function NewsFeed({ news }) {
  const [filter, setFilter] = useState('all')

  const shown = news.filter(n =>
    filter === 'all' ? true : n.relevance === filter
  )

  const highCount   = news.filter(n => n.relevance === 'high').length
  const mediumCount = news.filter(n => n.relevance === 'medium').length

  return (
    <section style={{ padding: '2.5rem 1.5rem 0' }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
        marginBottom: '1.25rem',
      }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--dark-blue)', margin: 0 }}>
          📰 פיד חדשות פיננסיות
        </h2>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { key: 'all',    label: `הכל (${news.length})` },
            { key: 'high',   label: `🔴 גבוה (${highCount})` },
            { key: 'medium', label: `🟡 בינוני (${mediumCount})` },
          ].map(btn => (
            <button key={btn.key} onClick={() => setFilter(btn.key)} style={{
              padding: '0.3rem 0.85rem',
              borderRadius: 20,
              border: '1px solid',
              borderColor: filter === btn.key ? 'var(--mid-blue)' : 'var(--gray-200)',
              background: filter === btn.key ? 'var(--mid-blue)' : 'var(--white)',
              color: filter === btn.key ? 'var(--white)' : 'var(--gray-600)',
              fontSize: '0.78rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Heebo',
              transition: 'all 0.15s',
            }}>{btn.label}</button>
          ))}
        </div>
      </div>

      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1rem',
      }}>
        {shown.map((item, i) => (
          <a key={i}
            href={item.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              background: 'var(--white)',
              borderRadius: 12,
              padding: '1rem 1.1rem',
              border: '1px solid var(--gray-200)',
              boxShadow: '0 1px 6px rgba(26,58,92,0.06)',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'border-color 0.15s, transform 0.15s',
              borderRight: `3px solid ${item.relevance === 'high' ? '#EF4444' : '#F59E0B'}`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--mid-blue)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--gray-200)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderRightColor = item.relevance === 'high' ? '#EF4444' : '#F59E0B'
            }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '0.5rem', gap: '0.5rem',
            }}>
              <span style={{
                background: item.relevance === 'high'
                  ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                color: item.relevance === 'high' ? '#DC2626' : '#D97706',
                border: `1px solid ${item.relevance === 'high' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                fontSize: '0.68rem', fontWeight: 700,
                padding: '0.1rem 0.5rem', borderRadius: 20,
                flexShrink: 0,
              }}>
                {item.relevance === 'high' ? 'רלוונטיות גבוהה' : 'רלוונטיות בינונית'}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--gray-600)', flexShrink: 0 }}>
                {timeAgo(item.published)}
              </span>
            </div>

            <div style={{
              fontWeight: 600, fontSize: '0.88rem',
              color: 'var(--dark-blue)', lineHeight: 1.45,
              marginBottom: '0.5rem',
            }}>{item.title}</div>

            <div style={{
              fontSize: '0.73rem', color: 'var(--mid-blue)',
              fontWeight: 600,
            }}>{item.source}</div>
          </a>
        ))}
      </div>
    </section>
  )
}
