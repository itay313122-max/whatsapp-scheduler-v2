# הרצת MobileForge על המחשב שלך 🚀

מדריך מלא להרצת המערכת מקומית עם AI אמיתי. בסביבת התצוגה בענן הרשת חוסמת את
ספקי ה-AI — על המחשב שלך אין חסימה, והכל יעבוד.

---

## דרישות מקדימות

- **Node.js 18+** — בדיקה: `node -v`. אם אין: https://nodejs.org
- המפתחות שלך כבר מוגדרים ב-`backend/.env` (Groq, Gemini, OpenRouter, Cerebras, Together).

---

## הרצה בפקודה אחת ⚡

מתוך תיקיית `mobileforge`:

```bash
./start.sh
```

הסקריפט:
1. בודק אילו מפתחות AI עובדים (health check)
2. מתקין תלויות אם חסרות (פעם ראשונה בלבד)
3. מריץ את ה-Backend על `http://localhost:4000`
4. מריץ את ה-Frontend על `http://localhost:3000`

פתח בדפדפן: **http://localhost:3000** — וזהו, אתה בונה אפליקציות אמיתיות.

לעצירה: `Ctrl+C` (סוגר את שני השרתים).

---

## בדיקת AI בלבד (בלי להריץ הכל)

רוצה רק לוודא שהמפתחות עובדים?

```bash
cd backend && node ../check-ai.mjs
```

תקבל טבלה כזו:

```
  ✅  Groq        HTTP 200
  ✅  Gemini      HTTP 200
  ⚪  OpenRouter  no key set
  ...
🎉 2 provider(s) working — real AI generation is LIVE.
```

- ✅ = עובד  •  ❌ = נכשל (מכסה/מפתח/רשת)  •  ⚪ = אין מפתח
- **לפחות ספק אחד ✅** = AI אמיתי פעיל.
- **כולם ❌/⚪** = המערכת עוברת אוטומטית ל-Demo Mode (עדיין בונה אפליקציות אמיתיות מתבניות חכמות).

---

## הרצה ידנית (אם מעדיף שני טרמינלים)

**טרמינל 1 — Backend:**
```bash
cd backend
npm install      # פעם ראשונה
npm run dev      # http://localhost:4000
```

**טרמינל 2 — Frontend:**
```bash
cd frontend
npm install      # פעם ראשונה
npm run dev      # http://localhost:3000
```

---

## פתרון תקלות

| תקלה | פתרון |
|------|-------|
| `Host not in allowlist` בצ'ק | אתה עדיין בסביבה חסומה — הרץ על המחשב המקומי שלך |
| Gemini `429 quota` | המכסה היומית נגמרה — חכה 24ש' או צור מפתח חדש |
| `EADDRINUSE :4000` | פורט תפוס — `lsof -ti:4000 \| xargs kill` |
| Frontend לא מתחבר ל-API | ודא ש-`frontend/.env.local` מכיל `NEXT_PUBLIC_API_URL=http://localhost:4000` |
| המפתחות לא נטענים | ודא שהם ב-`backend/.env` (לא ב-`.env.example`) |

---

## מה הלאה — לקראת Alpha

ברגע שאתה רואה AI אמיתי עובד אצלך:
1. **בדוק איכות** — בנה 5–10 אפליקציות שונות, ראה שהפלט מעולה
2. **פרוס Alpha** — Frontend ל-Vercel, Backend ל-Railway/Render
3. שתף לינק עם 10 אנשים אמיתיים ואסוף משוב

בהצלחה! 💪
