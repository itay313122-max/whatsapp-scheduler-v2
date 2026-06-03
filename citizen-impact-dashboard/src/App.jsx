import React from 'react'
import { COMPANY, KPIS, STEPS, TEAM, INVESTORS, PROJECTS } from './data/data.js'
import Header from './components/Header.jsx'
import KPICards from './components/KPICards.jsx'
import KPIChart from './components/KPIChart.jsx'
import StepsTimeline from './components/StepsTimeline.jsx'
import TeamGrid from './components/TeamGrid.jsx'
import InvestorsGrid from './components/InvestorsGrid.jsx'
import ProjectsTable from './components/ProjectsTable.jsx'
import DigitalPresence from './components/DigitalPresence.jsx'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <Header company={COMPANY} />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--dark-blue) 0%, #1e4d7b 100%)',
        color: 'var(--white)',
        padding: '3rem 1.5rem',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{
            fontSize: '0.8rem', fontWeight: 600,
            color: 'var(--gold)', letterSpacing: '0.1em',
            textTransform: 'uppercase', marginBottom: '0.75rem',
          }}>
            FinTech · AI פיננסי · {COMPANY.founded}
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '1rem' }}>
            {COMPANY.nameHe}
          </h1>
          <p style={{ fontSize: '1.05rem', opacity: 0.85, lineHeight: 1.65, marginBottom: '1.5rem' }}>
            פלטפורמת AI לחוסן פיננסי — מזהה, מנבאת ומנחה משפחות לשיקום פיננסי אמיתי
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`https://${COMPANY.urlB2B}`} target="_blank" rel="noopener noreferrer"
              style={{
                background: 'var(--gold)', color: 'var(--dark-blue)',
                padding: '0.6rem 1.4rem', borderRadius: 8,
                fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
              }}>B2B — {COMPANY.urlB2B}</a>
            <a href={`mailto:${COMPANY.email}`}
              style={{
                background: 'rgba(255,255,255,0.15)', color: 'var(--white)',
                padding: '0.6rem 1.4rem', borderRadius: 8,
                fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.3)',
              }}>{COMPANY.email}</a>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main style={{ paddingBottom: '4rem' }}>
        <KPICards kpis={KPIS} />
        <KPIChart kpis={KPIS} />
        <StepsTimeline steps={STEPS} />
        <TeamGrid team={TEAM} />
        <InvestorsGrid investors={INVESTORS} />
        <ProjectsTable projects={PROJECTS} />
        <DigitalPresence company={COMPANY} />
      </main>

      {/* Footer */}
      <footer style={{
        background: 'var(--dark-blue)',
        color: 'rgba(255,255,255,0.65)',
        textAlign: 'center',
        padding: '1.25rem',
        fontSize: '0.8rem',
      }}>
        © 2021–2025 {COMPANY.name} · {COMPANY.phone} · {COMPANY.email}
      </footer>
    </div>
  )
}
