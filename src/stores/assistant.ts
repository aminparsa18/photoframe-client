import { ref } from 'vue'
import { defineStore } from 'pinia'

import { ASSISTANT_HISTORY_LIMIT, ASSISTANT_SYSTEM_PROMPT } from '@/config/constants'
import { cancelSpeech, speak } from '@/composables/useSpeechSynthesis'
import { listenOnce } from '@/composables/useSpeechToText'
import { OpenAiError, streamChatCompletion } from '@/services/openai'
import type { AssistantPhase, ChatMessage } from '@/types/assistant'

export const useAssistantStore = defineStore('assistant', () => {
  const isActive = ref(false)
  const phase = ref<AssistantPhase>('idle')
  const transcript = ref('')
  const responseText = ref('')
  const errorMessage = ref('')

  const history: ChatMessage[] = []
  let turnController: AbortController | null = null

  function resetTurnState() {
    turnController?.abort()
    turnController = null
    cancelSpeech()
    phase.value = 'idle'
    transcript.value = ''
    responseText.value = ''
    errorMessage.value = ''
  }

  async function wake() {
    if (isActive.value) return
    isActive.value = true
    resetTurnState()
    await runTurn()
  }

  function dismiss() {
    isActive.value = false
    resetTurnState()
  }

  async function runTurn() {
    const controller = new AbortController()
    turnController = controller
    const { signal } = controller

    phase.value = 'listening'
    let heard: string
    try {
      heard = await listenOnce(signal)
    } catch (error) {
      if (signal.aborted) return
      phase.value = 'error'
      errorMessage.value = error instanceof Error ? error.message : 'Could not hear you'
      return
    }

    if (signal.aborted || !heard) {
      if (!signal.aborted) dismiss()
      return
    }

    transcript.value = heard
    phase.value = 'thinking'
    history.push({ role: 'user', content: heard })

    const messages: ChatMessage[] = [
      { role: 'system', content: ASSISTANT_SYSTEM_PROMPT },
      ...history.slice(-ASSISTANT_HISTORY_LIMIT),
    ]

    let fullText = ''
    try {
      for await (const chunk of streamChatCompletion(messages, signal)) {
        fullText += chunk
        responseText.value = fullText
      }
    } catch (error) {
      if (signal.aborted) return
      phase.value = 'error'
      errorMessage.value = error instanceof OpenAiError ? error.message : 'Something went wrong'
      return
    }

    if (signal.aborted) return
    if (!fullText.trim()) {
      dismiss()
      return
    }

    history.push({ role: 'assistant', content: fullText })
    phase.value = 'speaking'

    try {
      await speak(fullText, signal)
    } catch {
      // Speech synthesis failing shouldn't hide the response text already on screen.
    }

    if (signal.aborted) return
    phase.value = 'idle'
  }

  return { isActive, phase, transcript, responseText, errorMessage, wake, dismiss }
})
