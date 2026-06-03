import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export interface AppSettings {
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
}

export type ActivePanel = 'chat' | 'settings'

interface ChatState {
  conversations: Conversation[]
  currentConversationId: string | null
  settings: AppSettings
  activePanel: ActivePanel

  createConversation: () => string
  deleteConversation: (id: string) => void
  selectConversation: (id: string) => void
  addMessage: (convId: string, msg: Omit<Message, 'timestamp'>) => void
  updateLastAssistantMessage: (convId: string, content: string) => void
  updateSettings: (patch: Partial<AppSettings>) => void
  setActivePanel: (panel: ActivePanel) => void
  getCurrentConversation: () => Conversation | null
}

const DEFAULT_SYSTEM_PROMPT =
  'You are a highly capable AI assistant with deep knowledge across all domains. ' +
  'You are precise, analytical, and think through problems systematically. ' +
  'You provide detailed, accurate responses while being direct and efficient.'

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      settings: {
        apiKey: '',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
      },
      activePanel: 'chat',

      createConversation() {
        const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        const conv: Conversation = {
          id,
          title: 'New Conversation',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set(s => ({
          conversations: [conv, ...s.conversations],
          currentConversationId: id,
          activePanel: 'chat' as ActivePanel,
        }))
        return id
      },

      deleteConversation(id) {
        set(s => {
          const filtered = s.conversations.filter(c => c.id !== id)
          const newId =
            s.currentConversationId === id
              ? (filtered[0]?.id ?? null)
              : s.currentConversationId
          return { conversations: filtered, currentConversationId: newId }
        })
      },

      selectConversation(id) {
        set({ currentConversationId: id, activePanel: 'chat' })
      },

      addMessage(convId, msg) {
        set(s => ({
          conversations: s.conversations.map(c => {
            if (c.id !== convId) return c
            const newMsg: Message = { ...msg, timestamp: Date.now() }
            const messages = [...c.messages, newMsg]
            const title =
              c.messages.length === 0 && msg.role === 'user'
                ? msg.content.slice(0, 52) + (msg.content.length > 52 ? '…' : '')
                : c.title
            return { ...c, messages, title, updatedAt: Date.now() }
          }),
        }))
      },

      updateLastAssistantMessage(convId, content) {
        set(s => ({
          conversations: s.conversations.map(c => {
            if (c.id !== convId) return c
            const messages = [...c.messages]
            const last = messages.length - 1
            if (last >= 0 && messages[last].role === 'assistant') {
              messages[last] = { ...messages[last], content }
            }
            return { ...c, messages, updatedAt: Date.now() }
          }),
        }))
      },

      updateSettings(patch) {
        set(s => ({ settings: { ...s.settings, ...patch } }))
      },

      setActivePanel(panel) {
        set({ activePanel: panel })
      },

      getCurrentConversation() {
        const s = get()
        return s.conversations.find(c => c.id === s.currentConversationId) ?? null
      },
    }),
    { name: 'personal-ai-os' },
  ),
)
