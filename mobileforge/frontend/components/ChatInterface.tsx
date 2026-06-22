'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { generateApp, generateFromImage, type GenerateResponse } from '@/lib/api';

const SketchCanvas = dynamic(() => import('./SketchCanvas'), { ssr: false });

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  result?: GenerateResponse;
  isLoading?: boolean;
  loadingStep?: number;
  sourceType?: 'text' | 'screenshot' | 'sketch' | 'voice';
  imagePreview?: string;
  timestamp: Date;
}

const LOADING_STEPS = [
  { label: 'מנתח את הבקשה…', icon: '🧠', duration: 1200 },
  { label: 'מעצב את הממשק…', icon: '🎨', duration: 2000 },
  { label: 'בונה את הקוד…', icon: '⚡', duration: 3000 },
  { label: 'סיום ועיצוב סופי…', icon: '✨', duration: 2000 },
];

type AppCategory = 'store' | 'restaurant' | 'fitness' | 'tasks' | 'finance' | 'social' | 'weather' | 'learning' | 'general';

const QUICK_ACTIONS: Record<AppCategory, Array<{ label: string; prompt: string; icon: string }>> = {
  store: [
    { label: 'שנה צבעים', prompt: 'שנה את סכמת הצבעים לגוונים של סגול כהה וזהב', icon: '🎨' },
    { label: 'הוסף מבצעים', prompt: 'הוסף באנר מבצעים בראש העמוד עם טיימר ספירה לאחור', icon: '🏷️' },
    { label: 'מצב כהה', prompt: 'המר את העיצוב למצב כהה (dark mode) עם רקע כהה וטקסט בהיר', icon: '🌙' },
    { label: 'הוסף חיפוש', prompt: 'הוסף שדה חיפוש מוצרים בראש העמוד עם אייקון זכוכית מגדלת', icon: '🔍' },
  ],
  restaurant: [
    { label: 'הוסף דירוגים', prompt: 'הוסף דירוג כוכבים לכל מנה בתפריט', icon: '⭐' },
    { label: 'מצב כהה', prompt: 'המר את העיצוב למצב כהה (dark mode)', icon: '🌙' },
    { label: 'הוסף קופון', prompt: 'הוסף שדה קופון הנחה בסיכום ההזמנה', icon: '🎟️' },
    { label: 'זמן אספקה', prompt: 'הוסף הצגת זמן אספקה משוער עם אנימציה', icon: '🕐' },
  ],
  fitness: [
    { label: 'הוסף טיימר', prompt: 'הוסף טיימר אימון אינטראקטיבי עם כפתורי start/stop/reset', icon: '⏱️' },
    { label: 'גרף התקדמות', prompt: 'הוסף גרף התקדמות שבועי עם עמודות צבעוניות', icon: '📊' },
    { label: 'שנה צבעים', prompt: 'שנה את הצבעים לכתום ושחור — סגנון אנרגטי', icon: '🎨' },
    { label: 'הוסף אתגר', prompt: 'הוסף סקשן אתגר יומי עם פס התקדמות', icon: '🏆' },
  ],
  tasks: [
    { label: 'הוסף קטגוריות', prompt: 'הוסף סינון לפי קטגוריות צבעוניות (עבודה, אישי, קניות)', icon: '🏷️' },
    { label: 'לוח שנה', prompt: 'הוסף תצוגת לוח שנה חודשי עם סימון ימים עמוסים', icon: '📅' },
    { label: 'סטטיסטיקות', prompt: 'הוסף כרטיסיות סטטיסטיקה — הושלמו, בהמתנה, שיא רצף', icon: '📊' },
    { label: 'מצב כהה', prompt: 'המר למצב כהה עם רקע כהה', icon: '🌙' },
  ],
  finance: [
    { label: 'תרשים עוגה', prompt: 'הוסף תרשים עוגה צבעוני שמציג חלוקת הוצאות לפי קטגוריה', icon: '📊' },
    { label: 'התראות', prompt: 'הוסף התראת חריגה מתקציב עם אנימציית shake', icon: '🔔' },
    { label: 'יעדי חיסכון', prompt: 'הוסף מסך יעדי חיסכון עם פס התקדמות לכל יעד', icon: '🎯' },
    { label: 'שנה צבעים', prompt: 'שנה לצבעים כחול כהה וזהב — סגנון פרימיום', icon: '🎨' },
  ],
  social: [
    { label: 'סטוריז', prompt: 'הוסף שורת סטוריז עגולה בראש הפיד כמו אינסטגרם', icon: '⭕' },
    { label: 'אנימציות', prompt: 'הוסף אנימציית לייק עם לב שמתנפח בלחיצה', icon: '❤️' },
    { label: 'מצב כהה', prompt: 'המר למצב כהה — רקע שחור עם כרטיסים אפור כהה', icon: '🌙' },
    { label: 'הודעות', prompt: 'הוסף מסך הודעות עם רשימת שיחות וזמן אחרון', icon: '💬' },
  ],
  weather: [
    { label: 'תחזית שבועית', prompt: 'הוסף תחזית שבועית ל-7 ימים עם אייקונים ומינ/מקס', icon: '📅' },
    { label: 'הוסף מפה', prompt: 'הוסף מפת מזג אוויר עם שכבות טמפרטורה צבעוניות', icon: '🗺️' },
    { label: 'אנימציות', prompt: 'הוסף אנימציות — ענן זז, שמש מסתובבת, גשם יורד', icon: '✨' },
    { label: 'התראות', prompt: 'הוסף התראת מזג אוויר קיצוני עם באנר אדום', icon: '⚠️' },
  ],
  learning: [
    { label: 'פס התקדמות', prompt: 'הוסף פס התקדמות לכל קורס עם אחוזים ואנימציה', icon: '📊' },
    { label: 'אישורי הרשמה', prompt: 'הוסף תג badges ותעודות עבור השלמת קורסים', icon: '🏅' },
    { label: 'חיפוש', prompt: 'הוסף חיפוש וסינון קורסים לפי קטגוריה ורמת קושי', icon: '🔍' },
    { label: 'מצב כהה', prompt: 'המר למצב כהה — רקע כהה עם אקסנט אינדיגו', icon: '🌙' },
  ],
  general: [
    { label: 'שנה צבעים', prompt: 'שנה את סכמת הצבעים לגוונים חמים — כתום וקורל', icon: '🎨' },
    { label: 'מצב כהה', prompt: 'המר את העיצוב למצב כהה', icon: '🌙' },
    { label: 'הוסף ניווט', prompt: 'הוסף תפריט ניווט תחתון עם 4 אייקונים', icon: '📱' },
    { label: 'הוסף אנימציות', prompt: 'הוסף אנימציות כניסה — fade in, slide up לכל כרטיס', icon: '✨' },
  ],
};

function detectAppCategory(result: GenerateResponse): AppCategory {
  const name = (result.appName || '').toLowerCase();
  const features = (result.features || []).join(' ').toLowerCase();
  const text = `${name} ${features}`;
  if (text.includes('חנות') || text.includes('store') || text.includes('shop') || text.includes('מוצר')) return 'store';
  if (text.includes('מסעדה') || text.includes('food') || text.includes('restaurant') || text.includes('תפריט')) return 'restaurant';
  if (text.includes('כושר') || text.includes('fitness') || text.includes('אימון') || text.includes('sport')) return 'fitness';
  if (text.includes('משימ') || text.includes('task') || text.includes('todo')) return 'tasks';
  if (text.includes('תקציב') || text.includes('finance') || text.includes('כסף') || text.includes('הוצא')) return 'finance';
  if (text.includes('חברת') || text.includes('social') || text.includes('פיד') || text.includes('פוסט')) return 'social';
  if (text.includes('מזג') || text.includes('weather') || text.includes('טמפרטור')) return 'weather';
  if (text.includes('למידה') || text.includes('learn') || text.includes('קורס') || text.includes('שיעור')) return 'learning';
  return 'general';
}

interface ChatInterfaceProps {
  projectId?: string;
  initialMessages?: Message[];
  initialPrompt?: string;
  currentAppResult?: GenerateResponse | null;
  onAppGenerated?: (result: GenerateResponse) => void;
  onShowPreview?: (result: GenerateResponse) => void;
  onShowCode?: (result: GenerateResponse) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

const TEMPLATES = [
  {
    id: 'store',
    emoji: '🛍️',
    name: 'חנות אונליין',
    desc: 'קטלוג מוצרים, סל קניות ותשלום',
    gradient: 'from-violet-500/15 to-purple-500/10',
    border: 'border-violet-200/60',
    prompt: 'בנה אפליקציית חנות אונליין מעוצבת עם קטלוג מוצרים (6 פריטים עם אימוג\'י, שם, מחיר), סל קניות עם הוספה והסרה, ומסך תשלום. ניווט תחתון בין קטלוג, סל ופרופיל. עיצוב מודרני עם באנר gradient ו-empty states',
  },
  {
    id: 'restaurant',
    emoji: '🍕',
    name: 'אפליקציית מסעדה',
    desc: 'תפריט, הזמנות וסטטוס משלוח',
    gradient: 'from-orange-500/15 to-red-500/10',
    border: 'border-orange-200/60',
    prompt: 'בנה אפליקציית מסעדה מעוצבת עם תפריט מחולק לקטגוריות (מנות עיקריות, תוספות, שתייה, קינוחים), כל מנה עם אימוג\'י שם מחיר ותיאור קצר. אפשרות הוספה להזמנה, מסך סיכום הזמנה עם סה"כ, ומסך סטטוס משלוח. עיצוב חם עם צבעי כתום ואדום',
  },
  {
    id: 'fitness',
    emoji: '💪',
    name: 'אפליקציית כושר',
    desc: 'אימונים, מעקב התקדמות וטיימר',
    gradient: 'from-red-500/15 to-pink-500/10',
    border: 'border-red-200/60',
    prompt: 'בנה אפליקציית כושר עם רשימת אימונים (כוח, קרדיו, יוגה, HIIT), כל אימון עם תרגילים, סטים וחזרות. טיימר אימון עם סטופר, מסך מעקב התקדמות עם גרף שבועי (bars), ומסך פרופיל עם סטטיסטיקות. עיצוב אנרגטי עם צבעי אדום וורוד',
  },
  {
    id: 'tasks',
    emoji: '✅',
    name: 'מנהל משימות',
    desc: 'משימות, קטגוריות ופס התקדמות',
    gradient: 'from-emerald-500/15 to-green-500/10',
    border: 'border-emerald-200/60',
    prompt: 'בנה אפליקציית ניהול משימות עם הוספת משימות חדשות, סימון השלמה, מחיקה, סינון (הכל/פעילות/הושלמו), פס התקדמות ויזואלי עם אחוזים, וקטגוריות צבעוניות (עבודה, אישי, קניות). עיצוב נקי בירוק',
  },
  {
    id: 'finance',
    emoji: '💰',
    name: 'ניהול תקציב',
    desc: 'הוצאות, הכנסות ותרשימים',
    gradient: 'from-emerald-500/15 to-teal-500/10',
    border: 'border-teal-200/60',
    prompt: 'בנה אפליקציית ניהול תקציב אישי עם מסך ראשי שמציג יתרה, הכנסות והוצאות החודש. אפשרות הוספת הוצאה/הכנסה עם קטגוריה (אוכל, תחבורה, בידור, חשבונות), היסטוריית תנועות, ומסך סיכום עם חלוקה לפי קטגוריות. עיצוב פיננסי בירוק-כחול',
  },
  {
    id: 'social',
    emoji: '💬',
    name: 'רשת חברתית',
    desc: 'פיד, פרופיל ולייקים',
    gradient: 'from-blue-500/15 to-cyan-500/10',
    border: 'border-blue-200/60',
    prompt: 'בנה אפליקציית רשת חברתית עם פיד פוסטים (כרטיסים עם אווטאר, שם, תוכן, לייקים ותגובות), מסך פרופיל עם תמונה סטטיסטיקות ופוסטים, מסך הודעות, וכפתור יצירת פוסט חדש. עיצוב מודרני בכחול',
  },
  {
    id: 'weather',
    emoji: '🌤️',
    name: 'מזג אוויר',
    desc: 'תחזית, טמפרטורה ומפה',
    gradient: 'from-sky-500/15 to-blue-500/10',
    border: 'border-sky-200/60',
    prompt: 'בנה אפליקציית מזג אוויר עם מסך ראשי שמציג טמפרטורה נוכחית גדולה, מצב מזג אוויר עם אימוג\'י, תחזית שעתית (גלילה אופקית), תחזית שבועית (7 ימים), ופרטים נוספים (לחות, רוח, UV). עיצוב נקי עם gradient כחול-סגול',
  },
  {
    id: 'learning',
    emoji: '📚',
    name: 'פלטפורמת למידה',
    desc: 'קורסים, שיעורים והתקדמות',
    gradient: 'from-indigo-500/15 to-violet-500/10',
    border: 'border-indigo-200/60',
    prompt: 'בנה אפליקציית למידה עם קטלוג קורסים (6 קורסים עם אימוג\'י, שם, מורה, מספר שיעורים), מסך קורס עם רשימת שיעורים וסימון השלמה, פס התקדמות, ומסך פרופיל עם סטטיסטיקות למידה. עיצוב אקדמי באינדיגו',
  },
];

// Compress image to base64 (max 1024px wide, jpeg 85%)
async function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxW = 1024;
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Source type badge
function SourceBadge({ type }: { type: 'screenshot' | 'sketch' | 'voice' }) {
  const map = {
    screenshot: { label: 'Screenshot Clone', icon: '📷', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    sketch: { label: 'Sketch', icon: '✏️', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    voice: { label: 'Voice', icon: '🎤', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  };
  const { label, icon, color } = map[type];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${color} mr-2`}>
      {icon} {label}
    </span>
  );
}

export default function ChatInterface({
  projectId,
  initialMessages = [],
  initialPrompt,
  currentAppResult,
  onAppGenerated,
  onShowPreview,
  onShowCode,
  onGeneratingChange,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Notify parent when generating state changes
  const setGenerating = useCallback((val: boolean) => {
    setIsGenerating(val);
    onGeneratingChange?.(val);
  }, [onGeneratingChange]);

  // Ref for auto-submit (used after handleSubmit is defined)
  const autoSubmittedRef = useRef(false);

  // Image upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sketch state
  const [showSketch, setShowSketch] = useState(false);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  function adjustTextareaHeight() {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }

  // ── Image upload ────────────────────────────────────────────────────────────
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('הקובץ גדול מדי (מקסימום 10MB)');
      return;
    }
    try {
      const { base64, mimeType } = await compressImage(file);
      setImageBase64(base64);
      setImageMimeType(mimeType);
      setImagePreview(`data:${mimeType};base64,${base64}`);
    } catch {
      alert('שגיאה בטעינת התמונה');
    }
    // reset so the same file can be re-selected
    e.target.value = '';
  }

  function clearImage() {
    setImagePreview(null);
    setImageBase64(null);
  }

  // ── Voice input ─────────────────────────────────────────────────────────────
  function toggleVoice() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = 'he-IL';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join('');
      setInput(transcript);
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px';
      }
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }

  // ── Sketch submit ───────────────────────────────────────────────────────────
  function handleSketchSubmit(base64: string, mimeType: string, sketchHint?: string) {
    setShowSketch(false);
    submitWithImage(base64, mimeType, sketchHint, true);
  }

  // ── Core submit ─────────────────────────────────────────────────────────────
  async function submitWithImage(
    base64: string,
    mimeType: string,
    optPrompt?: string,
    isSketch = false
  ) {
    const label = isSketch ? '✏️ [סקיצה]' : '📷 [צילום מסך]';
    const displayContent = optPrompt ? `${label} ${optPrompt}` : label;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: displayContent,
      sourceType: isSketch ? 'sketch' : 'screenshot',
      imagePreview: `data:${mimeType};base64,${base64}`,
      timestamp: new Date(),
    };
    const loadingMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setGenerating(true);
    clearImage();

    try {
      const result = await generateFromImage({
        image: base64,
        mimeType,
        prompt: optPrompt,
        projectId,
        isSketch,
      });

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.hebrewSummary,
        result,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev.slice(0, -1), assistantMsg]);
      onAppGenerated?.(result);
    } catch (err) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `שגיאה: ${err instanceof Error ? err.message : 'משהו השתבש. נסה שוב.'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(promptOverride?: string) {
    // If we have an image pending, use vision endpoint
    if (imageBase64) {
      await submitWithImage(imageBase64, imageMimeType, input.trim() || undefined, false);
      setInput('');
      if (inputRef.current) inputRef.current.style.height = 'auto';
      return;
    }

    const prompt = promptOverride || input.trim();
    if (!prompt || isGenerating) return;

    const sourceType: Message['sourceType'] = isListening ? 'voice' : 'text';

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      sourceType,
      timestamp: new Date(),
    };
    const loadingMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput('');
    setGenerating(true);
    if (inputRef.current) inputRef.current.style.height = 'auto';

    // Animate loading steps
    const loadingId = loadingMsg.id;
    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < LOADING_STEPS.length) {
        setMessages((prev) =>
          prev.map((m) => m.id === loadingId ? { ...m, loadingStep: stepIdx } : m)
        );
      }
    }, LOADING_STEPS[0].duration);

    // Detect edit mode: if there is already a generated result (from messages or from loaded app), edit instead of regenerate
    const lastResultMsg = [...messages].reverse().find((m) => m.result);
    const lastResult = lastResultMsg?.result ?? currentAppResult;
    const isEditMode = !!lastResult;
    const existingCode = lastResult
      ? (lastResult.files?.['App.jsx'] ?? lastResult.files?.['App.tsx'] ?? '')
      : undefined;

    const history = messages.map((m) => ({
      role: m.role,
      content:
        m.role === 'assistant' && m.result
          ? `${m.result.hebrewSummary}\n\nקוד נוכחי:\n\`\`\`jsx\n${
              m.result.files?.['App.jsx'] ?? m.result.files?.['App.tsx'] ?? ''
            }\n\`\`\``
          : m.content,
    }));

    try {
      const result = await generateApp({ projectId, prompt, conversationHistory: history, editMode: isEditMode, existingCode });
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.hebrewSummary,
        result,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev.slice(0, -1), assistantMsg]);
      onAppGenerated?.(result);
    } catch (err) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `שגיאה: ${err instanceof Error ? err.message : 'משהו השתבש. נסה שוב.'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      clearInterval(stepInterval);
      setGenerating(false);
    }
  }

  // Auto-submit initial prompt from landing page
  useEffect(() => {
    if (initialPrompt && !autoSubmittedRef.current && !isGenerating) {
      autoSubmittedRef.current = true;
      setTimeout(() => handleSubmit(initialPrompt), 200);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  // ── Viral feature cards (empty state) ───────────────────────────────────────
  const viralFeatures = [
    {
      icon: '📷',
      title: 'Screenshot → Clone',
      desc: 'העלה צילום מסך של כל אפליקציה — AI ישחזר אותה',
      action: () => fileInputRef.current?.click(),
      color: 'from-sky-400/15 to-sky-400/5 border-sky-200',
      iconBg: 'bg-sky-400/20 text-sky-500',
    },
    {
      icon: '✏️',
      title: 'Sketch → App',
      desc: 'צייר wireframe ו-AI יהפוך אותו לאפליקציה מלאה',
      action: () => setShowSketch(true),
      color: 'from-violet-400/15 to-violet-400/5 border-violet-200',
      iconBg: 'bg-violet-400/20 text-violet-500',
    },
    {
      icon: '🎤',
      title: 'Voice → App',
      desc: 'דבר בעברית — AI יבין ויבנה',
      action: toggleVoice,
      color: 'from-emerald-400/15 to-emerald-400/5 border-emerald-200',
      iconBg: 'bg-emerald-400/20 text-emerald-500',
      disabled: !voiceSupported,
    },
  ];

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Sketch modal */}
      {showSketch && (
        <SketchCanvas
          onClose={() => setShowSketch(false)}
          onSubmit={handleSketchSubmit}
          isGenerating={isGenerating}
        />
      )}

      <div className="flex flex-col h-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center py-8">
              {/* Logo — Lovable-style gradient icon */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center animate-fade-in-up shadow-lg shadow-violet-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <h2 className="font-display font-bold text-lg text-text-primary mb-1">מה נבנה היום?</h2>
                <p className="text-text-secondary text-sm">בחר תבנית, צלם מסך, או פשוט ספר לי</p>
              </div>

              {/* Template Gallery — Lovable-style cards */}
              <div className="w-full max-w-sm">
                <p className="text-text-secondary text-xs font-medium mb-2 text-right">התחל מתבנית מוכנה</p>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setInput(t.prompt);
                        setTimeout(() => handleSubmit(t.prompt), 50);
                      }}
                      disabled={isGenerating}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-border/50 bg-surface/40 text-right transition-all hover:bg-surface/70 hover:border-primary/30 active:scale-[0.98] disabled:opacity-40"
                    >
                      <div className="w-9 h-9 rounded-lg bg-surface/60 border border-border/30 flex items-center justify-center flex-shrink-0 text-lg">
                        {t.emoji}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-text-primary text-[13px] truncate">{t.name}</p>
                        <p className="text-text-secondary text-[11px] truncate">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 w-full max-w-sm">
                <div className="flex-1 h-px bg-border" />
                <span className="text-text-secondary text-xs">או</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Input methods row */}
              <div className="flex gap-2 w-full max-w-sm">
                {viralFeatures.map((f) => (
                  <button
                    key={f.title}
                    onClick={f.action}
                    disabled={f.disabled || isGenerating}
                    className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 bg-surface/30 transition-all hover:bg-surface/50 hover:border-primary/30 active:scale-[0.98] disabled:opacity-40"
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface/40 flex items-center justify-center text-base">
                      {f.icon}
                    </div>
                    <p className="font-medium text-text-primary text-xs">{f.title}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex-shrink-0 flex items-center justify-center mr-3 mt-1 shadow-sm shadow-violet-500/20">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
              )}

              <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                {msg.isLoading ? (
                  <div className="px-4 py-3 rounded-2xl glass-card" dir="rtl">
                    <div className="space-y-2">
                      {LOADING_STEPS.map((step, i) => {
                        const currentStep = msg.loadingStep || 0;
                        const isDone = i < currentStep;
                        const isActive = i === currentStep;
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-2 transition-all duration-300 ${
                              isDone ? 'opacity-50' : isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
                            }`}
                          >
                            {isDone ? (
                              <span className="text-green-400 text-sm">✓</span>
                            ) : (
                              <span className="text-sm animate-pulse">{step.icon}</span>
                            )}
                            <span className={`text-xs ${isDone ? 'text-text-secondary line-through' : 'text-text-primary font-medium'}`}>
                              {step.label}
                            </span>
                            {isActive && (
                              <div className="flex gap-0.5 mr-auto">
                                {[0, 1, 2].map((d) => (
                                  <div key={d} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-sm'
                        : 'bg-surface/60 border border-border/30 text-text-primary rounded-tl-sm'
                    }`}
                    dir="rtl"
                  >
                    {/* Source badge */}
                    {msg.sourceType && msg.sourceType !== 'text' && (
                      <div className="mb-2">
                        <SourceBadge type={msg.sourceType as 'screenshot' | 'sketch' | 'voice'} />
                      </div>
                    )}

                    {/* Image thumbnail (user message) */}
                    {msg.imagePreview && (
                      <div className="mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.imagePreview}
                          alt="uploaded"
                          className="max-w-[200px] max-h-[150px] rounded-xl object-cover border border-white/20"
                        />
                      </div>
                    )}

                    {/* Show content — if result exists, show condensed summary */}
                    {msg.result ? (
                      <p className="text-sm leading-relaxed">{msg.content.split('\n')[0]}</p>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {/* Assistant result actions */}
                    {msg.result && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded flex-shrink-0"
                            style={{ background: msg.result.colorScheme?.primary || '#6C3AE8' }}
                          />
                          <span className="font-display font-semibold text-sm">{msg.result.appName}</span>
                          <span className="text-[10px] text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full mr-auto">מוכן ✓</span>
                        </div>
                        <div className="flex gap-2">
                          {msg.result.embedUrl && onShowPreview && (
                            <button
                              onClick={() => onShowPreview(msg.result!)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent/10 text-accent border border-accent/20 text-xs font-semibold hover:bg-accent/20 transition-all min-h-[36px]"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              צפה בתוצאה
                            </button>
                          )}
                          {onShowCode && (
                            <button
                              onClick={() => onShowCode(msg.result!)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-semibold hover:bg-primary/20 transition-all min-h-[36px]"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                              </svg>
                              קוד
                            </button>
                          )}
                        </div>

                        {/* Quick action chips — contextual suggestions */}
                        {msg.id === [...messages].reverse().find((m) => m.result)?.id && (
                          <div className="space-y-1.5">
                            <p className="text-[11px] text-text-secondary font-medium">⚡ שיפורים מהירים:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {QUICK_ACTIONS[detectAppCategory(msg.result)].map((action) => (
                                <button
                                  key={action.label}
                                  onClick={() => handleSubmit(action.prompt)}
                                  disabled={isGenerating}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-text-primary hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-30 min-h-[32px]"
                                >
                                  <span>{action.icon}</span>
                                  <span>{action.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <p className="text-text-secondary text-xs mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area — Lovable-style */}
        <div className="p-4 border-t border-border/30">
          {/* Image preview */}
          {imagePreview && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="relative flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="preview" className="w-12 h-12 rounded-lg object-cover border border-border" />
                <button
                  onClick={clearImage}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-xs leading-none hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
              <div className="text-xs text-text-secondary">
                <span className="text-blue-400 font-medium">📷 Screenshot Clone</span>
                <br />
                AI ישחזר את הממשק הזה
              </div>
            </div>
          )}

          {/* Voice listening indicator */}
          {isListening && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex gap-0.5 items-end h-4">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-green-400 animate-bounce"
                    style={{
                      height: `${[60, 100, 80, 40][i]}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-green-400 text-xs font-medium">מאזין… דבר עכשיו</span>
              <button onClick={toggleVoice} className="mr-auto text-xs text-green-400 hover:text-green-300">
                עצור
              </button>
            </div>
          )}

          {/* Edit mode indicator */}
          {(messages.some((m) => m.result) || currentAppResult) && !isGenerating && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/15">
              <span className="text-primary text-xs">✏️</span>
              <span className="text-primary/80 text-[11px] font-medium">כתוב מה לשנות — או לחץ על שיפור מהיר למעלה</span>
            </div>
          )}

          {/* Main input row — Lovable-style dark glass input */}
          <div className="flex items-end gap-2 p-3 rounded-2xl bg-surface/60 border border-border/50 focus-within:border-primary/50 focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.2)] transition-all">
            {/* Viral feature buttons */}
            <div className="flex items-center gap-1 flex-shrink-0 mb-0.5">
              {/* Screenshot */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
                title="העלה צילום מסך"
                className="w-8 h-8 rounded-lg text-text-secondary hover:text-blue-400 hover:bg-blue-500/10 flex items-center justify-center transition-all disabled:opacity-30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Sketch */}
              <button
                onClick={() => setShowSketch(true)}
                disabled={isGenerating}
                title="ציור סקיצה"
                className="w-8 h-8 rounded-lg text-text-secondary hover:text-purple-400 hover:bg-purple-500/10 flex items-center justify-center transition-all disabled:opacity-30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>

              {/* Voice */}
              {voiceSupported && (
                <button
                  onClick={toggleVoice}
                  disabled={isGenerating}
                  title={isListening ? 'עצור הקלטה' : 'קלט קולי'}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 ${
                    isListening
                      ? 'text-green-400 bg-green-500/20 animate-pulse-slow'
                      : 'text-text-secondary hover:text-green-400 hover:bg-green-500/10'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-border flex-shrink-0 mb-1" />

            {/* Textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); adjustTextareaHeight(); }}
              onKeyDown={handleKeyDown}
              placeholder={imagePreview ? 'הוסף הוראות נוספות (אופציונלי)…' : (messages.some((m) => m.result) || currentAppResult) ? 'למשל: "שנה את הצבע לורוד" או "הוסף מסך הגדרות"…' : 'תאר את האפליקציה שאתה רוצה…'}
              rows={1}
              dir="rtl"
              disabled={isGenerating}
              className="flex-1 bg-transparent text-text-primary placeholder-text-secondary text-sm resize-none outline-none max-h-[200px] leading-relaxed disabled:opacity-50"
            />

            {/* Send */}
            <button
              onClick={() => handleSubmit()}
              disabled={(!input.trim() && !imageBase64) || isGenerating}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>

          <p className="text-text-secondary text-[10px] mt-1.5 text-center opacity-60">
            Enter לשליחה · Shift+Enter לשורה חדשה
          </p>
        </div>
      </div>
    </>
  );
}
