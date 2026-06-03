import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ChatContext } from './lib/chatContext'
import { useChat } from './hooks/useChat'
import Sidebar from './components/Sidebar'
import Chat from './pages/Chat'
import Memory from './pages/Memory'
import Agents from './pages/Agents'
import Settings from './pages/Settings'

export default function App() {
  const chat = useChat()

  return (
    <ChatContext.Provider value={chat}>
      <BrowserRouter>
        <div
          className="flex h-full overflow-hidden"
          style={{ background: '#050510', color: '#f1f5f9' }}
        >
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/"         element={<Chat />}     />
              <Route path="/memory"   element={<Memory />}   />
              <Route path="/agents"   element={<Agents />}   />
              <Route path="/settings" element={<Settings />} />
              <Route path="*"         element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ChatContext.Provider>
  )
}
