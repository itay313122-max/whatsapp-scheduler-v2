'use client';

interface AssistantToggleProps {
  onClick: () => void;
  unreadCount?: number;
  isOpen?: boolean;
}

export default function AssistantToggle({
  onClick,
  unreadCount = 0,
  isOpen = false,
}: AssistantToggleProps) {
  return (
    <button
      onClick={onClick}
      title={isOpen ? 'סגור Forge AI' : 'פתח Forge AI'}
      className={`fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-2xl font-display font-semibold text-sm transition-all duration-200 ${
        isOpen
          ? 'bg-white border border-primary text-primary shadow-card'
          : 'bg-gradient-primary text-white shadow-glow hover:opacity-90 active:scale-95'
      }`}
    >
      <span className="text-base leading-none">✨</span>
      <span>Forge AI</span>
      {unreadCount > 0 && !isOpen && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center leading-none">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
