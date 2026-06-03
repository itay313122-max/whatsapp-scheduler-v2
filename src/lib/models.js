// ── Claude (Anthropic) ──────────────────────────────────────────
export async function callClaude(messages, systemPrompt, apiKey) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `Claude error ${res.status}`)
  return data.content[0].text
}

// ── GPT-4o (OpenAI) ─────────────────────────────────────────────
export async function callGPT(messages, systemPrompt, apiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `GPT error ${res.status}`)
  return data.choices[0].message.content
}

// ── Groq (Llama — fast) ─────────────────────────────────────────
export async function callGroq(messages, systemPrompt, apiKey) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1500,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `Groq error ${res.status}`)
  return data.choices[0].message.content
}

// ── Main dispatcher ──────────────────────────────────────────────
export async function callModel(model, messages, systemPrompt, keys) {
  switch (model) {
    case 'claude': return callClaude(messages, systemPrompt, keys.claude)
    case 'gpt':    return callGPT(messages, systemPrompt, keys.openai)
    case 'groq':   return callGroq(messages, systemPrompt, keys.groq)
    default:       return callClaude(messages, systemPrompt, keys.claude)
  }
}

// ── Test a single key ────────────────────────────────────────────
export async function testKey(model, apiKey) {
  const ping = [{ role: 'user', content: 'hi' }]
  try {
    switch (model) {
      case 'claude': await callClaude(ping, 'You are a test assistant.', apiKey); break
      case 'gpt':    await callGPT(ping, 'You are a test assistant.', apiKey); break
      case 'groq':   await callGroq(ping, 'You are a test assistant.', apiKey); break
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}
