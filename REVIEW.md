# REVIEW — Itay AI Build

## מה נבנה

### ארכיטקטורה
מערכת React SPA עם ניתוב AI חכם. כל הודעה עוברת דרך router שבוחר את המודל האופטימלי, מוריד את זמן התגובה ומגדיל את איכות התשובה.

---

## דפים ותוכנם

### ◈ Chat (`/`)
- ממשק שיחה מלא עם RTL support
- `RouterBadge` על כל תשובה — מציג מודל + סיבת ניתוב
- Loading animation: dots מ-matrix style
- Empty state עם הסבר על Smart Router
- כפתור Copy על hover של כל הודעת AI
- Auto-scroll לתחתית עם כל הודעה
- שמירת היסטוריה ב-localStorage (max 50 הודעות)

### 🧠 Memory (`/memory`)
- Grid של כרטיסי זיכרון ממוספרים
- הוספת זיכרון חדש עם Enter / כפתור שמירה
- מחיקה של זיכרון בודד (× ב-hover)
- אפס לברירת מחדל (עם confirmation)
- 6 זיכרונות ברירת מחדל על איתי מור

### ⚡ Agents (`/agents`)
- 4 agents מובנים: נדל"ן / Trading / Startup / Code Review
- כל agent עם צבע ייחודי, icon, ותיאור
- Modal עם input ייעודי לכל agent
- Output: markdown עם syntax highlighting
- Copy button על תוצאות
- תמיד מריצים על Claude (הכי חזק לניתוח מעמיק)

### ⚙ Settings (`/settings`)
- API keys לשלושת המודלים עם show/hide + test
- Test button — שולח "hi" לכל מודל, מחזיר ✓/✗
- Custom persona textarea (ריק = ברירת מחדל של Itay AI)
- Router toggle ON/OFF + בחירת מודל קבוע
- Status dashboard — מה מוגדר ומה לא
- Danger Zone עם confirmation לפני כל פעולה

---

## קבצי הליבה

### `src/lib/router.js`
Logic של ניתוב. בודק תוכן הודעה, מחזיר `{ model, reason }`.
Fallback chain: Groq→Claude→GPT לפי keys זמינים.

### `src/lib/models.js`
API calls ל-Claude, GPT-4o, Groq.
כולל `testKey()` לבדיקת keys ב-Settings.
Claude דורש `anthropic-dangerous-allow-browser: true`.

### `src/lib/memory.js`
CRUD פשוט ל-localStorage: `getMemories`, `addMemory`, `removeMemory`, `resetMemories`.
היסטוריית שיחה: `getHistory`, `saveHistory`, `clearHistory`.

### `src/lib/persona.js`
בונה system prompt אחיד: BASE_PERSONA + זיכרונות מ-memory.js.
ניתן לדרוס עם custom persona מ-Settings.

### `src/hooks/useChat.js`
כל לוגיקת הצ'אט: שמירת state, routing, API dispatch, error handling.
Context מועלה ל-App.jsx ומשותף עם Sidebar (לכפתור NEW CHAT).

---

## Design System

```
Background:  #050510  (near-black, space-like)
Surface:     #0a0a1a  (message bubbles, cards)
Surface2:    #0f0f25  (deeper layers)
Border:      #1a1a3e  (subtle separators)
Accent:      #6366f1  (indigo — nav, buttons, prompts)
Accent2:     #22d3ee  (cyan — Groq, code)
Claude:      #f59e0b  (amber — Claude badges)
GPT:         #10b981  (green — GPT badges)
Groq:        #22d3ee  (cyan — Groq badges)
```

Grid background: `repeating-linear-gradient` 40px בצבע indigo בשקיפות 4%.
JetBrains Mono לכל ה-UI. Georgia serif לתשובות AI (קריאות).
RTL support על HTML element.

---

## LocalStorage Keys

| Key | תוכן |
|-----|------|
| `itayai_settings` | claudeKey, openaiKey, groqKey, customPersona, autoRoute, forcedModel |
| `itayai_memories` | string[] — זיכרונות שמוזרקים לכל שיחה |
| `itayai_history` | Message[] — max 50 הודעות אחרונות |

---

## Next Steps

1. **Streaming responses** — להוסיף SSE streaming ל-Claude (יותר "חי")
2. **Multiple conversations** — שמירת מספר שיחות בו-זמנית + history list
3. **Voice input** — Web Speech API לקלט קולי
4. **Export** — ייצוא שיחה כ-PDF / Markdown
5. **Conversation titles** — auto-generate title מהשאלה הראשונה
6. **Custom agents** — ממשק ליצירת agents חדשים ב-UI
7. **Image input** — העלאת תמונות ל-Claude ו-GPT-4o Vision
8. **Prompt templates** — ספרייה של prompts שמורים

---

## סטטוס Build

✅ All files created and built successfully  
✅ `npm run build` — 0 errors  
✅ Smart Router — Claude / GPT-4o / Groq  
✅ Memory system — localStorage CRUD  
✅ 4 Agents — modal + Claude API  
✅ Settings — test keys + persona + router toggle  
✅ RTL support — Hebrew first  
✅ Cyberpunk design — grid BG, glow effects, JetBrains Mono  
