'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { generateApp, generateFromImage, planApp, getThemes, type GenerateResponse, type PlanQuestion, type PlanResult, type ThemeMeta } from '@/lib/api';

const SketchCanvas = dynamic(() => import('./SketchCanvas'), { ssr: false });

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  result?: GenerateResponse;
  isLoading?: boolean;
  isPlanning?: boolean;
  loadingStep?: number;
  sourceType?: 'text' | 'screenshot' | 'sketch' | 'voice';
  imagePreview?: string;
  timestamp: Date;
  // Chat-Mode clarifying questions (Lovable-style)
  questions?: PlanQuestion[];
  answers?: Record<string, string>;
  pendingPrompt?: string;
  planHistory?: { role: 'user' | 'assistant'; content: string }[];
  planLocked?: boolean;
}

// Stitch-style agent build log — a sequence of concrete steps the "agent"
// works through. Durations are tuned so the log keeps progressing across the
// full ~30s generation instead of stalling on the last line.
const LOADING_STEPS = [
  { label: 'Understanding your idea…',        icon: '🧠', duration: 2500 },
  { label: 'Planning screens & navigation…',  icon: '🗺️', duration: 4000 },
  { label: 'Choosing layout & components…',   icon: '🧩', duration: 4500 },
  { label: 'Designing the visual system…',    icon: '🎨', duration: 4500 },
  { label: 'Writing the React code…',         icon: '⚡', duration: 6000 },
  { label: 'Wiring up interactions…',         icon: '🔗', duration: 4500 },
  { label: 'Polishing & final touches…',      icon: '✨', duration: 4000 },
];

type AppCategory = 'store' | 'restaurant' | 'fitness' | 'tasks' | 'finance' | 'social' | 'weather' | 'learning' | 'general';

const QUICK_ACTIONS: Record<AppCategory, Array<{ label: string; prompt: string; icon: string }>> = {
  store: [
    { label: 'Change colors', prompt: 'Change the color scheme to deep purple and gold tones', icon: '🎨' },
    { label: 'Add deals', prompt: 'Add a deals banner at the top of the page with a countdown timer', icon: '🏷️' },
    { label: 'Dark mode', prompt: 'Convert the design to dark mode with a dark background and light text', icon: '🌙' },
    { label: 'Add search', prompt: 'Add a product search field at the top of the page with a magnifying glass icon', icon: '🔍' },
  ],
  restaurant: [
    { label: 'Add ratings', prompt: 'Add a star rating to each menu item', icon: '⭐' },
    { label: 'Dark mode', prompt: 'Convert the design to dark mode', icon: '🌙' },
    { label: 'Add coupon', prompt: 'Add a discount coupon field in the order summary', icon: '🎟️' },
    { label: 'Delivery time', prompt: 'Add an estimated delivery time display with animation', icon: '🕐' },
  ],
  fitness: [
    { label: 'Add timer', prompt: 'Add an interactive workout timer with start/stop/reset buttons', icon: '⏱️' },
    { label: 'Progress chart', prompt: 'Add a weekly progress chart with colorful bars', icon: '📊' },
    { label: 'Change colors', prompt: 'Change the colors to orange and black for an energetic style', icon: '🎨' },
    { label: 'Add challenge', prompt: 'Add a daily challenge section with a progress bar', icon: '🏆' },
  ],
  tasks: [
    { label: 'Add categories', prompt: 'Add filtering by colorful categories (work, personal, shopping)', icon: '🏷️' },
    { label: 'Calendar', prompt: 'Add a monthly calendar view that highlights busy days', icon: '📅' },
    { label: 'Statistics', prompt: 'Add statistics cards — completed, pending, longest streak', icon: '📊' },
    { label: 'Dark mode', prompt: 'Convert to dark mode with a dark background', icon: '🌙' },
  ],
  finance: [
    { label: 'Pie chart', prompt: 'Add a colorful pie chart showing the breakdown of expenses by category', icon: '📊' },
    { label: 'Alerts', prompt: 'Add a budget overrun alert with a shake animation', icon: '🔔' },
    { label: 'Savings goals', prompt: 'Add a savings goals screen with a progress bar for each goal', icon: '🎯' },
    { label: 'Change colors', prompt: 'Change to deep blue and gold colors for a premium style', icon: '🎨' },
  ],
  social: [
    { label: 'Stories', prompt: 'Add a row of circular stories at the top of the feed, like Instagram', icon: '⭕' },
    { label: 'Animations', prompt: 'Add a like animation with a heart that pops on tap', icon: '❤️' },
    { label: 'Dark mode', prompt: 'Convert to dark mode — black background with dark gray cards', icon: '🌙' },
    { label: 'Messages', prompt: 'Add a messages screen with a conversation list and last-active time', icon: '💬' },
  ],
  weather: [
    { label: 'Weekly forecast', prompt: 'Add a 7-day weekly forecast with icons and min/max temperatures', icon: '📅' },
    { label: 'Add map', prompt: 'Add a weather map with colorful temperature layers', icon: '🗺️' },
    { label: 'Animations', prompt: 'Add animations — drifting clouds, a spinning sun, falling rain', icon: '✨' },
    { label: 'Alerts', prompt: 'Add a severe weather alert with a red banner', icon: '⚠️' },
  ],
  learning: [
    { label: 'Progress bar', prompt: 'Add a progress bar for each course with percentages and animation', icon: '📊' },
    { label: 'Certificates', prompt: 'Add badges and certificates for completed courses', icon: '🏅' },
    { label: 'Search', prompt: 'Add search and filtering of courses by category and difficulty level', icon: '🔍' },
    { label: 'Dark mode', prompt: 'Convert to dark mode — dark background with an indigo accent', icon: '🌙' },
  ],
  general: [
    { label: 'Change colors', prompt: 'Change the color scheme to warm tones — orange and coral', icon: '🎨' },
    { label: 'Dark mode', prompt: 'Convert the design to dark mode', icon: '🌙' },
    { label: 'Add navigation', prompt: 'Add a bottom navigation bar with 4 icons', icon: '📱' },
    { label: 'Add animations', prompt: 'Add entrance animations — fade in, slide up for each card', icon: '✨' },
  ],
};

function detectAppCategory(result: GenerateResponse): AppCategory {
  const name = (result.appName || '').toLowerCase();
  const features = (result.features || []).join(' ').toLowerCase();
  const text = `${name} ${features}`;
  if (text.includes('store') || text.includes('shop') || text.includes('product')) return 'store';
  if (text.includes('food') || text.includes('restaurant') || text.includes('menu')) return 'restaurant';
  if (text.includes('fitness') || text.includes('workout') || text.includes('sport')) return 'fitness';
  if (text.includes('task') || text.includes('todo')) return 'tasks';
  if (text.includes('budget') || text.includes('finance') || text.includes('money') || text.includes('expense')) return 'finance';
  if (text.includes('social') || text.includes('feed') || text.includes('post')) return 'social';
  if (text.includes('weather') || text.includes('temperature')) return 'weather';
  if (text.includes('learn') || text.includes('course') || text.includes('lesson')) return 'learning';
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
    name: 'Online Store',
    desc: 'Product catalog, cart and checkout',
    recommended: true,
    gradient: 'from-violet-500/40 to-purple-500/25',
    border: 'border-violet-200/60',
    prompt: "Build a polished online store app with a product catalog (6 items with emoji, name, price), a shopping cart with add and remove, and a checkout screen. Bottom navigation between catalog, cart and profile. Modern design with a gradient banner and empty states",
  },
  {
    id: 'restaurant',
    emoji: '🍕',
    name: 'Restaurant App',
    desc: 'Menu, orders and delivery status',
    recommended: true,
    gradient: 'from-orange-500/40 to-red-500/25',
    border: 'border-orange-200/60',
    prompt: "Build a polished restaurant app with a menu split into categories (mains, sides, drinks, desserts), each dish with an emoji, name, price and short description. Ability to add to an order, an order summary screen with a total, and a delivery status screen. Warm design with orange and red colors",
  },
  {
    id: 'fitness',
    emoji: '💪',
    name: 'Fitness App',
    desc: 'Workouts, progress tracking and timer',
    gradient: 'from-red-500/40 to-pink-500/25',
    border: 'border-red-200/60',
    prompt: "Build a fitness app with a list of workouts (strength, cardio, yoga, HIIT), each workout with exercises, sets and reps. A workout timer with a stopwatch, a progress tracking screen with a weekly chart (bars), and a profile screen with statistics. Energetic design with red and pink colors",
  },
  {
    id: 'tasks',
    emoji: '✅',
    name: 'Task Manager',
    desc: 'Tasks, categories and progress bar',
    recommended: true,
    gradient: 'from-emerald-500/40 to-green-500/25',
    border: 'border-emerald-200/60',
    prompt: "Build a task management app with adding new tasks, marking complete, deleting, filtering (all/active/completed), a visual progress bar with percentages, and colorful categories (work, personal, shopping). Clean design in green",
  },
  {
    id: 'finance',
    emoji: '💰',
    name: 'Budget Tracker',
    desc: 'Expenses, income and charts',
    gradient: 'from-emerald-500/40 to-teal-500/25',
    border: 'border-teal-200/60',
    prompt: "Build a personal budget tracking app with a main screen showing the balance, income and expenses for the month. Ability to add an expense/income with a category (food, transport, entertainment, bills), a transaction history, and a summary screen broken down by category. Financial design in green-blue",
  },
  {
    id: 'social',
    emoji: '💬',
    name: 'Social Network',
    desc: 'Feed, profile and likes',
    gradient: 'from-blue-500/40 to-cyan-500/25',
    border: 'border-blue-200/60',
    prompt: "Build a social network app with a post feed (cards with avatar, name, content, likes and comments), a profile screen with a photo, statistics and posts, a messages screen, and a button to create a new post. Modern design in blue",
  },
  {
    id: 'weather',
    emoji: '🌤️',
    name: 'Weather',
    desc: 'Forecast, temperature and map',
    gradient: 'from-sky-500/40 to-blue-500/25',
    border: 'border-sky-200/60',
    prompt: "Build a weather app with a main screen showing a large current temperature, the weather condition with an emoji, an hourly forecast (horizontal scroll), a weekly forecast (7 days), and additional details (humidity, wind, UV). Clean design with a blue-purple gradient",
  },
  {
    id: 'learning',
    emoji: '📚',
    name: 'Learning Platform',
    desc: 'Courses, lessons and progress',
    gradient: 'from-indigo-500/40 to-violet-500/25',
    border: 'border-indigo-200/60',
    prompt: "Build a learning app with a course catalog (6 courses with emoji, name, instructor, number of lessons), a course screen with a lesson list and completion marking, a progress bar, and a profile screen with learning statistics. Academic design in indigo",
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
  const [themes, setThemes] = useState<ThemeMeta[]>([]);
  const [selectedTheme, setSelectedTheme] = useState('');
  // Stitch-style build modes: Ideate (explore via clarifying questions),
  // Flash (fast direct build), Thinking (slower, higher-quality build),
  // Redesign (upload screenshot/image to transform).
  const [buildMode, setBuildMode] = useState<'ideate' | 'flash' | 'thinking' | 'redesign'>('flash');
  // Stitch-style platform target: App (mobile-first) or Web (desktop-first)
  const [targetPlatform, setTargetPlatform] = useState<'app' | 'web'>('app');

  useEffect(() => { getThemes().then(setThemes); }, []);

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
      alert('File is too large (max 10MB)');
      return;
    }
    try {
      const { base64, mimeType } = await compressImage(file);
      setImageBase64(base64);
      setImageMimeType(mimeType);
      setImagePreview(`data:${mimeType};base64,${base64}`);
    } catch {
      alert('Failed to load the image');
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
    recognition.lang = 'en-US';
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
    const label = isSketch ? '✏️ [Sketch]' : '📷 [Screenshot]';
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
          content: `Error: ${err instanceof Error ? err.message : 'Something went wrong. Please try again.'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setGenerating(false);
    }
  }

  // Build the conversation history payload from a message list (excludes the
  // prompt currently being sent — the backend appends that itself).
  function buildHistory(msgs: Message[]) {
    return msgs
      .filter((m) => !m.isLoading && !m.questions)
      .map((m) => ({
        role: m.role,
        content:
          m.role === 'assistant' && m.result
            ? `${m.result.hebrewSummary}\n\nCurrent code:\n\`\`\`jsx\n${
                m.result.files?.['App.jsx'] ?? m.result.files?.['App.tsx'] ?? ''
              }\n\`\`\``
            : m.content,
      }));
  }

  // Core build step — shows the animated loading bubble, calls the generator,
  // and replaces the bubble with the result. Does NOT add the user message
  // (callers handle that, so it works for both fresh builds and answered plans).
  async function runBuild(
    buildPrompt: string,
    ctx: {
      isEditMode: boolean;
      existingCode?: string;
      history: { role: 'user' | 'assistant'; content: string }[];
      ideate?: boolean;
    }
  ) {
    const loadingMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, loadingMsg]);
    setGenerating(true);

    const loadingId = loadingMsg.id;
    // Advance the agent log using each step's own duration (chained timeouts) so
    // it progresses across the whole generation instead of stalling on step 1.
    // We hold on the final step until the real result arrives.
    const stepTimers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;
    for (let i = 1; i < LOADING_STEPS.length; i++) {
      elapsed += LOADING_STEPS[i - 1].duration;
      stepTimers.push(
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) => (m.id === loadingId ? { ...m, loadingStep: i } : m))
          );
        }, elapsed)
      );
    }
    const clearStepTimers = () => stepTimers.forEach(clearTimeout);

    try {
      const result = await generateApp({
        projectId,
        prompt: buildPrompt,
        conversationHistory: ctx.history,
        editMode: ctx.isEditMode,
        existingCode: ctx.existingCode,
        theme: ctx.isEditMode ? undefined : (selectedTheme || undefined),
        ideate: ctx.ideate,
      });
      const demoWarning = result.demoMode
        ? '\n\n⚠️ Demo Mode — AI providers are not connected. This is a pre-built template, not a custom app. Configure a valid GROQ_API_KEY in the backend to enable real AI generation.'
        : '';
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.hebrewSummary + demoWarning,
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
          content: `Error: ${err instanceof Error ? err.message : 'Something went wrong. Please try again.'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      clearStepTimers();
      setGenerating(false);
    }
  }

  // Pick an answer for a clarifying question (single-select per question).
  function selectAnswer(msgId: string, qId: string, option: string) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, answers: { ...(m.answers || {}), [qId]: option } } : m
      )
    );
  }

  // User finished answering (or skipped) — enrich the prompt and build.
  function submitAnswers(msg: Message, skip = false) {
    if (isGenerating) return;
    const answers = msg.answers || {};
    const parts = skip
      ? []
      : (msg.questions || [])
          .map((q) => (answers[q.id] ? `- ${q.q.replace(/\?$/, '')}: ${answers[q.id]}` : null))
          .filter(Boolean);
    const enriched =
      parts.length > 0 ? `${msg.pendingPrompt}\n\nPreferences:\n${parts.join('\n')}` : msg.pendingPrompt!;

    // Lock the question card so it can't be re-submitted.
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, planLocked: true } : m)));

    runBuild(enriched, {
      isEditMode: false,
      existingCode: undefined,
      history: msg.planHistory || [],
      ideate: true, // reached only via the Ideate flow (clarifying questions)
    });
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

    // Snapshot history + edit-mode state BEFORE adding the new user message.
    const history = buildHistory(messages);
    const lastResult = [...messages].reverse().find((m) => m.result)?.result ?? currentAppResult;
    const isEditMode = !!lastResult;
    const existingCode = lastResult
      ? (lastResult.files?.['App.jsx'] ?? lastResult.files?.['App.tsx'] ?? '')
      : undefined;

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';

    // Platform targeting — prepend a context hint so the AI generates the right layout.
    const platformHint = targetPlatform === 'web'
      ? '[Target: responsive desktop web page — full-width layout, sidebar navigation, large typography, desktop-optimized spacing.]'
      : '[Target: mobile app — single-column layout, bottom navigation, touch-friendly sizing, compact spacing.]';

    // Thinking mode → append a quality directive so the model invests more in
    // layout, polish and depth (Stitch "Thinking"/Gemini-Pro equivalent).
    const effectivePrompt = (!isEditMode && buildMode === 'thinking')
      ? `${prompt}\n\n${platformHint}\n\n[Build at the highest quality: refined layout, careful spacing, real depth and polish — a flagship, $100M-product result.]`
      : (!isEditMode ? `${prompt}\n\n${platformHint}` : prompt);

    // EDIT mode → build directly, no planning questions.
    if (isEditMode) {
      await runBuild(prompt, { isEditMode: true, existingCode, history });
      return;
    }

    // Flash / Thinking → build straight away, skip the clarifying-questions step.
    if (buildMode !== 'ideate') {
      await runBuild(effectivePrompt, { isEditMode: false, existingCode: undefined, history });
      return;
    }

    // Ideate → Chat-Mode planning phase. Ask a few quick questions if it
    // would improve the result, otherwise build straight away.
    setGenerating(true);
    const planMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      isLoading: true,
      isPlanning: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, planMsg]);

    let plan: PlanResult = { ready: true };
    try {
      plan = await planApp(prompt, history);
    } catch {
      plan = { ready: true };
    }

    if (!plan.ready && plan.questions && plan.questions.length > 0) {
      const questionsMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: plan.intro || 'A few quick questions before we build:',
        questions: plan.questions,
        answers: {},
        pendingPrompt: prompt,
        planHistory: history,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev.slice(0, -1), questionsMsg]); // replace planning bubble
      setGenerating(false);
      return;
    }

    // Ready → drop the planning bubble and build. Ideate mode runs the
    // blueprint phase so the app is generated against an explicit screen +
    // navigation contract (Stitch's two-phase model).
    setMessages((prev) => prev.slice(0, -1));
    setGenerating(false);
    await runBuild(prompt, { isEditMode: false, existingCode: undefined, history, ideate: true });
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
      desc: 'Upload a screenshot of any app — AI will recreate it',
      action: () => fileInputRef.current?.click(),
      color: 'from-sky-400/15 to-sky-400/5 border-sky-200',
      iconBg: 'bg-sky-400/20 text-sky-500',
    },
    {
      icon: '✏️',
      title: 'Sketch → App',
      desc: 'Draw a wireframe and AI will turn it into a full app',
      action: () => setShowSketch(true),
      color: 'from-violet-400/15 to-violet-400/5 border-violet-200',
      iconBg: 'bg-violet-400/20 text-violet-500',
    },
    {
      icon: '🎤',
      title: 'Voice → App',
      desc: 'Just speak — AI will understand and build',
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
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-6 px-2">
              {/* Header — clean and minimal */}
              <div className="animate-fade-in-up">
                <h2 className="font-display font-bold text-lg text-text-primary mb-1">What should we build?</h2>
                <p className="text-text-secondary text-sm">Describe your app, pick a template, or upload a screenshot</p>
              </div>

              {/* Template Gallery — Lovable-style cards */}
              <div className="w-full max-w-sm">
                <p className="text-text-secondary text-xs font-medium mb-2 text-left">Start from a ready-made template</p>
                <div className="grid grid-cols-2 gap-2">
                  {[...TEMPLATES]
                    .sort((a, b) => Number(Boolean((b as { recommended?: boolean }).recommended)) - Number(Boolean((a as { recommended?: boolean }).recommended)))
                    .map((t) => {
                    const isRecommended = Boolean((t as { recommended?: boolean }).recommended);
                    return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setInput(t.prompt);
                        setTimeout(() => handleSubmit(t.prompt), 50);
                      }}
                      disabled={isGenerating}
                      className={`group relative flex items-center gap-2.5 p-3 rounded-xl border bg-surface/40 text-left transition-all hover:bg-surface/80 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-40 ${isRecommended ? 'border-primary/40' : 'border-border/50 hover:border-primary/40'}`}
                    >
                      {isRecommended && (
                        <span className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[8px] font-bold shadow-sm" title="Recommended">
                          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 7.1-1.01L12 2z" /></svg>
                        </span>
                      )}
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${t.gradient} ring-1 ring-white/10 flex items-center justify-center flex-shrink-0 text-lg shadow-sm transition-transform group-hover:scale-110`}>
                        {t.emoji}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-text-primary text-[13px] truncate">{t.name}</p>
                        <p className="text-text-secondary text-[11px] truncate">{t.desc}</p>
                      </div>
                    </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 w-full max-w-sm">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-text-secondary text-[11px]">or use</span>
                <div className="flex-1 h-px bg-border/50" />
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
                {msg.isLoading && msg.isPlanning ? (
                  <div className="px-4 py-3 rounded-2xl glass-card" dir="ltr">
                    <div className="flex items-center gap-2">
                      <span className="text-sm animate-pulse">💭</span>
                      <span className="text-xs text-text-primary font-medium">Thinking about what to ask…</span>
                      <div className="flex gap-0.5 mr-auto">
                        {[0, 1, 2].map((d) => (
                          <div key={d} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : msg.isLoading ? (
                  <div className="px-4 py-3 rounded-2xl glass-card" dir="ltr">
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
                ) : msg.questions ? (
                  <div className="px-4 py-3 rounded-2xl bg-surface/60 border border-border/30 text-text-primary rounded-tl-sm" dir="ltr">
                    <p className="text-sm leading-relaxed mb-3">{msg.content}</p>
                    <div className="space-y-3">
                      {msg.questions.map((q) => (
                        <div key={q.id}>
                          <p className="text-[12px] font-semibold text-text-primary mb-1.5">{q.q}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {q.options.map((opt) => {
                              const selected = msg.answers?.[q.id] === opt;
                              return (
                                <button
                                  key={opt}
                                  onClick={() => !msg.planLocked && selectAnswer(msg.id, q.id, opt)}
                                  disabled={msg.planLocked}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all min-h-[32px] disabled:opacity-60 ${
                                    selected
                                      ? 'bg-primary text-white border-primary'
                                      : 'bg-surface border-border text-text-primary hover:border-primary/40 hover:bg-primary/5'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    {msg.planLocked ? (
                      <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5 text-[11px] text-green-400">
                        <span>✓</span>
                        <span>Building with your preferences…</span>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-border/50 flex gap-2">
                        <button
                          onClick={() => submitAnswers(msg)}
                          disabled={isGenerating}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 min-h-[36px]"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Build now
                        </button>
                        <button
                          onClick={() => submitAnswers(msg, true)}
                          disabled={isGenerating}
                          className="px-3 py-2 rounded-xl bg-surface border border-border text-text-secondary text-xs font-medium hover:text-text-primary hover:border-primary/30 transition-all disabled:opacity-40 min-h-[36px]"
                        >
                          Skip & build
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-sm'
                        : 'bg-surface/60 border border-border/30 text-text-primary rounded-tl-sm'
                    }`}
                    dir="ltr"
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
                          <span className="text-[10px] text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full mr-auto">Ready ✓</span>
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
                              View result
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
                              Code
                            </button>
                          )}
                        </div>

                        {/* Quick action chips — contextual suggestions */}
                        {msg.id === [...messages].reverse().find((m) => m.result)?.id && (
                          <div className="space-y-1.5">
                            <p className="text-[11px] text-text-secondary font-medium">⚡ Quick improvements:</p>
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
                  {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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
                AI will recreate this interface
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
              <span className="text-green-400 text-xs font-medium">Listening… speak now</span>
              <button onClick={toggleVoice} className="mr-auto text-xs text-green-400 hover:text-green-300">
                Stop
              </button>
            </div>
          )}

          {/* Edit mode indicator */}
          {(messages.some((m) => m.result) || currentAppResult) && !isGenerating && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/15">
              <span className="text-primary text-xs">✏️</span>
              <span className="text-primary/80 text-[11px] font-medium">Describe what to change — or tap a quick improvement above</span>
            </div>
          )}

          {/* Stitch-style controls — only on first build (not edits) */}
          {!(messages.some((m) => m.result) || currentAppResult) && (
            <div className="flex items-center gap-2 mb-2" dir="ltr">
              {/* Platform target: App vs Web */}
              <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-surface/50 border border-border/40">
                {([
                  { id: 'app', label: 'App', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
                  { id: 'web', label: 'Web', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9' },
                ] as const).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setTargetPlatform(p.id)}
                    disabled={isGenerating}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all disabled:opacity-40 ${
                      targetPlatform === p.id
                        ? 'bg-primary/15 text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={p.icon} />
                    </svg>
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-border/30" />

              {/* Build mode selector */}
              {([
                { id: 'ideate',   label: 'Ideate',   hint: 'Explore ideas — asks questions first', icon: 'M12 2a7 7 0 00-7 7c0 2.4 1.2 4 2.5 5.2.5.5.5 1 .5 1.8h8c0-.8 0-1.3.5-1.8C17.8 13 19 11.4 19 9a7 7 0 00-7-7z M9 21h6 M10 18h4' },
                { id: 'flash',    label: 'Flash',    hint: 'Fast generation — build straight away', icon: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z' },
                { id: 'thinking', label: 'Thinking', hint: 'Highest quality — refined layout and polish', icon: 'M12 3a9 9 0 100 18 9 9 0 000-18z M12 8v4l3 2' },
                { id: 'redesign', label: 'Redesign', hint: 'Upload a screenshot to redesign', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
              ] as const).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setBuildMode(m.id);
                    if (m.id === 'redesign') fileInputRef.current?.click();
                  }}
                  title={m.hint}
                  disabled={isGenerating}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[11px] font-medium border transition-all disabled:opacity-40 ${
                    buildMode === m.id
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border/40'
                  }`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={m.icon} />
                  </svg>
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {/* Main input — full-width textarea, actions below */}
          <div className="flex flex-col gap-2 p-3 rounded-2xl bg-surface/60 border border-border/50 focus-within:border-primary/50 focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.2)] transition-all">
            {/* Textarea — full width, roomy */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); adjustTextareaHeight(); }}
              onKeyDown={handleKeyDown}
              placeholder={imagePreview ? 'Add extra instructions (optional)…' : (messages.some((m) => m.result) || currentAppResult) ? 'e.g. "Change the color to pink" or "Add a settings screen"…' : 'Describe the app you want to build…'}
              rows={3}
              dir="ltr"
              disabled={isGenerating}
              className="w-full bg-transparent text-text-primary placeholder-text-secondary text-sm resize-none outline-none min-h-[72px] max-h-[280px] leading-relaxed disabled:opacity-50"
            />
            {/* Action row */}
            <div className="flex items-center gap-1">
              {/* Viral feature buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
              {/* Screenshot */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
                title="Upload a screenshot"
                aria-label="Upload image"
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
                title="Draw a sketch"
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
                  title={isListening ? 'Stop recording' : 'Voice input'}
                  aria-label={isListening ? 'Stop voice recording' : 'Start voice input'}
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

            <div className="flex-1" />

            {/* Send */}
            <button
              onClick={() => handleSubmit()}
              disabled={(!input.trim() && !imageBase64) || isGenerating}
              aria-label="Send message"
              className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:cursor-not-allowed ${
                (input.trim() || imageBase64) && !isGenerating
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 active:scale-95'
                  : 'bg-surface-2 text-text-secondary opacity-30'
              }`}
            >
              {isGenerating ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12l7-7 7 7M12 5v14" />
                </svg>
              )}
            </button>
            </div>
          </div>

          <p className="text-text-secondary text-[10px] mt-1.5 text-center opacity-60">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}
