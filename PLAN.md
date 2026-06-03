# ITAY AI — Build Plan

## סדר בנייה

### שלב 1: תשתית
- `package.json` — Vite + React (JS) + react-router-dom + react-markdown
- `vite.config.js` — Vite plain JS
- `tailwind.config.js` — Cyberpunk color palette + animations
- `index.html` — RTL, JetBrains Mono
- `src/index.css` — Grid BG, markdown styles, loading dots

### שלב 2: Lib (לב המערכת)
- `src/lib/router.js` — Smart router: Groq/Claude/GPT decision logic
- `src/lib/models.js` — API calls: Claude, GPT-4o, Groq
- `src/lib/memory.js` — localStorage CRUD for memories + history
- `src/lib/persona.js` — System prompt builder with memories
- `src/lib/chatContext.jsx` — React context לשיתוף chat state

### שלב 3: Hooks
- `src/hooks/useChat.js` — Message state, routing, API dispatch
- `src/hooks/useMemory.js` — Memory CRUD hook

### שלב 4: Components
- `src/components/RouterBadge.jsx` — Badge: איזה מודל ענה + למה
- `src/components/MessageBubble.jsx` — User/AI bubble עם markdown + copy
- `src/components/InputBar.jsx` — Textarea + send (Enter/Shift+Enter)
- `src/components/Sidebar.jsx` — Nav + New Chat + model status
- `src/components/MemoryCard.jsx` — כרטיס זיכרון יחיד
- `src/components/AgentCard.jsx` — כרטיס agent עם כפתור הפעלה

### שלב 5: Pages
- `src/pages/Chat.jsx` — ממשק צ'אט ראשי
- `src/pages/Memory.jsx` — ניהול זיכרון
- `src/pages/Agents.jsx` — 4 agents + modal
- `src/pages/Settings.jsx` — API keys + persona + router toggle

### שלב 6: Entry Points
- `src/App.jsx` — BrowserRouter + ChatContext.Provider + layout
- `src/main.jsx` — React root

## כל ה-localStorage Keys
| Key | תוכן |
|-----|------|
| `itayai_settings` | API keys, persona, router config |
| `itayai_memories` | מערך זיכרונות |
| `itayai_history` | היסטוריית שיחה (max 50) |

## Model Colors
| מודל | צבע | שימוש |
|------|-----|-------|
| Claude | #f59e0b amber | קוד, ניתוח, ברירת מחדל |
| GPT-4o | #10b981 green | כתיבה יצירתית, תוכן |
| Groq | #22d3ee cyan | שאלות קצרות, מהירות |

## Routing Logic
```
שאלה קצרה (<80 תווים) + מה/כמה/מתי → Groq
קוד/באג/ניתוח/תכנון → Claude  
כתיבה/פוסט/שיווק/אימייל → GPT-4o
ברירת מחדל → Claude
```

## Fallback Chain
```
Groq ← אין key → Claude ← אין key → GPT ← אין key → Error
```
