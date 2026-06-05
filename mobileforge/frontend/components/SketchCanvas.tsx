'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface SketchCanvasProps {
  onClose: () => void;
  onSubmit: (imageBase64: string, mimeType: string, prompt?: string) => void;
  isGenerating?: boolean;
}

type Tool = 'pen' | 'eraser';

interface Point {
  x: number;
  y: number;
}

const COLORS = [
  { value: '#FFFFFF', label: 'לבן' },
  { value: '#94A3B8', label: 'אפור' },
  { value: '#6C3AE8', label: 'סגול' },
  { value: '#00F5A0', label: 'ירוק' },
  { value: '#F87171', label: 'אדום' },
  { value: '#60A5FA', label: 'כחול' },
];

const SIZES = [
  { value: 2, label: 'דק' },
  { value: 5, label: 'בינוני' },
  { value: 12, label: 'עבה' },
];

const CANVAS_W = 390;
const CANVAS_H = 700;

export default function SketchCanvas({ onClose, onSubmit, isGenerating = false }: SketchCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hint, setHint] = useState('');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPoint = useRef<Point | null>(null);
  const scale = useRef(1);

  // Init canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // Dark background matching app theme
    ctx.fillStyle = '#13131A';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw phone outline hint
    ctx.strokeStyle = '#2A2A3A';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    roundRect(ctx, 20, 20, CANVAS_W - 40, CANVAS_H - 40, 30);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label hint
    ctx.fillStyle = '#3a3a5a';
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('צייר את הממשק שלך כאן', CANVAS_W / 2, CANVAS_H / 2);

    saveSnapshot();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function saveSnapshot() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const data = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    setHistory((prev) => [...prev.slice(-19), data]);
  }

  function getCanvasPoint(e: React.MouseEvent | React.TouchEvent): Point | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
    if (clientX === undefined || clientY === undefined) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((clientY - rect.top) / rect.height) * CANVAS_H,
    };
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const pt = getCanvasPoint(e);
    if (!pt) return;
    setIsDrawing(true);
    setHasDrawn(true);
    lastPoint.current = pt;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, (tool === 'eraser' ? brushSize * 3 : brushSize) / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? '#13131A' : color;
    ctx.fill();
  }

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pt = getCanvasPoint(e);
    if (!pt || !lastPoint.current) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const size = tool === 'eraser' ? brushSize * 3 : brushSize;

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.strokeStyle = tool === 'eraser' ? '#13131A' : color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPoint.current = pt;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawing, tool, color, brushSize]);

  function stopDrawing() {
    if (isDrawing) {
      setIsDrawing(false);
      lastPoint.current = null;
      saveSnapshot();
    }
  }

  function undo() {
    if (history.length < 2) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const prev = history[history.length - 2];
    ctx.putImageData(prev, 0, 0);
    setHistory((h) => h.slice(0, -1));
  }

  function clearCanvas() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#13131A';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.strokeStyle = '#2A2A3A';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    roundRect(ctx, 20, 20, CANVAS_W - 40, CANVAS_H - 40, 30);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#3a3a5a';
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('צייר את הממשק שלך כאן', CANVAS_W / 2, CANVAS_H / 2);

    setHasDrawn(false);
    setHistory([]);
    saveSnapshot();
  }

  function handleSubmit() {
    const canvas = canvasRef.current!;
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    onSubmit(base64, 'image/png', hint.trim() || undefined);
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget && !isGenerating) onClose(); }}
    >
      <div className="flex flex-col lg:flex-row gap-4 max-h-[95vh] w-full max-w-4xl">
        {/* Toolbar (top on mobile, side on desktop) */}
        <div className="flex lg:flex-col items-start gap-3 lg:gap-4 overflow-x-auto lg:overflow-x-visible py-2 lg:py-0 flex-shrink-0">
          {/* Header */}
          <div className="hidden lg:block">
            <h3 className="font-display font-bold text-lg text-text-primary">סקיצה</h3>
            <p className="text-text-secondary text-xs mt-0.5">צייר wireframe וAI יבנה אפליקציה</p>
          </div>

          {/* Tool selector */}
          <div className="flex lg:flex-col gap-2">
            <button
              onClick={() => setTool('pen')}
              title="עט"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                tool === 'pen'
                  ? 'bg-primary text-white shadow-glow'
                  : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => setTool('eraser')}
              title="מחק"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                tool === 'eraser'
                  ? 'bg-primary text-white shadow-glow'
                  : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L17.94 6M6 6l11.94 12" />
              </svg>
            </button>
          </div>

          {/* Brush size */}
          <div className="flex lg:flex-col gap-2">
            {SIZES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setBrushSize(value)}
                title={label}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  brushSize === value
                    ? 'bg-surface-2 border border-primary'
                    : 'bg-surface border border-border'
                }`}
              >
                <div
                  className="rounded-full bg-text-primary"
                  style={{ width: Math.min(value * 2.5, 18), height: Math.min(value * 2.5, 18) }}
                />
              </button>
            ))}
          </div>

          {/* Colors */}
          <div className="flex lg:flex-wrap gap-2 lg:max-w-[88px]">
            {COLORS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setColor(value)}
                title={label}
                className={`w-8 h-8 rounded-lg transition-all border-2 ${
                  color === value ? 'border-accent scale-110' : 'border-transparent'
                }`}
                style={{ background: value }}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex lg:flex-col gap-2">
            <button
              onClick={undo}
              disabled={history.length < 2}
              title="בטל"
              className="w-10 h-10 rounded-xl bg-surface border border-border text-text-secondary hover:text-text-primary disabled:opacity-30 flex items-center justify-center transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              onClick={clearCanvas}
              title="נקה הכל"
              className="w-10 h-10 rounded-xl bg-surface border border-border text-text-secondary hover:text-red-400 hover:border-red-400/30 flex items-center justify-center transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Canvas + bottom controls */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="lg:hidden">
              <span className="font-display font-bold text-sm">סקיצה → אפליקציה</span>
            </div>
            <div className="flex items-center gap-2 mr-auto">
              <div
                className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0"
                style={{ background: color }}
              />
              <span className="text-text-secondary text-xs capitalize">{tool === 'pen' ? 'עט' : 'מחק'} · {brushSize}px</span>
            </div>
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="mr-2 w-8 h-8 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* Canvas */}
          <div
            ref={containerRef}
            className="flex-1 flex items-start justify-center overflow-hidden rounded-xl border border-border"
            style={{ minHeight: 0 }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="rounded-xl touch-none"
              style={{
                cursor: tool === 'eraser' ? 'cell' : 'crosshair',
                maxHeight: '100%',
                maxWidth: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          {/* Hint input + submit */}
          <div className="flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="הוסף הסבר לסקיצה (אופציונלי)…"
              disabled={isGenerating}
              className="flex-1 px-3 py-2.5 rounded-xl bg-surface border border-border text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:border-primary transition-colors"
              dir="rtl"
              onKeyDown={(e) => { if (e.key === 'Enter' && hasDrawn && !isGenerating) handleSubmit(); }}
            />
            <button
              onClick={handleSubmit}
              disabled={!hasDrawn || isGenerating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-white font-medium text-sm hover:opacity-90 transition-all disabled:opacity-40 shadow-glow whitespace-nowrap"
            >
              {isGenerating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  מייצר…
                </>
              ) : (
                <>✨ צור אפליקציה</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
