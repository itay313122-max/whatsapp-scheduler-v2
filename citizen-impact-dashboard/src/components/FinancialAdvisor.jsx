import React, { useMemo } from 'react'

function buildRecommendation(stocks, news) {
  const get = sym => stocks.find(s => s.symbol === sym)

  const vix   = get('^VIX')
  const ta35  = get('^TA35.TA')
  const sp500 = get('^GSPC')

  const newsText = news.map(n => n.title.toLowerCase()).join(' ')

  const tips = []

  // VIX rule
  if (vix && vix.price > 25) {
    tips.push({
      icon: '⚠️',
      text: `VIX עומד על ${vix.price} — שוק תנודתי. שמור על מזומן ואל תחריף חשיפה.`,
      level: 'warning',
    })
  }

  // TA35 rule
  if (ta35 && ta35.change_pct >= 1) {
    tips.push({
      icon: '📈',
      text: `מדד ת"א 35 עלה ${ta35.change_pct.toFixed(2)}% — מגמה חיובית בשוק המקומי.`,
      level: 'positive',
    })
  } else if (ta35 && ta35.change_pct <= -1.5) {
    tips.push({
      icon: '📉',
      text: `מדד ת"א 35 ירד ${Math.abs(ta35.change_pct).toFixed(2)}% — שים לב לחשיפה לשוק הישראלי.`,
      level: 'warning',
    })
  }

  // Interest rate / Bank of Israel in news
  if (/(ריבית|בנק ישראל|interest rate|central bank)/.test(newsText)) {
    tips.push({
      icon: '🏦',
      text: 'שים לב להחלטת ריבית בנק ישראל — עשויה להשפיע על משכנתאות ואג"ח.',
      level: 'info',
    })
  }

  // Inflation in news
  if (/(אינפלציה|inflation)/.test(newsText)) {
    tips.push({
      icon: '💰',
      text: 'נתוני אינפלציה בכותרות — שקול הגדלת חשיפה לנכסים מוגני אינפלציה (זהב, TIPS).',
      level: 'info',
    })
  }

  // S&P positive
  if (sp500 && sp500.change_pct >= 0.5) {
    tips.push({
      icon: '🌐',
      text: `S&P 500 עולה ${sp500.change_pct.toFixed(2)}% — סנטימנט גלובלי חיובי.`,
      level: 'positive',
    })
  }

  // Default if nothing triggered
  if (tips.length === 0) {
    tips.push({
      icon: '📊',
      text: 'השוקים יציבים כרגע — המשך לעקוב אחרי KPIs ואל תבצע שינויים דרסטיים בתיק.',
      level: 'info',
    })
  }

  return tips
}

const LEVEL_STYLE = {
  positive: { border: '#10B981', bg: 'rgba(16,185,129,0.08)', icon_bg: '#10B981' },
  warning:  { border: '#F59E0B', bg: 'rgba(245,158,11,0.08)', icon_bg: '#F59E0B' },
  info:     { border: '#2563EB', bg: 'rgba(37,99,235,0.06)',  icon_bg: '#2563EB' },
}

export default function FinancialAdvisor({ stocks, news }) {
  const tips = useMemo(() => buildRecommendation(stocks, news), [stocks, news])

  return (
    <section style={{ padding: '2.5rem 1.5rem 3rem' }}>
      <h2 style={{
        fontSize: '1.35rem', fontWeight: 700,
        color: 'var(--dark-blue)',
        maxWidth: 1200, margin: '0 auto 1.25rem',
      }}>🤖 המלצת היום — AI פיננסי</h2>

      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {tips.map((tip, i) => {
          const st = LEVEL_STYLE[tip.level]
          return (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              background: st.bg,
              border: `1px solid ${st.border}`,
              borderRight: `4px solid ${st.border}`,
              borderRadius: 12,
              padding: '1rem 1.25rem',
            }}>
              <div style={{
                width: 40, height: 40, flexShrink: 0,
                background: st.icon_bg,
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
              }}>{tip.icon}</div>
              <div style={{
                fontSize: '0.92rem',
                color: 'var(--dark-blue)',
                lineHeight: 1.6,
                fontWeight: 500,
                paddingTop: '0.1rem',
              }}>{tip.text}</div>
            </div>
          )
        })}
      </div>

      <div style={{
        maxWidth: 1200, margin: '1rem auto 0',
        fontSize: '0.72rem', color: 'var(--gray-600)',
        textAlign: 'center',
      }}>
        * המלצות אלה מבוססות על ניתוח אלגוריתמי בלבד ואינן מהוות ייעוץ השקעות מורשה.
      </div>
    </section>
  )
}
