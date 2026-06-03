import { useChatStore } from '../store/chatStore'
import type { Conversation } from '../store/chatStore'

export default function Sidebar() {
  const {
    conversations,
    currentConversationId,
    activePanel,
    createConversation,
    deleteConversation,
    selectConversation,
    setActivePanel,
  } = useChatStore()

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-terminal-surface border-r border-terminal-border h-full overflow-hidden">
      {/* Logo */}
      <div className="shrink-0 px-4 py-3 border-b border-terminal-border">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-terminal-green shrink-0 animate-pulse" />
          <span className="text-terminal-amber font-mono text-xs font-bold tracking-widest uppercase truncate">
            Personal AI OS
          </span>
        </div>
        <div className="text-terminal-faint font-mono text-xs mt-0.5">
          v1.0.0 // ONLINE
        </div>
      </div>

      {/* New chat */}
      <div className="shrink-0 px-3 py-2.5 border-b border-terminal-border">
        <button
          onClick={() => createConversation()}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold tracking-widest text-terminal-amber border border-terminal-amber/30 rounded hover:bg-terminal-amber/10 transition-colors"
        >
          <span className="text-base leading-none">+</span>
          <span>NEW CHAT</span>
        </button>
      </div>

      {/* Conversation history */}
      <div className="flex-1 overflow-y-auto py-1">
        <div className="px-3 py-1.5">
          <span className="text-terminal-faint text-xs font-mono tracking-widest uppercase">
            History
          </span>
        </div>
        {conversations.length === 0 ? (
          <div className="px-3 py-2 text-terminal-faint text-xs font-mono">
            No conversations yet
          </div>
        ) : (
          conversations.map(conv => (
            <ConvItem
              key={conv.id}
              conv={conv}
              active={conv.id === currentConversationId}
              onSelect={() => selectConversation(conv.id)}
              onDelete={() => deleteConversation(conv.id)}
            />
          ))
        )}
      </div>

      {/* Bottom nav */}
      <div className="shrink-0 border-t border-terminal-border py-1">
        <NavBtn
          label="SETTINGS"
          icon="⚙"
          active={activePanel === 'settings'}
          onClick={() =>
            setActivePanel(activePanel === 'settings' ? 'chat' : 'settings')
          }
        />
      </div>
    </aside>
  )
}

function ConvItem({
  conv,
  active,
  onSelect,
  onDelete,
}: {
  conv: Conversation
  active: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center px-3 py-1.5 mx-1 rounded cursor-pointer transition-colors ${
        active
          ? 'bg-terminal-amber/10 text-terminal-amber'
          : 'text-terminal-text hover:bg-terminal-surface2'
      }`}
    >
      <div className="flex-1 min-w-0 pr-4">
        <div className="text-xs font-mono truncate">{conv.title}</div>
        <div className="text-terminal-faint text-xs font-mono">
          {conv.messages.length} msgs · {relTime(conv.updatedAt)}
        </div>
      </div>
      <button
        onClick={e => {
          e.stopPropagation()
          onDelete()
        }}
        className="absolute right-2 opacity-0 group-hover:opacity-100 text-terminal-muted hover:text-terminal-red text-sm transition-opacity"
        title="Delete"
      >
        ×
      </button>
    </div>
  )
}

function NavBtn({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-mono tracking-wider transition-colors ${
        active
          ? 'text-terminal-amber bg-terminal-amber/10'
          : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-surface2'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function relTime(ts: number): string {
  const d = Date.now() - ts
  if (d < 60_000) return 'now'
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m`
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h`
  return `${Math.floor(d / 86_400_000)}d`
}
