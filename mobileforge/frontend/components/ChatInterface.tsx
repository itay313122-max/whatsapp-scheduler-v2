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
  sourceType?: 'text' | 'screenshot' | 'sketch' | 'voice';
  imagePreview?: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  projectId?: string;
  initialMessages?: Message[];
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

    // Detect edit mode: if there is already a generated result, subsequent messages edit the existing app
    const lastResultMsg = [...messages].reverse().find((m) => m.result);
    const isEditMode = !!lastResultMsg;
    const existingCode = lastResultMsg
      ? (lastResultMsg.result!.files?.['App.jsx'] ?? lastResultMsg.result!.files?.['App.tsx'] ?? '')
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
      setGenerating(false);
    }
  }

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
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center py-8">
              {/* Logo */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <span className="text-white font-display font-bold text-xl">M</span>
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-text-primary mb-1">MobileForge AI</h2>
                <p className="text-text-secondary text-sm">תאר מה אתה רוצה — או התחל מתבנית</p>
              </div>

              {/* Template Gallery */}
              <div className="w-full max-w-sm">
                <p className="text-text-secondary text-xs font-medium mb-2 text-right">התחל מתבנית מוכנה</p>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setInput(t.prompt);
                        // Auto-submit after a tick
                        setTimeout(() => handleSubmit(t.prompt), 50);
                      }}
                      disabled={isGenerating}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border bg-gradient-to-br text-right transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 ${t.gradient} ${t.border}`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-white/60 flex items-center justify-center flex-shrink-0 text-lg shadow-sm">
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
                    className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-gradient-to-br transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 ${f.color}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${f.iconBg}`}>
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
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex-shrink-0 flex items-center justify-center mr-3 mt-1 shadow-glow">
                  <span className="text-white font-display font-bold text-xs">AI</span>
                </div>
              )}

              <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                {msg.isLoading ? (
                  <div className="px-4 py-3 rounded-2xl glass-card">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-primary animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                      <span className="text-text-secondary text-xs">מייצר את האפליקציה שלך…</span>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-primary text-white rounded-tr-sm'
                        : 'glass-card text-text-primary rounded-tl-sm'
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

                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                    {/* Assistant result actions */}
                    {msg.result && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded flex-shrink-0"
                            style={{ background: msg.result.colorScheme?.primary || '#6C3AE8' }}
                          />
                          <span className="font-display font-semibold text-sm">{msg.result.appName}</span>
                        </div>
                        {msg.result.features?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {msg.result.features.map((f) => (
                              <span
                                key={f}
                                className="px-2 py-0.5 rounded-full text-xs bg-primary/20 text-primary border border-primary/20"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          {msg.result.embedUrl && onShowPreview && (
                            <button
                              onClick={() => onShowPreview(msg.result!)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/20 text-xs font-medium hover:bg-accent/20 transition-all"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.5l-7-4.5V8.5L12 4l7 4.5v5.5L12 18.5z" />
                              </svg>
                              הצג אפליקציה
                            </button>
                          )}
                          {onShowCode && (
                            <button
                              onClick={() => onShowCode(msg.result!)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/20 transition-all"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                              </svg>
                              הצג קוד
                            </button>
                          )}
                        </div>
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

        {/* Input area */}
        <div className="p-4 border-t border-border">
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
          {messages.some((m) => m.result) && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
              <span className="text-primary text-xs">✏️</span>
              <span className="text-primary text-xs font-medium">מצב עריכה — הודעה הבאה תעדכן את האפליקציה</span>
            </div>
          )}

          {/* Main input row */}
          <div className="flex items-end gap-2 p-3 rounded-2xl bg-white border border-border focus-within:border-primary focus-within:shadow-soft transition-all">
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
              placeholder={imagePreview ? 'הוסף הוראות נוספות (אופציונלי)…' : 'תאר את האפליקציה שאתה רוצה…'}
              rows={1}
              dir="rtl"
              disabled={isGenerating}
              className="flex-1 bg-transparent text-text-primary placeholder-text-secondary text-sm resize-none outline-none max-h-[200px] leading-relaxed disabled:opacity-50"
            />

            {/* Send */}
            <button
              onClick={() => handleSubmit()}
              disabled={(!input.trim() && !imageBase64) || isGenerating}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-primary text-white flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-glow"
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

          <p className="text-text-secondary text-xs mt-2 text-center">
            Enter לשליחה · Shift+Enter לשורה חדשה · 📷 צילום מסך · ✏️ סקיצה · 🎤 קול
          </p>
        </div>
      </div>
    </>
  );
}
