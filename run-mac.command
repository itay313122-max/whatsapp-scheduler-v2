#!/bin/bash
# ── העוזר האישי החכם — הפעלה על מק בלחיצה כפולה ─────────────────────────
# פתח את הקובץ הזה בלחיצה כפולה ב-Finder. (בפעם הראשונה: לחיצה ימנית → Open)
cd "$(dirname "$0")" || exit 1
clear
echo "🎙️  העוזר האישי החכם — הפעלה מקומית"
echo "──────────────────────────────────────"

# 1) בדיקת Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js לא מותקן."
  echo "   התקן מ- https://nodejs.org (בחר גרסה LTS, 20 ומעלה) והפעל שוב את הקובץ הזה."
  read -r -p "לחץ Enter לסגירה..."
  exit 1
fi
echo "✅ Node.js: $(node --version)"

# 2) קובץ .env (מפתחות)
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "📝 נוצר קובץ הגדרות חדש (.env)."
  echo "   נפתח עכשיו לעריכה — הדבק את המפתח ANTHROPIC_API_KEY (וקוד גישה אם תרצה), שמור, וחזור לכאן."
  open -e .env 2>/dev/null || true
  read -r -p "לחץ Enter אחרי ששמרת את הקובץ..."
fi

# 3) התקנת תלויות (פעם ראשונה)
if [ ! -d node_modules ]; then
  echo ""
  echo "📦 מתקין רכיבים (פעם ראשונה בלבד, יכול לקחת כמה דקות)..."
  npm install || { echo "❌ שגיאה בהתקנה."; read -r -p "Enter לסגירה..."; exit 1; }
fi

# 4) הפעלה + פתיחת הדפדפן
PORT_VAL="$(grep -E '^PORT=' .env | cut -d= -f2)"
PORT_VAL="${PORT_VAL:-3000}"
URL="http://localhost:${PORT_VAL}/assistant.html"
echo ""
echo "🚀 מפעיל את העוזר: $URL"
echo "   (להשארת ריצה — אל תסגור את החלון הזה. לעצירה — Ctrl+C)"
( sleep 2; open "$URL" ) &
exec node --env-file=.env server.js
