import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'

const COLORS = ['#2563EB', '#F59E0B', '#10B981']

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'var(--dark-blue)', color: 'var(--white)',
      padding: '0.6rem 1rem', borderRadius: 8,
      fontSize: '0.85rem', direction: 'rtl',
    }}>
      <div style={{ fontWeight: 700 }}>{d.label}</div>
      <div style={{ color: 'var(--gold)' }}>{d.value}%</div>
      <div style={{ opacity: 0.75, fontSize: '0.75rem' }}>{d.desc}</div>
    </div>
  )
}

export default function KPIChart({ kpis }) {
  return (
    <section style={{ padding: '2.5rem 1.5rem 0' }}>
      <h2 style={{
        fontSize: '1.35rem', fontWeight: 700,
        color: 'var(--dark-blue)',
        maxWidth: 1200, margin: '0 auto 1.25rem',
      }}>📈 השוואת KPIs</h2>

      <div style={{
        maxWidth: 1200, margin: '0 auto',
        background: 'var(--white)',
        borderRadius: 14,
        padding: '1.5rem',
        boxShadow: '0 2px 12px rgba(26,58,92,0.08)',
        border: '1px solid var(--gray-200)',
      }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={kpis}
            layout="vertical"
            margin={{ top: 8, right: 60, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
            <XAxis
              type="number" domain={[0, 100]}
              tickFormatter={v => `${v}%`}
              tick={{ fontSize: 12, fill: '#475569', fontFamily: 'Heebo' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              type="category" dataKey="label"
              tick={{ fontSize: 13, fill: '#1E293B', fontFamily: 'Heebo', fontWeight: 600 }}
              width={160}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(219,234,254,0.4)' }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={40}>
              {kpis.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={v => `${v}%`}
                style={{ fontSize: 13, fontWeight: 700, fill: '#1E293B', fontFamily: 'Heebo' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
