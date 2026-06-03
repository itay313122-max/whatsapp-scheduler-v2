import { useState, useCallback } from 'react'
import { getMemories, addMemory, removeMemory, resetMemories } from '../lib/memory'

export function useMemory() {
  const [memories, setMemories] = useState(getMemories)

  const add = useCallback((text) => {
    if (!text.trim()) return
    const updated = addMemory(text)
    setMemories([...updated])
  }, [])

  const remove = useCallback((index) => {
    const updated = removeMemory(index)
    setMemories([...updated])
  }, [])

  const reset = useCallback(() => {
    const defaults = resetMemories()
    setMemories([...defaults])
  }, [])

  return { memories, add, remove, reset }
}
