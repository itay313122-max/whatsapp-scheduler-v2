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
      title={isOpen ? 'Close Forge AI' : 'Open Forge AI'}
      className={`fixed bottom-6 left-6 z-40 flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium border transition-all duration-200 ${
        isOpen
          ? 'bg-primary/10 border-primary/30 text-primary'
          : 'bg-surface/90 border-border text-text-secondary hover:text-text-primary hover:border-primary/30 shadow-sm active:scale-[0.98]'
      }`}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
      <span>Forge AI</span>
      {unreadCount > 0 && !isOpen && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center leading-none">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
