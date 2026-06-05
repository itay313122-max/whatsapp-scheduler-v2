'use client';

import Link from 'next/link';

interface ProjectCardProps {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  colorScheme?: { primary: string; background: string; text: string };
  features?: string[];
  lastSnackId?: string;
  onDelete?: (id: string) => void;
}

export default function ProjectCard({
  id,
  name,
  description,
  updatedAt,
  colorScheme,
  features = [],
  lastSnackId,
  onDelete,
}: ProjectCardProps) {
  const accentColor = colorScheme?.primary || '#6366F1';

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'עכשיו';
    if (mins < 60) return `לפני ${mins} דקות`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `לפני ${hours} שעות`;
    return `לפני ${Math.floor(hours / 24)} ימים`;
  };

  return (
    <div
      className="group relative rounded-2xl overflow-hidden glass-card cursor-pointer"
      style={{ '--accent': accentColor } as React.CSSProperties}
    >
      {/* Color strip */}
      <div
        className="h-1.5 w-full"
        style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}44)` }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-display font-bold text-lg shadow-card"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-display font-semibold text-text-primary text-sm">{name}</h3>
              <p className="text-text-soft text-xs">{timeAgo(updatedAt)}</p>
            </div>
          </div>

          {onDelete && (
            <button
              onClick={(e) => { e.preventDefault(); onDelete(id); }}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-text-soft hover:text-red-400 hover:bg-red-50 transition-all"
              title="מחק פרויקט"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {description && (
          <p className="text-text-secondary text-xs mb-3 line-clamp-2">{description}</p>
        )}

        {features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {features.slice(0, 3).map((f) => (
              <span
                key={f}
                className="px-2 py-0.5 rounded-full text-xs border font-medium"
                style={{
                  borderColor: `${accentColor}30`,
                  color: accentColor,
                  background: `${accentColor}12`,
                }}
              >
                {f}
              </span>
            ))}
            {features.length > 3 && (
              <span className="px-2 py-0.5 rounded-full text-xs text-text-soft border border-border">
                +{features.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/builder/${id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            ערוך
          </Link>
          {lastSnackId && (
            <a
              href={`https://snack.expo.dev/@snack/${lastSnackId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl text-xs text-text-secondary hover:text-primary border border-border hover:border-primary/30 bg-surface-2 hover:bg-surface transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
