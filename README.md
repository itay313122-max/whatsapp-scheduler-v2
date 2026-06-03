# 🤖 Itay AI — Personal AI System

מערכת AI אישית היברידית שמנתבת כל שאלה למודל הכי חזק לה.

## הרצה מקומית

```bash
npm install
npm run dev
```

לאחר מכן פתח `http://localhost:5173`

## הגדרה ראשונית

1. לחץ **⚙ SETTINGS** בסרגל הצד
2. הדבק את **Anthropic API key** שלך (נדרש)
3. הוסף **OpenAI** ו-**Groq** keys לביצועים מיטביים (אופציונלי)
4. לחץ **בדוק** לוידוי כל key
5. חזור ל-**CHAT** והתחל לדבר

## Smart Router — איך עובד

| שאלה | מודל | סיבה |
|------|------|------|
| קצרה + מה/כמה/מתי | ⚡ Groq | מהירות מקסימלית |
| קוד / ניתוח / תכנון | 🧠 Claude | דיוק ועומק |
| כתיבה / שיווק / תוכן | ✍️ GPT-4o | יצירתיות |
| ברירת מחדל | 🧠 Claude | הכי מהימן |

## Agents

| Agent | שימוש |
|-------|-------|
| 🏠 נדל"ן אנליסט | ניתוח נכסים ותשואות |
| 📈 Trading Scout | ניתוח שוק והזדמנויות |
| 🚀 Startup Advisor | Validation, GTM, Pitch |
| 💻 Code Reviewer | ביקורת קוד ותיקון באגים |

## Stack

- **React 18 + Vite** (JavaScript, ללא TypeScript)
- **Tailwind CSS** — Cyberpunk-Israeli design
- **react-router-dom v6** — ניווט בין דפים
- **react-markdown + remark-gfm** — rendering של AI תשובות
- **localStorage** — זיכרון, היסטוריה, הגדרות

## אבטחה

כל ה-API keys נשמרים ב-localStorage בדפדפן שלך בלבד.
הקוד קורא ישירות ל-Anthropic / OpenAI / Groq — ללא שרת מתווך.
