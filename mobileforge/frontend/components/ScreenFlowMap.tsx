'use client';

import { useMemo } from 'react';

// Visualizes a generated app's navigation graph: each screen is a node, each
// onClick→setScreen is an arrow. Reachability is computed by BFS from the landing
// screen so unreachable screens stand out (the same defect the quality gate flags).
// Layout is dependency-free: BFS levels become columns, nodes stack within a column.

interface Edge { from: string; to: string }

interface Props {
  screenIds: string[];
  reachableIds: string[];
  edges: Edge[];
  /** Currently-shown screen id, highlighted if provided. */
  activeId?: string;
  /** Jump the preview to a screen when its node is clicked. */
  onSelect?: (id: string) => void;
}

const NODE_W = 132;
const NODE_H = 40;
const COL_GAP = 76;
const ROW_GAP = 26;
const PAD = 20;

export default function ScreenFlowMap({ screenIds, reachableIds, edges, activeId, onSelect }: Props) {
  const layout = useMemo(() => {
    if (!screenIds.length) return null;
    const landing = reachableIds[0] || screenIds[0];
    const adj = new Map<string, string[]>();
    screenIds.forEach((s) => adj.set(s, []));
    for (const e of edges) if (adj.has(e.from)) adj.get(e.from)!.push(e.to);

    // BFS levels from the landing screen.
    const level = new Map<string, number>();
    const queue: string[] = [landing];
    level.set(landing, 0);
    while (queue.length) {
      const cur = queue.shift()!;
      for (const next of adj.get(cur) || []) {
        if (!level.has(next)) { level.set(next, (level.get(cur) || 0) + 1); queue.push(next); }
      }
    }
    // Unreachable screens go in a trailing column so they're visibly separate.
    const maxLevel = Math.max(0, ...Array.from(level.values()));
    const orphanLevel = maxLevel + 1;
    const reachSet = new Set(reachableIds);
    for (const s of screenIds) if (!level.has(s)) level.set(s, orphanLevel);

    // Group by column, then assign rows.
    const cols = new Map<number, string[]>();
    for (const s of screenIds) {
      const l = level.get(s)!;
      if (!cols.has(l)) cols.set(l, []);
      cols.get(l)!.push(s);
    }
    const pos = new Map<string, { x: number; y: number }>();
    let maxRows = 0;
    Array.from(cols.entries()).forEach(([l, ids]) => {
      ids.forEach((id, row) => {
        pos.set(id, { x: PAD + l * (NODE_W + COL_GAP), y: PAD + row * (NODE_H + ROW_GAP) });
      });
      maxRows = Math.max(maxRows, ids.length);
    });
    const width = PAD * 2 + (Math.max(...Array.from(cols.keys())) + 1) * NODE_W + Math.max(0, cols.size - 1) * COL_GAP;
    const height = PAD * 2 + maxRows * NODE_H + Math.max(0, maxRows - 1) * ROW_GAP;
    return { pos, width, height, landing, reachSet, orphanLevel, level };
  }, [screenIds, reachableIds, edges]);

  if (!layout || !screenIds.length) {
    return <div className="flex items-center justify-center h-full text-xs text-text-soft">No screens detected for this app.</div>;
  }

  const { pos, width, height, landing, reachSet } = layout;
  const edge = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2;
    const x2 = b.x, y2 = b.y + NODE_H / 2;
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
  };

  return (
    <div className="w-full h-full overflow-auto p-2">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="min-w-full">
        <defs>
          <marker id="fm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" className="text-text-soft" />
          </marker>
        </defs>
        {/* edges */}
        {edges.map((e, i) => {
          const a = pos.get(e.from); const b = pos.get(e.to);
          if (!a || !b) return null;
          return (
            <path key={i} d={edge(a, b)} fill="none" stroke="currentColor"
              className="text-border" strokeWidth={1.5} markerEnd="url(#fm-arrow)" opacity={0.7} />
          );
        })}
        {/* nodes */}
        {screenIds.map((id) => {
          const p = pos.get(id)!;
          const isLanding = id === landing;
          const unreachable = !reachSet.has(id);
          const active = id === activeId;
          const stroke = unreachable ? '#f59e0b' : active ? '#6366f1' : isLanding ? '#22c55e' : '#d1d5db';
          const fill = active ? 'rgba(99,102,241,0.10)' : unreachable ? 'rgba(245,158,11,0.08)' : 'rgba(148,163,184,0.06)';
          return (
            <g key={id} onClick={() => onSelect?.(id)} style={{ cursor: onSelect ? 'pointer' : 'default' }}>
              <rect x={p.x} y={p.y} width={NODE_W} height={NODE_H} rx={10}
                fill={fill} stroke={stroke} strokeWidth={active ? 2 : 1.5} />
              <text x={p.x + NODE_W / 2} y={p.y + NODE_H / 2} dominantBaseline="middle" textAnchor="middle"
                className="fill-text-primary" fontSize={12} fontWeight={600}>
                {id.length > 14 ? id.slice(0, 13) + '…' : id}
              </text>
              {isLanding && (
                <text x={p.x + 8} y={p.y - 5} className="fill-green-500" fontSize={8} fontWeight={700}>START</text>
              )}
              {unreachable && (
                <text x={p.x + 8} y={p.y - 5} className="fill-amber-500" fontSize={8} fontWeight={700}>UNREACHABLE</text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-3 mt-1 px-1 text-[10px] text-text-secondary">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded border" style={{ borderColor: '#22c55e' }} />Start</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded border" style={{ borderColor: '#6366f1' }} />Current</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded border" style={{ borderColor: '#f59e0b' }} />Unreachable</span>
      </div>
    </div>
  );
}
