'use client';

import { useState, useRef, useEffect } from 'react';
import { streamAssistantMessage } from '@/lib/api';
import type { ProjectContext } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

interface ForgeAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  projectContext: ProjectContext;
  onNewMessage?: () => void;
}

const SUGGESTION_CHIPS = [
  'Improve the main screen design',
  'What features do you recommend?',
  'Explain the generated code',
  "There's an error — help me",
];

export default function ForgeAssistant({
  isOpen,
  onClose,
  projectContext,
  onNewMessage,
}: ForgeAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 310);
    }
  }, [isOpen]);

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming) return;
    setInput('');

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }]);
    setIsStreaming(true);

    await streamAssistantMessage(
      text,
      projectContext,
      history,
      (chunk) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + chunk };
          }
          return updated;
        });
      },
      () => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = { ...last, streaming: false };
          }
          return updated;
        });
        setIsStreaming(false);
        if (!isOpenRef.current) onNewMessage?.();
      },
      (err) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = {
              ...last,
              content: 'Error communicating with Forge AI. Please try again.',
              streaming: false,
            };
          }
          return updated;
        });
        setIsStreaming(false);
        console.error('Forge AI error:', err);
      }
    );
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-indigo-950/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sliding panel */}
      <div
        className={`fixed inset-y-0 left-0 w-full sm:w-[380px] glass-panel border-r border-border/50 z-50 flex flex-col transform transition-transform duration-300 ease-in-out shadow-2xl shadow-black/20 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        dir="ltr"
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-base flex-shrink-0">
              ✨
            </div>
            <div>
              <div className="font-display font-semibold text-sm leading-tight">Forge AI</div>
              <div className="text-[11px] text-text-secondary leading-tight">Design & development assistant</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-2 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="space-y-4 pt-2">
              <div className="text-center py-4">
                <div className="text-3xl mb-2">✨</div>
                <h3 className="font-display font-semibold text-sm mb-1">Ask me anything</h3>
                <p className="text-[11px] text-text-secondary leading-relaxed px-2">
                  Design · Features · Code explanations · Debugging
                </p>
              </div>
              <div className="space-y-2">
                {SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => sendMessage(chip)}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-surface-2 border border-border hover:border-primary/40 hover:bg-surface-2/80 text-xs text-text-secondary hover:text-text-primary transition-all"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                    ✨
                  </div>
                )}
                <div
                  className={`max-w-[84%] px-3 py-2.5 rounded-2xl text-[12px] leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-surface-2 border border-border text-text-primary rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                  {msg.streaming && (
                    <span className="inline-block w-1 h-3 bg-accent mx-0.5 animate-pulse rounded-sm align-middle" />
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 p-3 border-t border-border">
          <div className="flex items-end gap-2 px-3 py-2 rounded-xl bg-surface-2 border border-border focus-within:border-primary/50 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask about design, features, code…"
              rows={1}
              className="flex-1 bg-transparent text-xs text-text-primary placeholder-text-secondary resize-none outline-none leading-relaxed"
              style={{ maxHeight: '96px', overflowY: 'auto' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 mb-0.5"
              aria-label="Send"
            >
              {isStreaming ? (
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-[10px] text-text-secondary text-center mt-2 opacity-60">
            Enter to send · Shift+Enter for a new line
          </p>
        </div>
      </div>
    </>
  );
}
