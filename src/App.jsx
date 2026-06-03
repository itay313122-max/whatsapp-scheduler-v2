import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { ChatContext } from './lib/chatContext'
import { useChat } from './hooks/useChat'
import Sidebar from './components/Sidebar'
import Chat from './pages/Chat'
import Memory from './pages/Memory'
import Agents from './pages/Agents'
import Settings from './pages/Settings'

const MOBILE_LINKS = [
  { to: '/',         icon: '◈', label: 'Chat'     },
  { to: '/memory',   icon: '🧠', label: 'Memory'  },
  { to: '/agents',   icon: '⚡', label: 'Agents'  },
  { to: '/settings', icon: '⚙', label: 'Settings' },
]

function MobileNav() {
  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around"
      style={{ background: '#07071a', borderTop: '1px solid #1a1a3e', height: '56px' }}
    >
      {MOBILE_LINKS.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs font-mono transition-all"
          style={({ isActive }) => ({
            color:   isActive ? '#6366f1' : '#475569',
            background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
          })}
        >
          <span className="text-lg leading-none">{icon}</span>
          <span style={{ fontSize: '0.6rem' }}>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default function App() {
  const chat = useChat()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ChatContext.Provider value={chat}>
      <BrowserRouter>
        <div
          className="flex h-full overflow-hidden"
          style={{ background: '#050510', color: '#f1f5f9' }}
        >
          {/* Mobile overlay backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 sm:hidden"
              style={{ background: 'rgba(5,5,16,0.85)', backdropFilter: 'blur(4px)' }}
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar — hidden on mobile unless opened, always visible on desktop */}
          <div
            className={`fixed sm:relative z-50 sm:z-auto h-full
              ${sidebarOpen ? 'flex' : 'hidden sm:flex'}`}
            style={{ top: 0, right: 0 }}
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-hidden flex flex-col">
            {/* Mobile top bar */}
            <div
              className="sm:hidden shrink-0 flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid #1a1a3e', background: '#07071a' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}
                >
                  🤖
                </span>
                <span className="font-mono font-bold text-sm" style={{ color: '#6366f1' }}>ITAY AI</span>
              </div>
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-xl font-mono px-2"
                style={{ color: '#64748b' }}
              >
                ☰
              </button>
            </div>

            {/* Pages — add bottom padding on mobile for nav bar */}
            <div className="flex-1 overflow-hidden pb-0 sm:pb-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
              <Routes>
                <Route path="/"         element={<Chat />}     />
                <Route path="/memory"   element={<Memory />}   />
                <Route path="/agents"   element={<Agents />}   />
                <Route path="/settings" element={<Settings />} />
                <Route path="*"         element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav />
      </BrowserRouter>
    </ChatContext.Provider>
  )
}
