import MessageList from './MessageList'
import InputBar from './InputBar'
import { useChatStore } from '../store/chatStore'
import { useClaude } from '../hooks/useClaude'

export default function Chat() {
  const { getCurrentConversation, settings } = useChatStore()
  const conversation = getCurrentConversation()
  const { isStreaming, error, sendMessage } = useClaude()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-terminal-border bg-terminal-surface">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-terminal-amber text-xs font-mono font-semibold tracking-wider truncate">
            {conversation?.title ?? 'No conversation'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono shrink-0 ml-4">
          <span className="flex items-center gap-1.5 text-terminal-green">
            <span className="w-1.5 h-1.5 rounded-full bg-terminal-green inline-block" />
            LIVE
          </span>
          <span className="text-terminal-muted hidden sm:block">{settings.model}</span>
          <span className="text-terminal-faint">{settings.maxTokens} tok</span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="shrink-0 flex items-start gap-2 px-4 py-2 bg-red-950/40 border-b border-red-900/30 text-red-400 text-xs font-mono">
          <span className="shrink-0">ERR</span>
          <span className="break-words">{error}</span>
        </div>
      )}

      {/* Message list */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={conversation?.messages ?? []} isStreaming={isStreaming} />
      </div>

      {/* Input */}
      <InputBar
        onSend={sendMessage}
        isStreaming={isStreaming}
        hasApiKey={!!settings.apiKey.trim()}
      />
    </div>
  )
}
