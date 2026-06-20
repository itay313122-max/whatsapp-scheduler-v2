'use client';

interface Screen {
  label: string;
  index: number;
  active: boolean;
}

interface ScreenNavigatorProps {
  screens: Screen[];
  onNavigate: (index: number) => void;
  onAddScreen: (prompt: string) => void;
}

const PRESET_SCREENS = [
  { id: 'settings', label: 'הגדרות', icon: '⚙️' },
  { id: 'profile', label: 'פרופיל', icon: '👤' },
  { id: 'about', label: 'אודות', icon: 'ℹ️' },
  { id: 'contact', label: 'צור קשר', icon: '💬' },
];

export default function ScreenNavigator({ screens, onNavigate, onAddScreen }: ScreenNavigatorProps) {
  return (
    <div className="flex flex-col h-full" dir="rtl">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">מסכים</span>
      </div>

      <div className="flex-1 overflow-auto py-1">
        {screens.length > 0 ? (
          screens.map((screen) => (
            <button
              key={screen.index}
              onClick={() => onNavigate(screen.index)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-right text-xs transition-all ${
                screen.active
                  ? 'bg-primary/10 text-primary font-semibold border-r-2 border-primary'
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary'
              }`}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] flex-shrink-0 ${
                screen.active ? 'bg-primary text-white' : 'bg-surface-2 text-text-soft'
              }`}>
                {screen.index + 1}
              </div>
              <span className="truncate">{screen.label}</span>
            </button>
          ))
        ) : (
          <div className="px-3 py-4 text-xs text-text-soft text-center">
            בנה אפליקציה כדי לראות מסכים
          </div>
        )}
      </div>

      {/* Add screen */}
      <div className="border-t border-border p-2">
        <p className="text-[10px] text-text-soft uppercase tracking-wide mb-1.5 px-1">הוסף מסך</p>
        <div className="grid grid-cols-2 gap-1">
          {PRESET_SCREENS.map((s) => (
            <button
              key={s.id}
              onClick={() => onAddScreen(`הוסף מסך ${s.label} לאפליקציה`)}
              className="py-1.5 px-1 rounded text-[10px] border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 transition-all truncate"
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
