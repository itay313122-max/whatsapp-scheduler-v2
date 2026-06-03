# 🤖 Itay AI — Personal AI System

מערכת AI אישית היברידית שמנתבת כל שאלה למודל הכי חזק לה.

## הרצה מקומית

### אפשרות א׳ — Clone מהריפו (מומלץ)

```bash
git clone https://github.com/itay313122-max/whatsapp-scheduler-v2
cd whatsapp-scheduler-v2
npm install
npm run dev
```

לאחר מכן פתח `http://localhost:5173`

### אפשרות ב׳ — פרויקט Vite חדש מאפס

```bash
npm create vite@latest my-app -- --template react
cd my-app
npm install react-router-dom react-markdown remark-gfm
# העתק את כל תיקיית src/ מהריפו
# העתק tailwind.config.js, postcss.config.js, index.html
npm install -D tailwindcss postcss autoprefixer
npm run dev
```

> ⚠️ אי אפשר להעתיק רק `App.jsx` — המערכת מורכבת מ-26 קבצים עם dependencies ספציפיים.

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
