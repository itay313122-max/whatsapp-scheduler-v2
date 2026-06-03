import { useEffect } from 'react'
import { useChatStore } from './store/chatStore'
import Sidebar from './components/Sidebar'
import Chat from './components/Chat'
import Settings from './components/Settings'

export default function App() {
  const { conversations, currentConversationId, activePanel, createConversation } =
    useChatStore()

  // Auto-create a first conversation on fresh load
  useEffect(() => {
    if (conversations.length === 0 || !currentConversationId) {
      createConversation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-full bg-terminal-bg text-terminal-text overflow-hidden font-mono">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {activePanel === 'settings' ? <Settings /> : <Chat />}
      </main>
    </div>
  )
}
