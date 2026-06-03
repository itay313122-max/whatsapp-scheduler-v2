import React from 'react'

const ICONS = {
  'אתר B2B':          '🌐',
  'פלטפורמת לקוחות': '📱',
  'אימייל':           '✉️',
  'טלפון':            '📞',
}

export default function DigitalPresence({ company }) {
  const channels = [
    { platform: 'אתר B2B',          url: company.urlB2B,      audience: 'מוסדות פיננסיים', purpose: 'הצגת הפתרון, מכירה' },
    { platform: 'פלטפורמת לקוחות', url: company.urlLanding,   audience: 'אזרחים פרטיים',   purpose: 'גיוס ושימור לקוחות' },
    { platform: 'אימייל',           url: company.email,        audience: 'כל קהל',          purpose: 'יצירת קשר' },
    { platform: 'טלפון',            url: company.phone,        audience: 'כל קהל',          purpose: 'תמיכה' },
  ]

  return (
    <section style={{ padding: '2.5rem 1.5rem 0' }}>
      <h2 style={{
        fontSize: '1.35rem', fontWeight: 700,
        color: 'var(--dark-blue)',
        maxWidth: 1200, margin: '0 auto 1.25rem',
      }}>🌐 נוכחות דיגיטלית</h2>

      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
      }}>
        {channels.map(ch => (
          <div key={ch.platform} style={{
            background: 'var(--white)',
            borderRadius: 12,
            padding: '1.25rem',
            border: '1px solid var(--mid-blue)',
            borderTopWidth: 3,
            boxShadow: '0 2px 10px rgba(37,99,235,0.08)',
          }}>
            <div style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
              {ICONS[ch.platform] || '🔗'}
            </div>
            <div style={{ fontWeight: 700, color: 'var(--dark-blue)', marginBottom: '0.25rem' }}>
              {ch.platform}
            </div>
            <div style={{
              fontSize: '0.78rem', color: 'var(--mid-blue)',
              marginBottom: '0.5rem', wordBreak: 'break-all',
            }}>
              {ch.url}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
              <b>קהל:</b> {ch.audience}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--gray-600)' }}>
              <b>מטרה:</b> {ch.purpose}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
