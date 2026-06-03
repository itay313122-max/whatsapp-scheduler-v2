export function routeMessage(message, { autoRoute = true, forcedModel = 'claude' } = {}) {
  if (!autoRoute) {
    return { model: forcedModel, reason: 'מודל קבוע (ניתוב ידני)' }
  }

  const msg = message.toLowerCase()

  // ── Groq: short factual questions
  if (
    msg.length < 80 &&
    (msg.includes('מה') || msg.includes('כמה') || msg.includes('מתי') ||
     msg.includes('who') || msg.includes('what') || msg.includes('when') ||
     msg.includes('where') || msg.includes('איפה') || msg.includes('למה'))
  ) {
    return { model: 'groq', reason: 'שאלה קצרה — מהירות מקסימלית' }
  }

  // ── Claude: code, analysis, logic, planning
  if (
    msg.includes('קוד') || msg.includes('code') ||
    msg.includes('באג') || msg.includes('bug') ||
    msg.includes('פונקציה') || msg.includes('function') ||
    msg.includes('נתח') || msg.includes('analyze') ||
    msg.includes('השווה') || msg.includes('compare') ||
    msg.includes('תכנן') || msg.includes('plan') ||
    msg.includes('ארכיטקטורה') || msg.includes('architecture') ||
    msg.includes('refactor') || msg.includes('debug') ||
    msg.includes('אלגוריתם') || msg.includes('algorithm') ||
    msg.includes('sql') || msg.includes('api') || msg.includes('json')
  ) {
    return { model: 'claude', reason: 'קוד/ניתוח — Claude מתאים' }
  }

  // ── GPT-4o: creative writing, marketing, content
  if (
    msg.includes('כתוב') || msg.includes('write') ||
    msg.includes('פוסט') || msg.includes('post') ||
    msg.includes('שיווק') || msg.includes('market') ||
    msg.includes('סיפור') || msg.includes('story') ||
    msg.includes('יצירתי') || msg.includes('creative') ||
    msg.includes('אימייל') || msg.includes('email') ||
    msg.includes('מודעה') || msg.includes('ad') ||
    msg.includes('תיאור') || msg.includes('description') ||
    msg.includes('תסריט') || msg.includes('script')
  ) {
    return { model: 'gpt', reason: 'כתיבה יצירתית — GPT מתאים' }
  }

  // ── Default: Claude
  return { model: 'claude', reason: 'ברירת מחדל — Claude' }
}

export function resolveModel(preferred, keys) {
  const has = { claude: !!keys.claude, gpt: !!keys.openai, groq: !!keys.groq }

  if (preferred === 'groq'  && has.groq)  return 'groq'
  if (preferred === 'claude' && has.claude) return 'claude'
  if (preferred === 'gpt'   && has.gpt)   return 'gpt'

  // Fallback chain
  if (has.claude) return 'claude'
  if (has.openai) return 'gpt'
  if (has.groq)   return 'groq'
  return null
}
