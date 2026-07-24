import { OPENAI_CHAT_COMPLETIONS_URL, OPENAI_MODEL } from '@/config/constants'
import type { ChatMessage } from '@/types/assistant'

export class OpenAiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OpenAiError'
  }
}

interface ChatCompletionChunk {
  choices?: Array<{ delta?: { content?: string } }>
}

/** Streams a chat completion, yielding each token/text delta as it arrives over SSE. */
export async function* streamChatCompletion(
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) {
    throw new OpenAiError('OpenAI API key is not configured (VITE_OPENAI_API_KEY)')
  }

  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      stream: true,
    }),
    signal,
  })

  if (!response.ok || !response.body) {
    throw new OpenAiError(`OpenAI request failed with status ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue

      const data = trimmed.slice('data:'.length).trim()
      if (data === '[DONE]') return

      const parsed = JSON.parse(data) as ChatCompletionChunk
      const delta = parsed.choices?.[0]?.delta?.content
      if (delta) yield delta
    }
  }
}
