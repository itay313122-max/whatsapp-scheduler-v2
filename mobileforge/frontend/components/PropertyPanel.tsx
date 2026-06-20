'use client';

import { useState, useEffect } from 'react';

export interface SelectedElement {
  tag: string;
  text: string;
  styles: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    padding: string;
    fontWeight: string;
    borderRadius: string;
  };
  path: string;
}

interface PropertyPanelProps {
  element: SelectedElement;
  onStyleChange: (path: string, property: string, value: string) => void;
  onTextChange: (path: string, text: string) => void;
  onDeselect: () => void;
}

function rgbToHex(rgb: string): string {
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return '#000000';
  return '#' + [m[1], m[2], m[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];

export default function PropertyPanel({ element, onStyleChange, onTextChange, onDeselect }: PropertyPanelProps) {
  const [text, setText] = useState(element.text);
  const [fontSize, setFontSize] = useState(element.styles.fontSize);

  useEffect(() => {
    setText(element.text);
    setFontSize(element.styles.fontSize);
  }, [element]);

  const isTextEl = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'label', 'button', 'a', 'li'].includes(element.tag);

  return (
    <div className="flex flex-col gap-3 p-3" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono font-bold uppercase">
            {element.tag}
          </div>
          <span className="text-xs text-text-secondary">עריכת רכיב</span>
        </div>
        <button
          onClick={onDeselect}
          className="p-1 rounded hover:bg-surface-2 text-text-soft hover:text-text-primary transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Text */}
      {isTextEl && (
        <div>
          <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">טקסט</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => onTextChange(element.path, text)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-text-primary text-xs focus:outline-none focus:border-primary resize-none"
          />
        </div>
      )}

      {/* Font Size */}
      {isTextEl && (
        <div>
          <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">גודל טקסט</label>
          <div className="flex flex-wrap gap-1">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => {
                  setFontSize(size);
                  onStyleChange(element.path, 'fontSize', size);
                }}
                className={`px-2 py-1 rounded text-[10px] border transition-all ${
                  fontSize === size
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {parseInt(size)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text Color */}
      <div>
        <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">צבע טקסט</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            defaultValue={rgbToHex(element.styles.color)}
            onChange={(e) => onStyleChange(element.path, 'color', e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border border-border"
          />
          <span className="text-[10px] text-text-soft font-mono">{rgbToHex(element.styles.color)}</span>
        </div>
      </div>

      {/* Background Color */}
      <div>
        <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">צבע רקע</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            defaultValue={rgbToHex(element.styles.backgroundColor)}
            onChange={(e) => onStyleChange(element.path, 'backgroundColor', e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border border-border"
          />
          <span className="text-[10px] text-text-soft font-mono">{rgbToHex(element.styles.backgroundColor)}</span>
          <button
            onClick={() => onStyleChange(element.path, 'backgroundColor', 'transparent')}
            className="text-[10px] text-text-soft hover:text-red-400 transition-colors"
          >
            שקוף
          </button>
        </div>
      </div>

      {/* Font Weight */}
      {isTextEl && (
        <div>
          <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">משקל</label>
          <div className="flex gap-1">
            {[
              { id: '400', label: 'רגיל' },
              { id: '600', label: 'בולט' },
              { id: '800', label: 'כבד' },
            ].map((w) => (
              <button
                key={w.id}
                onClick={() => onStyleChange(element.path, 'fontWeight', w.id)}
                className={`flex-1 py-1.5 rounded text-[10px] border transition-all ${
                  element.styles.fontWeight === w.id || (w.id === '400' && parseInt(element.styles.fontWeight) < 500)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Border Radius */}
      <div>
        <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">עיגול פינות</label>
        <div className="flex gap-1">
          {['0px', '8px', '16px', '24px', '9999px'].map((r) => (
            <button
              key={r}
              onClick={() => onStyleChange(element.path, 'borderRadius', r)}
              className={`flex-1 py-1.5 rounded text-[10px] border transition-all ${
                element.styles.borderRadius === r
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {r === '9999px' ? '⬤' : parseInt(r)}
            </button>
          ))}
        </div>
      </div>

      {/* Padding */}
      <div>
        <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">ריווח פנימי</label>
        <div className="flex gap-1">
          {['0px', '4px', '8px', '12px', '16px', '24px'].map((p) => (
            <button
              key={p}
              onClick={() => onStyleChange(element.path, 'padding', p)}
              className="flex-1 py-1.5 rounded text-[10px] border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 transition-all"
            >
              {parseInt(p)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
