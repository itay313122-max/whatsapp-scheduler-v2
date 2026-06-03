import React, { useState } from 'react'

export default function ProjectsTable({ projects }) {
  const [hovered, setHovered] = useState(null)

  return (
    <section id="פרויקטים" style={{ padding: '2.5rem 1.5rem 0' }}>
      <h2 style={{
        fontSize: '1.35rem', fontWeight: 700,
        color: 'var(--dark-blue)',
        maxWidth: 1200, margin: '0 auto 1.25rem',
      }}>🚀 פרויקטים פעילים</h2>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Desktop table */}
        <div style={{
          background: 'var(--white)',
          borderRadius: 14,
          boxShadow: '0 2px 12px rgba(26,58,92,0.08)',
          border: '1px solid var(--gray-200)',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
            <thead>
              <tr style={{ background: 'var(--dark-blue)' }}>
                {['פרויקט', 'קהל יעד', 'URL', 'סטטוס'].map(h => (
                  <th key={h} style={{
                    padding: '0.85rem 1.1rem',
                    textAlign: 'right',
                    color: 'var(--white)',
                    fontWeight: 700, fontSize: '0.85rem',
                    fontFamily: 'Heebo',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((proj, i) => (
                <tr key={proj.name}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: hovered === i
                      ? 'var(--light-blue)'
                      : i % 2 === 0 ? 'var(--white)' : 'var(--gray-50)',
                    transition: 'background 0.15s',
                  }}
                >
                  <td style={{
                    padding: '0.85rem 1.1rem',
                    fontWeight: 700, fontSize: '0.9rem',
                    color: 'var(--dark-blue)',
                    borderBottom: '1px solid var(--gray-100)',
                  }}>{proj.name}</td>

                  <td style={{
                    padding: '0.85rem 1.1rem',
                    fontSize: '0.88rem', color: 'var(--gray-600)',
                    borderBottom: '1px solid var(--gray-100)',
                  }}>{proj.audience}</td>

                  <td style={{
                    padding: '0.85rem 1.1rem',
                    borderBottom: '1px solid var(--gray-100)',
                  }}>
                    <a
                      href={`https://${proj.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--mid-blue)',
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                      onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.target.style.textDecoration = 'none'}
                    >{proj.url}</a>
                  </td>

                  <td style={{
                    padding: '0.85rem 1.1rem',
                    borderBottom: '1px solid var(--gray-100)',
                  }}>
                    <span style={{
                      background: 'rgba(16,185,129,0.12)',
                      color: 'var(--green)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      fontSize: '0.75rem', fontWeight: 700,
                      padding: '0.2rem 0.7rem',
                      borderRadius: 20,
                    }}>{proj.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
