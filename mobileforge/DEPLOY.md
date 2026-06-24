# פריסה לאוויר — לינק ציבורי לשליחה לחברים 🚀

מדריך להעלאת MobileForge לאינטרנט עם לינק שאפשר לשלוח לכל אחד. ~15 דקות.
שני חלקים: **Backend** (השרת) ב-Render, **Frontend** (האתר) ב-Vercel. שניהם חינם.

---

## ⚡ פריסה בלחיצה אחת (הכי מהיר)

לחץ על הכפתורים — הם ממלאים הכל מראש, אתה רק מאשר בחשבון שלך:

[![Deploy Backend to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/itay313122-max/whatsapp-scheduler-v2)

[![Deploy Frontend to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fitay313122-max%2Fwhatsapp-scheduler-v2&root-directory=mobileforge%2Ffrontend&env=NEXT_PUBLIC_API_URL&envDescription=%D7%9B%D7%AA%D7%95%D7%91%D7%AA%20%D7%94-Backend%20%D7%9E-Render&project-name=mobileforge&repository-name=mobileforge)

**אחרי הלחיצות:**
1. Render → הוסף את מפתחות ה-AI + `ADMIN_TOKEN` + `BETA_KEYS` (10 הקודים) ב-Environment.
2. Vercel → הזן `NEXT_PUBLIC_API_URL` = כתובת ה-Render.
3. Render → עדכן `FRONTEND_URL` = כתובת ה-Vercel.

זהו — יש לך לינק. הפירוט המלא למטה.

---

## חלק 1 — Backend ל-Render (חינם)

1. היכנס ל-https://render.com והתחבר עם GitHub.
2. **New → Blueprint** → בחר את ה-repo הזה. Render יקרא את `mobileforge/render.yaml`.
3. אחרי היצירה, היכנס ל-service → **Environment** והוסף את המפתחות:
   - `GROQ_API_KEY` (ואם יש: `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `CEREBRAS_API_KEY`, `TOGETHER_API_KEY`)
   - `ADMIN_TOKEN` — בחר סיסמה כלשהי (תשמש לקריאת המשובים)
   - `FRONTEND_URL` — תמלא אחרי חלק 2 (כתובת ה-Vercel)
4. שמור את כתובת השרת, למשל: `https://mobileforge-backend.onrender.com`

> הערה: בתוכנית החינמית השרת "נרדם" אחרי 15 דק׳ חוסר פעילות ומתעורר תוך ~30 שנ׳
> בבקשה הראשונה. זה תקין לבדיקות עם חברים.

---

## חלק 2 — Frontend ל-Vercel (חינם)

1. היכנס ל-https://vercel.com והתחבר עם GitHub.
2. **Add New → Project** → בחר את ה-repo.
3. **חשוב:** ב-**Root Directory** בחר `mobileforge/frontend`.
4. ב-**Environment Variables** הוסף:
   - `NEXT_PUBLIC_API_URL` = כתובת ה-Render מחלק 1 (בלי `/` בסוף)
5. **Deploy**. תוך דקה תקבל לינק כמו `https://mobileforge.vercel.app` — **זה הלינק לשלוח לחברים.**
6. חזור ל-Render → עדכן `FRONTEND_URL` לכתובת ה-Vercel הזו (ל-CORS) → Save.

---

## חלק 3 — לקרוא את המשובים של הבודקים

כל מי שלוחץ על כפתור **"משוב"** באתר — הדיווח נשמר. לקריאת כל הדיווחים:

```
https://<כתובת-render>/api/feedback?token=<ADMIN_TOKEN שלך>
```

מחזיר JSON עם כל המשובים, דירוג ממוצע, ומאיזה עמוד נשלחו. (גם מופיע ב-Logs של Render.)

---

## מצב בדיקות (Beta)

- כפתור המשוב מוצג כברירת מחדל. כדי להסתיר אותו ב-MVP הסופי: הגדר ב-Vercel
  `NEXT_PUBLIC_BETA=0` ועשה Redeploy.
- בלי מפתח AI תקין, האתר עובד ב-Demo Mode (אפליקציות מתבניות) — מספיק כדי
  שחברים יחושו את החוויה.

---

## צ'קליסט מהיר

- [ ] Backend עלה ב-Render, `/health` מחזיר `ok`
- [ ] מפתחות AI + `ADMIN_TOKEN` הוגדרו ב-Render
- [ ] Frontend עלה ב-Vercel עם Root Directory = `mobileforge/frontend`
- [ ] `NEXT_PUBLIC_API_URL` מצביע על ה-Render
- [ ] `FRONTEND_URL` ב-Render מצביע על ה-Vercel
- [ ] נכנסת ללינק, בנית אפליקציה, ושלחת משוב לבדיקה
