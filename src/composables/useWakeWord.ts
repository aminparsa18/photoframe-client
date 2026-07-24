import { onMounted, onUnmounted, ref } from 'vue'

import { WAKE_WORD_PHRASE, WAKE_WORD_RESTART_DELAY_MS } from '@/config/constants'

export type WakeWordState = 'unsupported' | 'listening' | 'blocked'

function getRecognitionCtor(): (new () => SpeechRecognition) | undefined {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Continuously listens for WAKE_WORD_PHRASE via the browser's SpeechRecognition API,
 * auto-restarting since it stops itself after brief silence. Decoupled from what "waking"
 * does — callers just pass an onWake callback. */
export function useWakeWord(onWake: () => void) {
  const state = ref<WakeWordState>('unsupported')
  let recognition: SpeechRecognition | null = null
  let restartTimeout: ReturnType<typeof setTimeout> | undefined
  let stopped = true

  function scheduleRestart() {
    if (stopped) return
    restartTimeout = setTimeout(() => {
      try {
        recognition?.start()
        state.value = 'listening'
      } catch {
        scheduleRestart()
      }
    }, WAKE_WORD_RESTART_DELAY_MS)
  }

  function start() {
    const Ctor = getRecognitionCtor()
    if (!Ctor) {
      state.value = 'unsupported'
      return
    }

    recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const alternative = event.results[i]?.[0]
        if (!alternative) continue
        const transcript = normalize(alternative.transcript)
        if (transcript.includes(WAKE_WORD_PHRASE)) {
          onWake()
        }
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        stopped = true
        state.value = 'blocked'
      }
    }

    recognition.onend = () => {
      if (!stopped) scheduleRestart()
    }

    stopped = false
    recognition.start()
    state.value = 'listening'
  }

  function stop() {
    stopped = true
    clearTimeout(restartTimeout)
    recognition?.abort()
    recognition = null
  }

  onMounted(start)
  onUnmounted(stop)

  return { state, start, stop }
}
