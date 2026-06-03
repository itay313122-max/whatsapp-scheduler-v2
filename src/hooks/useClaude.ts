import { useState, useCallback } from 'react'
import { useChatStore } from '../store/chatStore'

interface UseClaudeReturn {
  isStreaming: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
}

export function useClaude(): UseClaudeReturn {
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    settings,
    currentConversationId,
    addMessage,
    updateLastAssistantMessage,
    createConversation,
  } = useChatStore()

  const sendMessage = useCallback(
    async (content: string) => {
      if (!settings.apiKey.trim()) {
        setError('No API key configured — open Settings and add your Anthropic key.')
        return
      }

      setError(null)

      // Resolve or create conversation
      const convId: string = currentConversationId ?? createConversation()

      // Snapshot existing messages BEFORE we mutate the store
      const snapshot = useChatStore
        .getState()
        .conversations.find(c => c.id === convId)

      const priorMessages = (snapshot?.messages ?? []).map(m => ({
        role: m.role,
        content: m.content,
      }))

      // The messages we'll send to the API
      const apiMessages = [...priorMessages, { role: 'user' as const, content }]

      // Persist user message + empty assistant placeholder
      addMessage(convId, { role: 'user', content })
      addMessage(convId, { role: 'assistant', content: '' })

      setIsStreaming(true)

      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': settings.apiKey.trim(),
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-allow-browser': 'true',
          },
          body: JSON.stringify({
            model: settings.model,
            max_tokens: settings.maxTokens,
            temperature: settings.temperature,
            stream: true,
            ...(settings.systemPrompt.trim()
              ? { system: settings.systemPrompt.trim() }
              : {}),
            messages: apiMessages,
          }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          const msg =
            (body as { error?: { message?: string } }).error?.message ??
            `HTTP ${res.status}`
          throw new Error(msg)
        }

        if (!res.body) throw new Error('No response body from API')

        const reader = res.body.getReader()
        const dec = new TextDecoder()
        let buf = ''
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buf += dec.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (raw === '[DONE]') continue
            try {
              const evt = JSON.parse(raw) as {
                type: string
                delta?: { type: string; text?: string }
              }
              if (
                evt.type === 'content_block_delta' &&
                evt.delta?.type === 'text_delta' &&
                evt.delta.text
              ) {
                accumulated += evt.delta.text
                updateLastAssistantMessage(convId, accumulated)
              }
            } catch {
              // ignore malformed SSE lines
            }
          }
        }

        if (!accumulated) {
          updateLastAssistantMessage(convId, '[No response received]')
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        updateLastAssistantMessage(convId, `⚠ Error: ${msg}`)
      } finally {
        setIsStreaming(false)
      }
    },
    [
      settings,
      currentConversationId,
      addMessage,
      updateLastAssistantMessage,
      createConversation,
    ],
  )

  return { isStreaming, error, sendMessage }
}
