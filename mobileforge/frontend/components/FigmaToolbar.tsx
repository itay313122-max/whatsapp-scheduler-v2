'use client';

import { useState, useRef, useEffect } from 'react';
import type { SelectedElement } from './PropertyPanel';

interface FigmaToolbarProps {
  element: SelectedElement;
  onStyleChange: (path: string, property: string, value: string) => void;
  onTextChange: (path: string, text: string) => void;
  onDeselect: () => void;
}

const SHAPE_PRESETS = [
  { id: 'square', label: 'מרובע', icon: '▢', radius: '0px' },
  { id: 'rounded', label: 'מעוגל', icon: '▢', radius: '12px' },
  { id: 'pill', label: 'כמוסה', icon: '⬭', radius: '9999px' },
  { id: 'circle', label: 'עיגול', icon: '○', radius: '50%' },
];

const QUICK_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6366f1', '#14b8a6', '#f59e0b', '#64748b', 'transparent',
];

const QUICK_SIZES = [
  { label: '11', value: '11px' },
  { label: '12', value: '12px' },
  { label: '14', value: '14px' },
  { label: '16', value: '16px' },
  { label: '20', value: '20px' },
  { label: '24', value: '24px' },
  { label: '28', value: '28px' },
  { label: '32', value: '32px' },
  { label: '40', value: '40px' },
];

type ActivePopover = null | 'text' | 'color' | 'bgColor' | 'size' | 'shape' | 'shadow' | 'spacing';

function rgbToHex(rgb: string): string {
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return '#000000';
  return '#' + [m[1], m[2], m[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

function ColorDot({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  const isTransparent = color === 'transparent';
  return (
    <button
      onClick={onClick}
      className={`w-6 h-6 rounded-md border-2 transition-all hover:scale-110 ${
        active ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-border/60'
      }`}
      style={isTransparent ? {
        background: 'repeating-conic-gradient(#ddd 0% 25%, transparent 0% 50%) 50% / 8px 8px',
      } : { background: color }}
    />
  );
}

export default function FigmaToolbar({ element, onStyleChange, onTextChange, onDeselect }: FigmaToolbarProps) {
  const [popover, setPopover] = useState<ActivePopover>(null);
  const [editText, setEditText] = useState(element.text);
  const [customColor, setCustomColor] = useState(rgbToHex(element.styles.color));
  const [customBgColor, setCustomBgColor] = useState(rgbToHex(element.styles.backgroundColor));
  const toolbarRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditText(element.text);
    setCustomColor(rgbToHex(element.styles.color));
    setCustomBgColor(rgbToHex(element.styles.backgroundColor));
  }, [element]);

  useEffect(() => {
    if (popover === 'text' && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [popover]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setPopover(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isTextEl = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'label', 'button', 'a', 'li'].includes(element.tag);

  const togglePopover = (p: ActivePopover) => setPopover(prev => prev === p ? null : p);

  const currentRadius = element.styles.borderRadius;
  const activeShape = SHAPE_PRESETS.find(s => s.radius === currentRadius) || null;

  return (
    <div ref={toolbarRef} className="flex flex-col items-center gap-1.5 animate-fade-in-up" dir="rtl">
      {/* Main toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-[#1A1A1E]/95 border border-[#2A2A2E] rounded-2xl shadow-2xl shadow-black/30 backdrop-blur-xl">
        {/* Element tag */}
        <span className="text-[10px] text-text-soft font-mono px-2 py-0.5 bg-white/5 rounded-lg select-none">
          {element.tag}
        </span>

        <div className="h-5 w-px bg-border/60 mx-0.5" />

        {/* Text edit */}
        {isTextEl && element.text && (
          <button
            onClick={() => togglePopover('text')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              popover === 'text' ? 'bg-primary/15 text-primary' : 'text-text-primary hover:bg-white/10'
            }`}
            title="ערוך טקסט"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}

        {/* Text color */}
        {isTextEl && (
          <button
            onClick={() => togglePopover('color')}
            className={`flex items-center gap-1 px-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              popover === 'color' ? 'bg-primary/15 text-primary' : 'text-text-primary hover:bg-white/10'
            }`}
            title="צבע טקסט"
          >
            <span className="text-sm font-bold" style={{ color: rgbToHex(element.styles.color) }}>A</span>
            <div className="w-4 h-1 rounded-full" style={{ background: rgbToHex(element.styles.color) }} />
          </button>
        )}

        {/* Background color */}
        <button
          onClick={() => togglePopover('bgColor')}
          className={`flex items-center gap-1 px-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
            popover === 'bgColor' ? 'bg-primary/15 text-primary' : 'text-text-primary hover:bg-white/10'
          }`}
          title="צבע רקע"
        >
          <div className="w-5 h-5 rounded-md border border-border/80" style={{
            background: element.styles.backgroundColor === 'transparent' || !element.styles.backgroundColor
              ? 'repeating-conic-gradient(#ddd 0% 25%, transparent 0% 50%) 50% / 8px 8px'
              : rgbToHex(element.styles.backgroundColor)
          }} />
        </button>

        <div className="h-5 w-px bg-border/60 mx-0.5" />

        {/* Font size */}
        {isTextEl && (
          <button
            onClick={() => togglePopover('size')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              popover === 'size' ? 'bg-primary/15 text-primary' : 'text-text-primary hover:bg-white/10'
            }`}
            title="גודל טקסט"
          >
            <span className="font-mono text-[10px]">{parseInt(element.styles.fontSize) || 14}</span>
            <svg className="w-2.5 h-2.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {/* Shape presets */}
        <button
          onClick={() => togglePopover('shape')}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
            popover === 'shape' ? 'bg-primary/15 text-primary' : 'text-text-primary hover:bg-white/10'
          }`}
          title="צורה ופינות"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx={parseInt(currentRadius) > 100 ? 9 : Math.min(parseInt(currentRadius) || 0, 8)} strokeWidth={2} />
          </svg>
        </button>

        {/* Spacing */}
        <button
          onClick={() => togglePopover('spacing')}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
            popover === 'spacing' ? 'bg-primary/15 text-primary' : 'text-text-primary hover:bg-white/10'
          }`}
          title="מרווח ומימדים"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>

        {/* Shadow */}
        <button
          onClick={() => togglePopover('shadow')}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
            popover === 'shadow' ? 'bg-primary/15 text-primary' : 'text-text-primary hover:bg-white/10'
          }`}
          title="צל"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" strokeWidth={2} />
            <rect x="7" y="7" width="14" height="14" rx="3" fill="currentColor" opacity="0.15" />
          </svg>
        </button>

        <div className="h-5 w-px bg-border/60 mx-0.5" />

        {/* Close */}
        <button
          onClick={onDeselect}
          className="flex items-center px-1.5 py-1.5 rounded-lg text-text-soft hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="בטל בחירה"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Popovers */}
      {popover && (
        <div className="bg-[#1A1A1E]/95 border border-[#2A2A2E] rounded-2xl shadow-2xl shadow-black/30 backdrop-blur-xl overflow-hidden animate-fade-in-up">
          {/* Text edit popover */}
          {popover === 'text' && (
            <div className="p-3 w-[280px]">
              <textarea
                ref={textInputRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onTextChange(element.path, editText);
                    setPopover(null);
                  }
                  if (e.key === 'Escape') setPopover(null);
                }}
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none"
                placeholder="הקלד טקסט..."
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-text-soft">Enter לאישור, Esc לביטול</span>
                <button
                  onClick={() => { onTextChange(element.path, editText); setPopover(null); }}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-primary text-white hover:bg-primary/90 transition-all"
                >
                  עדכן
                </button>
              </div>
            </div>
          )}

          {/* Text color popover */}
          {popover === 'color' && (
            <div className="p-3 w-[220px]">
              <p className="text-[10px] text-text-soft font-medium mb-2">צבע טקסט</p>
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {QUICK_COLORS.filter(c => c !== 'transparent').map((color) => (
                  <ColorDot
                    key={color}
                    color={color}
                    active={rgbToHex(element.styles.color) === color}
                    onClick={() => {
                      onStyleChange(element.path, 'color', color);
                      setCustomColor(color);
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    onStyleChange(element.path, 'color', e.target.value);
                  }}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-border"
                />
                <span className="text-[10px] text-text-soft font-mono">{customColor}</span>
              </div>
            </div>
          )}

          {/* Background color popover */}
          {popover === 'bgColor' && (
            <div className="p-3 w-[220px]">
              <p className="text-[10px] text-text-soft font-medium mb-2">צבע רקע</p>
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {QUICK_COLORS.map((color) => (
                  <ColorDot
                    key={color}
                    color={color}
                    active={color === 'transparent'
                      ? (element.styles.backgroundColor === 'transparent' || !element.styles.backgroundColor)
                      : rgbToHex(element.styles.backgroundColor) === color
                    }
                    onClick={() => {
                      onStyleChange(element.path, 'backgroundColor', color);
                      if (color !== 'transparent') setCustomBgColor(color);
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <input
                  type="color"
                  value={customBgColor}
                  onChange={(e) => {
                    setCustomBgColor(e.target.value);
                    onStyleChange(element.path, 'backgroundColor', e.target.value);
                  }}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-border"
                />
                <span className="text-[10px] text-text-soft font-mono">{customBgColor}</span>
              </div>
            </div>
          )}

          {/* Font size popover */}
          {popover === 'size' && (
            <div className="p-3 w-[200px]">
              <p className="text-[10px] text-text-soft font-medium mb-2">גודל טקסט</p>
              <div className="grid grid-cols-3 gap-1.5">
                {QUICK_SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => {
                      onStyleChange(element.path, 'fontSize', s.value);
                      setPopover(null);
                    }}
                    className={`py-2 px-2 rounded-lg text-[11px] font-medium border transition-all ${
                      element.styles.fontSize === s.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-text-secondary hover:border-primary/30 hover:bg-primary/5'
                    }`}
                  >
                    {s.label}px
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
                <span className="text-[10px] text-text-soft">משקל:</span>
                {[
                  { id: '400', label: 'רגיל' },
                  { id: '600', label: 'בולט' },
                  { id: '800', label: 'כבד' },
                ].map((w) => (
                  <button
                    key={w.id}
                    onClick={() => onStyleChange(element.path, 'fontWeight', w.id)}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                      element.styles.fontWeight === w.id || (w.id === '400' && parseInt(element.styles.fontWeight) < 500)
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-soft hover:text-text-primary hover:bg-surface-2'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Shape popover */}
          {popover === 'shape' && (
            <div className="p-3 w-[240px]">
              <p className="text-[10px] text-text-soft font-medium mb-2">צורה</p>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {SHAPE_PRESETS.map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => {
                      onStyleChange(element.path, 'borderRadius', shape.radius);
                    }}
                    className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border-2 transition-all ${
                      activeShape?.id === shape.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border/60 hover:border-primary/30 hover:bg-primary/5'
                    }`}
                  >
                    <div
                      className="w-8 h-8 bg-primary/20 border-2 border-primary/40"
                      style={{ borderRadius: shape.radius === '50%' ? '50%' : shape.radius }}
                    />
                    <span className="text-[9px] text-text-secondary font-medium">{shape.label}</span>
                  </button>
                ))}
              </div>
              <div>
                <p className="text-[10px] text-text-soft font-medium mb-1.5">עיגול מותאם</p>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={parseInt(currentRadius) > 50 ? 50 : parseInt(currentRadius) || 0}
                    onChange={(e) => onStyleChange(element.path, 'borderRadius', `${e.target.value}px`)}
                    className="flex-1 h-1.5 rounded-full accent-primary"
                  />
                  <span className="text-[10px] text-text-soft font-mono w-10 text-center">
                    {parseInt(currentRadius) || 0}px
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-border/50">
                <p className="text-[10px] text-text-soft font-medium mb-1.5">גבול</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'ללא', value: 'none' },
                    { label: 'דק', value: '1px solid currentColor' },
                    { label: 'עבה', value: '2px solid currentColor' },
                  ].map((b) => (
                    <button
                      key={b.label}
                      onClick={() => onStyleChange(element.path, 'border', b.value)}
                      className="py-1.5 rounded-lg text-[10px] font-medium border border-border text-text-secondary hover:border-primary/30 hover:bg-primary/5 transition-all"
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Shadow popover */}
          {popover === 'shadow' && (
            <div className="p-3 w-[200px]">
              <p className="text-[10px] text-text-soft font-medium mb-2">צל</p>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: 'ללא', value: 'none', preview: '' },
                  { label: 'עדין', value: '0 1px 3px rgba(0,0,0,0.1)', preview: 'shadow-sm' },
                  { label: 'בינוני', value: '0 4px 6px rgba(0,0,0,0.1)', preview: 'shadow-md' },
                  { label: 'חזק', value: '0 8px 25px rgba(0,0,0,0.15)', preview: 'shadow-lg' },
                  { label: 'זוהר', value: '0 0 20px rgba(99,102,241,0.4)', preview: 'shadow-glow' },
                  { label: 'Glass', value: '0 8px 32px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.1)', preview: '' },
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() => {
                      onStyleChange(element.path, 'boxShadow', s.value);
                      setPopover(null);
                    }}
                    className="flex items-center gap-2.5 py-2 px-3 rounded-lg text-[11px] font-medium text-text-secondary hover:bg-primary/5 hover:text-primary transition-all text-right"
                  >
                    <div
                      className="w-6 h-6 rounded-md bg-white border border-border/40 flex-shrink-0"
                      style={{ boxShadow: s.value !== 'none' ? s.value : undefined }}
                    />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Spacing popover */}
          {popover === 'spacing' && (
            <div className="p-3 w-[240px]">
              <p className="text-[10px] text-text-soft font-medium mb-2">ריווח פנימי (Padding)</p>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {['0', '4', '8', '12', '16', '20', '24', '32'].map((p) => (
                  <button
                    key={p}
                    onClick={() => onStyleChange(element.path, 'padding', `${p}px`)}
                    className={`py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                      parseInt(element.styles.padding) === parseInt(p)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-text-secondary hover:border-primary/30'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-text-soft font-medium mb-2">רוחב</p>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {[
                  { label: 'אוטו', value: 'auto' },
                  { label: '50%', value: '50%' },
                  { label: '100%', value: '100%' },
                ].map((w) => (
                  <button
                    key={w.value}
                    onClick={() => onStyleChange(element.path, 'width', w.value)}
                    className="py-1.5 rounded-lg text-[10px] font-medium border border-border text-text-secondary hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    {w.label}
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-text-soft font-medium mb-2">שקיפות</p>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(parseFloat(element.styles.opacity || '1') * 100)}
                  onChange={(e) => onStyleChange(element.path, 'opacity', String(parseInt(e.target.value) / 100))}
                  className="flex-1 h-1.5 rounded-full accent-primary"
                />
                <span className="text-[10px] text-text-soft font-mono w-10 text-center">
                  {Math.round(parseFloat(element.styles.opacity || '1') * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
