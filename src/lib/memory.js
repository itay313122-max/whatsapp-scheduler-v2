const KEYS = {
  memories: 'itayai_memories',
  history:  'itayai_history',
}

export const DEFAULT_MEMORIES = [
  'שמי איתי מור. מפתח ויזם ישראלי.',
  'הפרויקטים שלי: NadlanAI, Trading Bot, PAI OS, dropshipping automation.',
  'הסטאק שלי: Node.js, React, Python, Claude API, Telegram bots.',
  'המטרה שלי: להיות #1 ב-AI Automation בישראל.',
  'אני לומד מערכות מידע במכללת עמק יזרעאל.',
  'אני גר בקריית אתא.',
]

export const getMemories = () => {
  try {
    const raw = localStorage.getItem(KEYS.memories)
    return raw ? JSON.parse(raw) : DEFAULT_MEMORIES
  } catch {
    return DEFAULT_MEMORIES
  }
}

export const addMemory = (text) => {
  const list = getMemories()
  const updated = [...list, text.trim()]
  localStorage.setItem(KEYS.memories, JSON.stringify(updated))
  return updated
}

export const removeMemory = (index) => {
  const list = getMemories()
  list.splice(index, 1)
  localStorage.setItem(KEYS.memories, JSON.stringify(list))
  return [...list]
}

export const resetMemories = () => {
  localStorage.setItem(KEYS.memories, JSON.stringify(DEFAULT_MEMORIES))
  return DEFAULT_MEMORIES
}

export const getHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(KEYS.history) || '[]')
  } catch {
    return []
  }
}

export const saveHistory = (messages) => {
  localStorage.setItem(KEYS.history, JSON.stringify(messages.slice(-50)))
}

export const clearHistory = () => {
  localStorage.removeItem(KEYS.history)
}
