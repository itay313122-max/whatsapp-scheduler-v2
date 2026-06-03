import { createContext, useContext } from 'react'

export const ChatContext = createContext(null)

export function useChatCtx() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatCtx must be used inside ChatContext.Provider')
  return ctx
}
