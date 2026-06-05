'use client';

import { useState, useRef, useEffect } from 'react';
import { generateApp, type GenerateResponse } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  result?: GenerateResponse;
  isLoading?: boolean;
  timestamp: Date;
}

interface ChatInterfaceProps {
  projectId?: string;
  initialMessages?: Message[];
  onAppGenerated?: (result: GenerateResponse) => void;
  onShowPreview?: (result: GenerateResponse) => void;
  onShowCode?: (result: GenerateResponse) => void;
}

const SUGGESTIONS = [
  'אפליקציית רשימת קניות עם קטגוריות וסמן פריטים',
  'אפליקציית מזג אוויר עם ממשק יפה',
  'אפליקציית טיימר פואנדרי עם אנימציות',
  'אפליקציית מדיטציה עם נשימה מודרכת',
  'Todo app with swipe gestures and categories',
];

export default function ChatInterface({
  projectId,
  initialMessages = [],
  onAppGenerated,
  onShowPreview,
  onShowCode,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function adjustTextareaHeight() {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }

  async function handleSubmit() {
    const prompt = input.trim();
    if (!prompt || isGenerating) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
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
    setIsGenerating(true);
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const history = messages.map((m) => ({
      role: m.role,
      content: m.role === 'assistant' && m.result ? m.result.hebrewSummary : m.content,
    }));

    try {
      const result = await generateApp({
        projectId,
        prompt,
        conversationHistory: history,
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
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `שגיאה: ${err instanceof Error ? err.message : 'משהו השתבש. נסה שוב.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev.slice(0, -1), errMsg]);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <span className="text-white font-display font-bold text-2xl">M</span>
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-text-primary mb-2">
                ברוך הבא ל-MobileForge
              </h2>
              <p className="text-text-secondary text-sm max-w-xs">
                תאר את האפליקציה שאתה רוצה ואני אבנה אותה עבורך בקוד Expo מלא
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="px-4 py-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 text-right text-sm transition-all"
                  dir="rtl"
                >
                  {s}
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
                <div className="px-4 py-3 rounded-2xl bg-surface border border-border">
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
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-surface border border-border text-text-primary rounded-tl-sm'
                  }`}
                  dir="rtl"
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                  {/* Assistant result actions */}
                  {msg.result && (
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                      {/* App info */}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded flex-shrink-0"
                          style={{ background: msg.result.colorScheme?.primary || '#6C3AE8' }}
                        />
                        <span className="font-display font-semibold text-sm">
                          {msg.result.appName}
                        </span>
                      </div>

                      {/* Features */}
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

                      {/* Action buttons */}
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

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-end gap-3 p-3 rounded-2xl bg-surface border border-border focus-within:border-primary/50 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); adjustTextareaHeight(); }}
            onKeyDown={handleKeyDown}
            placeholder="תאר את האפליקציה שאתה רוצה…"
            rows={1}
            dir="rtl"
            disabled={isGenerating}
            className="flex-1 bg-transparent text-text-primary placeholder-text-secondary text-sm resize-none outline-none max-h-[200px] leading-relaxed disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isGenerating}
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
          Enter לשליחה · Shift+Enter לשורה חדשה
        </p>
      </div>
    </div>
  );
}
