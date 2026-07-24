export class SpeechSynthesisError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SpeechSynthesisError'
  }
}

/** Speaks `text` aloud and resolves once playback finishes. Rejects with AbortError if
 * `signal` aborts mid-speech. */
export function speak(text: string, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new SpeechSynthesisError('Speech synthesis is not supported'))
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    let settled = false

    function cleanup() {
      utterance.onend = null
      utterance.onerror = null
      signal?.removeEventListener('abort', onAbort)
    }

    function onAbort() {
      if (settled) return
      settled = true
      cleanup()
      window.speechSynthesis.cancel()
      reject(new DOMException('Aborted', 'AbortError'))
    }

    signal?.addEventListener('abort', onAbort)

    utterance.onend = () => {
      if (settled) return
      settled = true
      cleanup()
      resolve()
    }

    utterance.onerror = (event) => {
      if (settled) return
      settled = true
      cleanup()
      reject(new SpeechSynthesisError(event.error))
    }

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  })
}

export function cancelSpeech() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}
