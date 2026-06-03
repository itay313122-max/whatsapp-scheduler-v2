# PLAN — Citizen Impact Platform Extensions

> תכנון בלבד — אין קוד בקובץ זה.  
> מבוסס על נתוני `citizen_impact_full.xlsx` ו-`scripts/build_citizen_impact.py`.

---

## חלק א — React Dashboard

### מטרה
אפליקציית Vite + React שמציגה את כל נתוני Citizen Impact ויזואלית — RTL, mobile-first, ללא hardcode בקומפוננטות.

---

### מבנה תיקיות

```
dashboard/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── data/
│   │   └── data.js              ← כל הנתונים — מקור האמת היחיד
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── KPICards.jsx
│   │   ├── StepsTimeline.jsx
│   │   ├── TeamGrid.jsx
│   │   ├── InvestorsGrid.jsx
│   │   ├── ProjectsTable.jsx
│   │   └── DigitalPresence.jsx
│   ├── charts/
│   │   ├── KPIBarChart.jsx
│   │   ├── InvestorsPieChart.jsx
│   │   └── GrowthAreaChart.jsx
│   └── styles/
│       └── theme.js             ← פלטת צבעים מרכזית
```

---

### `data/data.js` — מבנה הנתונים

```
export const company      → פרטי חברה (שם, שנה, אתרים, טלפון, מייל)
export const mission      → חזון, משימה, ייחודיות, קהל יעד
export const kpis[]       → { id, label, baseValue, unit }
export const steps[]      → { num, name, description, tech }
export const team[]       → { name, role, expertise, experience }
export const investors[]  → { name, role, category }   ← category לפי PieChart
export const projects[]   → { name, audience, url, partner }
export const digital[]    → { platform, url, audience, purpose }
export const pages[]      → { name, url, status }
```

כל קומפוננט מקבל נתונים אך ורק דרך props מ-`data.js` — אין ערכים קבועים בתוך קומפוננטות.

---

### קומפוננטות

#### `Header`
- לוגו / שם החברה
- תפריט ניווט: סיכום | מוצר | צוות | מודל עסקי
- צ'יפ "FinTech · AI · תל אביב 2021"
- רקע `#1A3A5C`, טקסט לבן, RTL

#### `KPICards`
- מקבל: `kpis[]`
- 4 כרטיסים בשורה (grid-cols-4 → 2 → 1 במובייל)
- כל כרטיס: אייקון, מספר גדול, תווית, progress bar בצבע `#10B981`
- הערך מחושב: `(baseValue / 100).toLocaleString('he-IL', { style: 'percent' })`

#### `StepsTimeline`
- מקבל: `steps[]`
- ציר אנכי — 5 שלבים עם קו מחבר
- כל שלב: עיגול ממוספר (`#2563EB`), שם bold, תיאור, תג טכנולוגיה (`#F59E0B`)
- Responsive: אנכי בדסקטופ, אופקי סקרול במובייל

#### `TeamGrid`
- מקבל: `team[]`
- 2×2 grid בדסקטופ, 1 עמודה במובייל
- כל כרטיס: אווטר (ראשי תיבות), שם, תפקיד, התמחות, ניסיון
- hover: border `#F59E0B`

#### `InvestorsGrid`
- מקבל: `investors[]`
- 2 עמודות, badge לפי `category`:
  - `strategic` → `#2563EB`
  - `government` → `#10B981`
  - `financial` → `#F59E0B`
  - `legal` → `#6B7280`

#### `ProjectsTable`
- מקבל: `projects[]`
- טבלה רספונסיבית עם sticky header
- עמודות: פרויקט | קהל | URL (קישור) | שותף
- zebra striping: `#DBEAFE` / `#FFFFFF`
- מובייל: card layout במקום טבלה

#### `DigitalPresence`
- מקבל: `digital[]`
- 4 כרטיסים עם אייקון ערוץ, URL לחיץ, קהל ומטרה
- רקע `#DBEAFE`, border `#2563EB`

---

### Charts (Recharts)

#### `KPIBarChart`
- נתונים: `kpis[]`
- BarChart אופקי — ציר X אחוזים (0–100%), ציר Y שמות KPIs
- צבע bars: `#2563EB` עם `#10B981` ל-tooltip
- tooltip: ערך + תווית בעברית
- ResponsiveContainer — מלא ברוחב

#### `InvestorsPieChart`
- נתונים: `investors[]` — ספירה לפי `category`
- PieChart עם Legend בעברית
- צבעים לפי קטגוריה (זהה ל-InvestorsGrid)
- Tooltip: שם קטגוריה + מספר

#### `GrowthAreaChart`
- נתונים: נקודות דמה לציר הזמן (2021–2025) הנגזרות מ-data.js
- AreaChart — ציר X שנים, ציר Y אחוז צמיחה
- שני קווים: הכנסות + כשירות אשראי
- fill gradient: `#DBEAFE` → transparent

---

### `styles/theme.js`

```
DARK_BLUE:  "#1A3A5C"
MED_BLUE:   "#2563EB"
LIGHT_BLUE: "#DBEAFE"
GOLD:       "#F59E0B"
GREEN:      "#10B981"
WHITE:      "#FFFFFF"
GRAY:       "#6B7280"
```

---

### עיצוב — RTL ו-Mobile First

- `<html dir="rtl" lang="he">` ב-`index.html`
- Tailwind CSS (או CSS Modules) עם `direction: rtl` גלובלי
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px)
- גופן: `Heebo` (Google Fonts) — תמיכה מלאה בעברית

---

### תלויות (package.json)

```
dependencies:
  react, react-dom          → 18.x
  recharts                  → 2.x
  @vitejs/plugin-react      → 4.x

devDependencies:
  vite                      → 5.x
  tailwindcss               → 3.x
```

---

## חלק ב — Python Scraper + Auto-Update

### מטרה
מושך נתונים חיים מהאתרים של Citizen Impact ומעדכן אוטומטית את `citizen_impact_full.xlsx` כל 24 שעות, עם לוג מלא לכל ריצה.

---

### מבנה תיקיות

```
scripts/
├── scraper.py       ← מושך נתונים מהאתרים
├── updater.py       ← מעדכן את האקסל לפי הנתונים שנמשכו
├── scheduler.py     ← מריץ את הצינור כל 24 שעות
├── recalc.py        ← קיים — ולידציה אחרי עדכון
├── build_citizen_impact.py  ← קיים — בנייה מאפס
logs/
└── update_log.txt   ← נוצר אוטומטית
.env                 ← משתני סביבה
```

---

### `.env`

```
BASE_URL_B2B=https://www.citizens-ai.com
BASE_URL_LANDING=https://landing.is.citizen-ai.org
BASE_URL_CLIENT=https://client.is.citizen-ai.org
EXCEL_PATH=citizen_impact_full.xlsx
LOG_PATH=logs/update_log.txt
REQUEST_TIMEOUT=15
```

---

### `scraper.py`

**ספריות:** `requests`, `beautifulsoup4`, `python-dotenv`

**פונקציות:**

| פונקציה | מקור | מה מושכת |
|---------|------|-----------|
| `scrape_contact_info()` | `BASE_URL_B2B` | אימייל, טלפון, כתובת |
| `scrape_active_pages()` | `BASE_URL_LANDING` | רשימת דפי CustomerHome פעילים |
| `scrape_kpis()` | `BASE_URL_B2B` | KPIs אם מפורסמים בדף הבית |
| `scrape_team()` | `BASE_URL_B2B` | שמות ותפקידים מדף About |
| `scrape_projects()` | `BASE_URL_CLIENT` | פרויקטים פעילים לפי query params |

**מבנה החזרה — `ScraperResult` (dataclass):**
```
contact:  { email, phone }
pages:    [ { name, url, status } ]
kpis:     [ { label, value } ]          ← None אם לא נמצא
team:     [ { name, role } ]            ← None אם לא נמצא
scraped_at: datetime (ISO)
errors:   [ str ]                       ← שגיאות חלקיות, לא עוצרות
```

**טיפול בשגיאות:**
- כל `scrape_*` עטוף ב-`try/except`
- שגיאת רשת → מחזיר `None` לשדה + כותב ל-`errors`
- `requests.get` עם `timeout=REQUEST_TIMEOUT` מ-.env

---

### `updater.py`

**ספריות:** `openpyxl`, `python-dotenv`

**פונקציות:**

| פונקציה | פעולה |
|---------|-------|
| `update_contact(ws, result)` | מעדכן תאים B8, B9 (אימייל, טלפון) בלשונית 1 |
| `update_pages(ws, result)` | מחליף טווח B22:D33 בלשונית 2 בנתונים חדשים |
| `update_kpis(ws, result)` | מעדכן B22:B25 בלשונית 1 אם נמצאו KPIs |
| `run_update(excel_path, result)` | פותח קובץ, קורא לכל `update_*`, שומר |

**עקרון עדכון:**
- רק שדות שהוחזרו בהצלחה (לא `None`) מתעדכנים
- לא מוחק נוסחאות — מעדכן רק תאי ערך
- אחרי שמירה: מריץ `recalc.py` ומוודא `total_errors == 0`

---

### `scheduler.py`

**ספריות:** `APScheduler` (BackgroundScheduler), `python-dotenv`

**תזמון:**
```
cron: hour=6, minute=0          ← כל יום ב-06:00
timezone: Asia/Jerusalem
```

**צינור ריצה:**
```
1. scraper.scrape_all()         → ScraperResult
2. updater.run_update(result)   → saves xlsx
3. recalc.recalc(EXCEL_PATH)    → validates
4. logger.log_run(result, status)
```

**Graceful shutdown:** `atexit` + `SIGTERM` handler.

---

### Logger

**קובץ:** `logs/update_log.txt`

**פורמט שורה:**
```
[2025-06-03 06:00:01] STATUS=success | pages=12 | kpis_updated=4 | errors=0
[2025-06-03 06:00:01] STATUS=partial  | pages=12 | kpis_updated=0 | errors=1 | detail=scrape_kpis: timeout
[2025-06-03 06:00:01] STATUS=error    | detail=Cannot open citizen_impact_full.xlsx
```

**rotation:** אם `update_log.txt` > 1MB — שומר `update_log.bak.txt` ופותח חדש.

---

### תרשים זרימה

```
scheduler.py (cron 06:00)
       │
       ▼
scraper.scrape_all()
  ├── scrape_contact_info()    → BASE_URL_B2B
  ├── scrape_active_pages()   → BASE_URL_LANDING
  ├── scrape_kpis()           → BASE_URL_B2B
  └── scrape_team()           → BASE_URL_B2B
       │
       ▼ ScraperResult
updater.run_update()
  ├── update_contact()
  ├── update_pages()
  └── update_kpis()
       │
       ▼ citizen_impact_full.xlsx (saved)
recalc.recalc()
  └── { "status": "success", "total_errors": 0 }
       │
       ▼
logger.log_run()
  └── logs/update_log.txt
```

---

### תלויות Python (requirements.txt)

```
requests>=2.31
beautifulsoup4>=4.12
openpyxl>=3.1
APScheduler>=3.10
python-dotenv>=1.0
lxml>=5.0          ← parser מהיר ל-BeautifulSoup
```

---

## סדר מימוש מומלץ

| שלב | פעולה |
|-----|-------|
| 1 | `data.js` + `theme.js` — הגדרת כל הנתונים |
| 2 | קומפוננטות סטטיות (Header → KPICards → StepsTimeline) |
| 3 | Charts (BarChart → PieChart → AreaChart) |
| 4 | TeamGrid + InvestorsGrid + ProjectsTable |
| 5 | `scraper.py` — פונקציה אחת בכל פעם, test ידני |
| 6 | `updater.py` + ולידציה עם `recalc.py` |
| 7 | `scheduler.py` + `logger` |
| 8 | חיבור dashboard ל-scraper (API קטן או JSON dump) |
