import React from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { CATEGORY_COLORS } from '../data/data.js'

function buildPieData(investors) {
  const counts = {}
  investors.forEach(inv => {
    counts[inv.category] = (counts[inv.category] || 0) + 1
  })
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--dark-blue)', color: 'var(--white)',
      padding: '0.5rem 0.9rem', borderRadius: 8, fontSize: '0.83rem', direction: 'rtl',
    }}>
      <span style={{ fontWeight: 700 }}>{payload[0].name}</span>
      {' — '}
      <span style={{ color: 'var(--gold)' }}>{payload[0].value}</span>
    </div>
  )
}

export default function InvestorsGrid({ investors }) {
  const pieData = buildPieData(investors)

  return (
    <section style={{ padding: '2.5rem 1.5rem 0' }}>
      <h2 style={{
        fontSize: '1.35rem', fontWeight: 700,
        color: 'var(--dark-blue)',
        maxWidth: 1200, margin: '0 auto 1.25rem',
      }}>💼 משקיעים ושותפים</h2>

      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        alignItems: 'start',
      }}>
        {/* Pie chart */}
        <div style={{
          background: 'var(--white)',
          borderRadius: 14,
          padding: '1.5rem',
          boxShadow: '0 2px 12px rgba(26,58,92,0.08)',
          border: '1px solid var(--gray-200)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--dark-blue)' }}>
            פילוח לפי קטגוריה
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="50%"
                outerRadius={80}
                strokeWidth={2}
              >
                {pieData.map(entry => (
                  <Cell
                    key={entry.name}
                    fill={CATEGORY_COLORS[entry.name] || '#94A3B8'}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={value => (
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray-800)', fontFamily: 'Heebo' }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* List */}
        <div style={{
          background: 'var(--white)',
          borderRadius: 14,
          padding: '1.5rem',
          boxShadow: '0 2px 12px rgba(26,58,92,0.08)',
          border: '1px solid var(--gray-200)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--dark-blue)' }}>
            רשימה מלאה
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {investors.map(inv => (
              <div key={inv.name} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.75rem',
                borderRadius: 8,
                background: 'var(--gray-50)',
                gap: '0.5rem',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--dark-blue)' }}>
                    {inv.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                    {inv.role}
                  </div>
                </div>
                <span style={{
                  background: CATEGORY_COLORS[inv.category] || '#94A3B8',
                  color: '#fff',
                  fontSize: '0.7rem', fontWeight: 700,
                  padding: '0.15rem 0.55rem',
                  borderRadius: 20,
                  flexShrink: 0,
                }}>{inv.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
