# ניתוח תחרותי — MobileForge vs. שוק בוני האפליקציות AI
## יוני 2026

---

## 1. סקירת שוק

### גודל שוק
| מדד | ערך |
|------|------|
| שוק פלטפורמות AI no-code 2026 | **$8.6B** |
| תחזית 2034 | **$75B** (CAGR 31%) |
| שוק low-code כולל 2027 | **$65B** |
| % אפליקציות חדשות ב-no-code (Gartner) | **75%** עד סוף 2026 |
| % משתמשים שאינם מפתחים | **63%** |

### צמיחת שחקנים מובילים
| חברה | ARR | שווי | משתמשים | תאריך הקמה |
|--------|------|------|---------|------------|
| Lovable | $400M | $6.6B | 8M | 2024 |
| Replit | $240M | $9B | 50M+ | 2016 |
| Base44 (Wix) | $100M | נרכש ב-$80M | 2M+ | 2024 |
| Bolt.new | $40M | $700M | 5M+ | 2024 |
| Rork | לא ידוע | לא ידוע | 500K+ פרויקטים | 2024 |

---

## 2. מתחרים ישירים — ניתוח מפורט

### Tier 1: ענקים (ARR > $100M)

#### 🔵 Lovable (lovable.dev)
- **מה זה:** AI full-stack app builder — מטקסט לאפליקציה מלאה
- **טכנולוגיה:** React + Supabase backend
- **מחיר:** $20/חודש (Starter), $50/חודש (Launch)
- **יתרונות:**
  - Full-stack: auth, database, payments מובנים
  - Lovable Cloud — hosting + backend אוטומטי
  - שיתוף פעולה real-time עד 20 משתמשים
  - Visual CSS editor
  - ייצוא קוד מלא
- **חסרונות:**
  - אין native mobile (web only)
  - לא תומך RTL/עברית ספציפית
  - אין visual editor כמו Figma (רק chat)
- **רלוונטיות ל-MobileForge:** מתחרה ישיר בחלק ה-web, אבל אין להם mobile preview + visual editing

#### 🟠 Bolt.new (bolt.new)
- **מה זה:** AI app builder עם סביבת קוד בדפדפן
- **טכנולוגיה:** StackBlitz WebContainers
- **מחיר:** $20/חודש (Pro), $30/חודש (Teams)
- **יתרונות:**
  - מהיר מאוד — prototype תוך דקות
  - הקוד גלוי ונגיש
  - One-click deploy ל-Vercel/Netlify
- **חסרונות:**
  - JavaScript-only backend
  - אין native mobile
  - אין visual editor — רק chat
  - לא RTL
- **רלוונטיות ל-MobileForge:** מתחרה בחוויית "תאר → קבל אפליקציה"

#### 🟢 Replit (replit.com)
- **מה זה:** IDE בענן + AI agent
- **טכנולוגיה:** מולטי-שפות, Python/Node
- **מחיר:** $25/חודש (Core), $40/חודש (Teams)
- **יתרונות:**
  - 50M+ משתמשים — הקהילה הכי גדולה
  - תומך Python, server-side processes, cron jobs
  - Hosting מובנה
  - AI Agent אוטונומי
- **חסרונות:**
  - לא ממוקד mobile
  - UI בסיסי — IDE, לא visual builder
  - עקומת למידה גבוהה יותר
- **רלוונטיות ל-MobileForge:** פחות רלוונטי — פונה למפתחים, לא למשתמשי קצה

### Tier 2: מתחרים ישירים (Mobile-focused)

#### 🐱 CatDoes (catdoes.com)
- **מה זה:** AI native app builder — מתיאור לאפליקציה באפסטורים
- **טכנולוגיה:** Native iOS + Android + Web
- **מחיר:** $0 (Free, web only), $25/חודש (Pro), $50/חודש (Business)
- **יתרונות:**
  - **הכי דומה ל-MobileForge** — בונה אפליקציות מתיאור
  - Native iOS + Android אמיתי
  - Release Agent — מכין את האפליקציה לאפסטור
  - Cloud מובנה (DB, Auth, Storage, Realtime)
  - ממשק שיחה פשוט
- **חסרונות:**
  - אין visual editor כמו Figma
  - אין RTL/עברית
  - 2 קרדיטים ביום בחינם בלבד
- **רלוונטיות ל-MobileForge:** **מתחרה ישיר מספר 1** — אותו קונספט, אבל בלי עריכה ויזואלית

#### 🚀 Rork (rork.com)
- **מה זה:** AI mobile app builder עם Expo/React Native
- **טכנולוגיה:** React Native (Expo), SwiftUI ב-Max
- **מחיר:** $25-$100/חודש (Pro), $200+/חודש (Max/Swift)
- **יתרונות:**
  - 500K+ פרויקטים, 2000+ אפליקציות באפסטור
  - React Native — cross-platform אמיתי
  - Rork Max: native Swift עם Apple Watch, Vision Pro
  - וויראלי — $100K ב-5 ימים מציוץ
- **חסרונות:**
  - אין visual editor
  - אין RTL מובנה
  - Max יקר ($200+)
- **רלוונטיות ל-MobileForge:** מתחרה ב-text-to-mobile-app

#### 📐 Figma Make (figma.com)
- **מה זה:** AI app builder מבית Figma — מעיצוב לאפליקציה
- **טכנולוגיה:** React, ענן Figma
- **מחיר:** כלול בתוכניות Figma ($15/חודש+)
- **יתרונות:**
  - **אינטגרציה עם Figma Design** — ייבוא עיצובים קיימים
  - Point & Edit — לחיצה על אלמנט + chat לשינוי
  - Visual + Code editor
  - Deploy מובנה
  - קהילת Figma ענקית
- **חסרונות:**
  - רק web apps (לא native mobile)
  - לא RTL ספציפי
  - תלוי באקוסיסטם Figma
- **רלוונטיות ל-MobileForge:** **מתחרה עיצובי מספר 1** — Point & Edit דומה לקונספט שלנו

### Tier 3: שחקנים נוספים

#### 🔲 v0 by Vercel (v0.app)
- **מה זה:** AI UI generator + full-stack builder
- **טכנולוגיה:** Next.js, shadcn/ui
- **מחיר:** $0 (Free), $20/חודש (Premium)
- **יתרונות:** UI generation מעולה, Next.js ecosystem, Figma import
- **חסרונות:** לא mobile, לא RTL, ממוקד מפתחים
- **רלוונטיות:** מתחרה עקיף — UI generation בלבד

#### 💨 Blink.new (blink.new)
- **מה זה:** Full-stack AI builder עם vibe coding
- **טכנולוגיה:** React + Turso DB + Firebase Auth + Deno
- **מחיר:** $0 (Free), $25/חודש (Starter), $50/חודש (Pro)
- **יתרונות:** Zero-config backend, 180+ AI models, code export
- **חסרונות:** לא mobile native, לא RTL
- **רלוונטיות:** מתחרה ב-full-stack, אבל web only

#### 🎯 Adalo (adalo.com)
- **מה זה:** No-code visual builder עם AI
- **טכנולוגיה:** React Native
- **מחיר:** $36/חודש+
- **יתרונות:** Drag & drop אמיתי, native mobile publish
- **חסרונות:** AI חלש יחסית, יקר, קהילה קטנה
- **רלוונטיות:** מתחרה ב-visual editor + mobile

#### 🏗️ FlutterFlow (flutterflow.io)
- **מה זה:** Visual builder ל-Flutter apps
- **טכנולוגיה:** Flutter/Dart
- **מחיר:** $30/חודש+
- **יתרונות:** Flutter native, visual editor חזק, code export
- **חסרונות:** עקומת למידה, לא "AI-first"
- **רלוונטיות:** מתחרה ב-visual editor + native mobile

#### 🍎 Appy Pie (appypie.com)
- **מה זה:** AI app generator — text to native app
- **טכנולוגיה:** Native iOS + Android
- **מחיר:** $16/חודש+
- **יתרונות:** AI prompt → native app, זול
- **חסרונות:** איכות עיצוב נמוכה, הרבה templates
- **רלוונטיות:** מתחרה בסיסי

#### 🇮🇱 Base44 (base44.com — Wix)
- **מה זה:** AI app builder ישראלי — נרכש ע"י Wix ב-$80M
- **טכנולוגיה:** React, ענן Base44
- **מחיר:** כלול ב-Wix
- **יתרונות:**
  - **ישראלי** — הכי קרוב מבחינה גיאוגרפית ותרבותית
  - נרכש ע"י Wix — גיבוי ענק
  - Click-to-edit כמו Wix
  - 2M+ משתמשים
  - $100M ARR
- **חסרונות:**
  - רק web (לא mobile native)
  - אין mobile preview ספציפי
  - אין עריכת אלמנטים inline כמו Figma
- **רלוונטיות:** **מתחרה ישראלי מספר 1** — Base44 הוכיח שיש שוק לזה בישראל

---

## 3. מפת מיצוב (Positioning Map)

```
                    AI-First (Text → App)
                         │
            Bolt ●       │       ● CatDoes
                         │       ● Rork
         Lovable ●       │
                         │
    v0 ●   Replit ●      │         ● MobileForge ★
                         │
  ─── Web Only ──────────┼──────────── Mobile Focus ───
                         │
         Figma Make ●    │       ● Adalo
                         │       ● FlutterFlow
         Blink ●  Base44 ●      ● Appy Pie
                         │
                    Visual Editor / Drag-Drop
```

**MobileForge נמצא ב-Sweet Spot ייחודי:**
- AI-first + Visual Editor + Mobile Preview
- אין אף מתחרה שמשלב את שלושתם

---

## 4. יתרונות תחרותיים של MobileForge

### 🟢 מה יש לנו שאין לאחרים:

| יתרון | MobileForge | Lovable | Bolt | CatDoes | Figma Make | Rork |
|--------|:-----------:|:-------:|:----:|:-------:|:----------:|:----:|
| AI text → app | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mobile preview (device frames) | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Visual element editing (click & edit) | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Hebrew/RTL native | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Design gallery (shapes, templates) | ✅ | ❌ | ❌ | ❌ | partial | ❌ |
| App style presets (Spotify, Uber...) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Figma-like toolbar | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Free tier | ✅ | ✅ | limited | limited | ❌ | ❌ |

### 🎯 הבידול העיקרי של MobileForge:
1. **הפלטפורמה היחידה שמשלבת AI + Visual Editor + Mobile Preview**
2. **תמיכה מלאה בעברית ו-RTL** — אין מתחרה בשוק הישראלי
3. **סגנונות אפליקציות מבוססי top-100 App Store** — לא generic templates
4. **עריכה ויזואלית בתוך ה-preview** — כמו Figma אבל על mobile

### 🔴 מה חסר לנו (Gap Analysis):

| חוסר | חשיבות | מתחרים שיש להם |
|-------|--------|-----------------|
| Backend/DB מובנה | 🔴 קריטי | Lovable, CatDoes, Blink, Base44 |
| Auth מובנה | 🔴 קריטי | Lovable, CatDoes, Blink, Rork |
| Deploy to App Store | 🔴 קריטי | CatDoes, Rork, Adalo |
| Hosting מובנה | 🟡 חשוב | Lovable, Bolt, CatDoes, Blink |
| Code export | 🟡 חשוב | Lovable, Bolt, FlutterFlow, Blink |
| AI Agent אוטונומי | 🟡 חשוב | Lovable, Replit, Blink |
| Real-time collaboration | 🟢 נחמד | Lovable, Figma Make |
| Native mobile (Swift/Kotlin) | 🟢 עתידי | CatDoes, Rork Max |

---

## 5. הזדמנויות וכיווני צמיחה

### 🇮🇱 הזדמנות ישראלית:
- **Base44 נרכש ב-$80M** — מוכיח שסטארטאפ ישראלי בתחום שווה הרבה
- **ישראל משקיעה ₪30M ב-AI עברית/ערבית** — תשתית שפה מתפתחת
- **אין מתחרה ישראלי mobile-first** — Base44 הוא web only
- **שוק עסקים קטנים ישראלי** — עסקים רוצים אפליקציה אבל לא יכולים לשלם $50K למפתח

### 🌍 הזדמנות גלובלית:
- **RTL market** — 400M+ דוברי ערבית + 15M עברית + 100M+ פרסית, פארסית, אורדו
- **Visual + AI** — אף אחד לא שילב את שניהם טוב למובייל
- **שוק $8.6B** שגדל ב-31% בשנה

### 📋 Roadmap מומלץ (לפי עדיפות):
1. **Backend-as-a-Service** — Supabase/Firebase integration → מאפשר אפליקציות אמיתיות
2. **Auth מובנה** — Google/Apple Sign-In → מאפשר אפליקציות עם משתמשים
3. **One-click deploy** — PWA + hosting → משתמשים יכולים לשתף
4. **Export to Expo** — React Native export → publish לאפסטורים
5. **AI Agent** — multi-step autonomous generation → חוויה טובה יותר
6. **ערבית + English** — הרחבת שוק RTL → 400M+ משתמשים פוטנציאליים

---

## 6. סיכום

**השוק ב-2026 הוא $8.6B וגדל ב-31% בשנה.** השחקנים המובילים (Lovable, Bolt, Replit) מתמקדים ב-web ואין להם mobile preview + visual editing. CatDoes ו-Rork מתמקדים ב-mobile אבל אין להם visual editor. Figma Make הכי קרוב אבל אין לו mobile focus.

**MobileForge הוא הפלטפורמה היחידה שמשלבת:**
- AI text-to-app
- Mobile device preview
- Figma-like visual editing
- Hebrew/RTL support
- App Store design patterns

**הפערים הקריטיים:** Backend, Auth, Deploy. ברגע שהם נסגרים — MobileForge הופך ל-CatDoes + Figma Make בפלטפורמה אחת, עם יתרון RTL.

---

*מקורות: Gartner, Business of Apps, Lovable Blog, CatDoes, Rork, Figma, Vercel, Times of Israel, Hostinger AI Statistics*
