import { useState, useEffect, useCallback } from 'react'
import { routeMessage, resolveModel } from '../lib/router'
import { callModel } from '../lib/models'
import { buildSystemPrompt } from '../lib/persona'
import { getMemories, getHistory, saveHistory, clearHistory } from '../lib/memory'

function getSettings() {
  try { return JSON.parse(localStorage.getItem('itayai_settings') || '{}') }
  catch { return {} }
}

function getKeys(s) {
  return { claude: s.claudeKey || '', openai: s.openaiKey || '', groq: s.groqKey || '' }
}

export function useChat() {
  const [messages, setMessages]     = useState([])
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState(null)
  const [lastRoute, setLastRoute]   = useState(null)

  // Restore history on mount
  useEffect(() => {
    const h = getHistory()
    if (h.length > 0) setMessages(h)
  }, [])

  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isLoading) return

    const userMsg = { role: 'user', content, id: Date.now() }
    const next    = (prev) => [...prev, userMsg]

    setMessages(next)
    setIsLoading(true)
    setError(null)

    const settings = getSettings()
    const keys     = getKeys(settings)
    const route    = routeMessage(content, {
      autoRoute:   settings.autoRoute !== false,
      forcedModel: settings.forcedModel || 'claude',
    })
    const model    = resolveModel(route.model, keys)
    const activeRoute = { ...route, model: model || route.model }
    setLastRoute(activeRoute)

    if (!model) {
      const err = {
        role: 'assistant',
        content: '❌ לא נמצא API key זמין. הוסף לפחות את Anthropic API key בהגדרות.',
        model: 'error',
        route: activeRoute,
        id: Date.now() + 1,
      }
      setMessages((prev) => {
        const updated = [...prev, err]
        saveHistory(updated)
        return updated
      })
      setIsLoading(false)
      return
    }

    try {
      const memories     = getMemories()
      const systemPrompt = buildSystemPrompt(memories, settings.customPersona || '')
      // Build API-compatible messages (no id/model/route fields)
      const apiMsgs = [...messages, userMsg].slice(-24).map((m) => ({
        role:    m.role,
        content: m.content,
      }))

      const response = await callModel(model, apiMsgs, systemPrompt, keys)

      const aiMsg = {
        role: 'assistant',
        content: response,
        model,
        route: activeRoute,
        id: Date.now() + 1,
      }
      setMessages((prev) => {
        const updated = [...prev, aiMsg]
        saveHistory(updated)
        return updated
      })
    } catch (e) {
      const errMsg = {
        role: 'assistant',
        content: `❌ שגיאה: ${e.message}`,
        model: 'error',
        route: activeRoute,
        id: Date.now() + 1,
      }
      setMessages((prev) => {
        const updated = [...prev, errMsg]
        saveHistory(updated)
        return updated
      })
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, messages])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
    setLastRoute(null)
    clearHistory()
  }, [])

  return { messages, isLoading, error, lastRoute, sendMessage, clearChat }
}
