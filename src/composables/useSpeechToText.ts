function getRecognitionCtor(): (new () => SpeechRecognition) | undefined {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition
}

export class SpeechToTextError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SpeechToTextError'
  }
}

/** Listens for a single spoken utterance and resolves with the transcript once the browser
 * detects the end of speech. Rejects with AbortError if `signal` aborts mid-listen. */
export function listenOnce(signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) {
      reject(new SpeechToTextError('Speech recognition is not supported'))
      return
    }

    const recognition = new Ctor()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    let finalTranscript = ''
    let settled = false

    function cleanup() {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      signal?.removeEventListener('abort', onAbort)
    }

    function onAbort() {
      if (settled) return
      settled = true
      cleanup()
      recognition.abort()
      reject(new DOMException('Aborted', 'AbortError'))
    }

    signal?.addEventListener('abort', onAbort)

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const alternative = event.results[i]?.[0]
        if (alternative) finalTranscript += alternative.transcript
      }
    }

    recognition.onerror = (event) => {
      if (settled) return
      settled = true
      cleanup()
      reject(new SpeechToTextError(event.error))
    }

    recognition.onend = () => {
      if (settled) return
      settled = true
      cleanup()
      resolve(finalTranscript.trim())
    }

    recognition.start()
  })
}
