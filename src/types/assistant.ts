export type AssistantPhase = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}
