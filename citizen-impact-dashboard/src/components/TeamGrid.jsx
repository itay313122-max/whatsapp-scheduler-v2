import React from 'react'

function initials(name) {
  return name.replace(/["'״]/g, '').split(' ').slice(0, 2).map(w => w[0]).join('')
}

const AVATAR_COLORS = ['#1A3A5C', '#2563EB', '#10B981', '#F59E0B']

export default function TeamGrid({ team }) {
  return (
    <section id="צוות" style={{ padding: '2.5rem 1.5rem 0' }}>
      <h2 style={{
        fontSize: '1.35rem', fontWeight: 700,
        color: 'var(--dark-blue)',
        maxWidth: 1200, margin: '0 auto 1.25rem',
      }}>👤 צוות מייסדים</h2>

      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.25rem',
      }}>
        {team.map((member, i) => (
          <div key={member.name} style={{
            background: 'var(--white)',
            borderRadius: 14,
            padding: '1.5rem',
            boxShadow: '0 2px 12px rgba(26,58,92,0.08)',
            border: '1px solid var(--gray-200)',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
            transition: 'border-color 0.2s, transform 0.2s',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--gold)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--gray-200)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 52, height: 52,
                borderRadius: '50%',
                background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '1.1rem',
                flexShrink: 0,
              }}>{initials(member.name)}</div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--dark-blue)' }}>
                  {member.name}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--mid-blue)', fontWeight: 600 }}>
                  {member.role}
                </div>
              </div>
            </div>

            <div style={{
              fontSize: '0.82rem', color: 'var(--gray-600)',
              borderTop: '1px solid var(--gray-100)', paddingTop: '0.75rem',
            }}>
              {member.expertise}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{
                background: 'var(--light-blue)', color: 'var(--mid-blue)',
                fontSize: '0.75rem', fontWeight: 600,
                padding: '0.2rem 0.6rem', borderRadius: 20,
              }}>{member.years}+ שנה</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
