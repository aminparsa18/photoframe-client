<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'

import GenerativeOrb from '@/components/GenerativeOrb.vue'
import { ASSISTANT_AUTO_DISMISS_MS } from '@/config/constants'
import { useAssistantStore } from '@/stores/assistant'

const assistant = useAssistantStore()

let dismissTimeout: ReturnType<typeof setTimeout> | undefined

function resetDismissTimer() {
  clearTimeout(dismissTimeout)
  dismissTimeout = setTimeout(() => assistant.dismiss(), ASSISTANT_AUTO_DISMISS_MS)
}

// Restart the countdown on every phase change so a slow API round-trip doesn't get cut
// off mid-conversation — the flat timer only actually elapses once things go quiet.
onMounted(resetDismissTimer)
onUnmounted(() => clearTimeout(dismissTimeout))
watch(() => assistant.phase, resetDismissTimer)

const statusText = computed(() => {
  switch (assistant.phase) {
    case 'listening':
      return 'Listening…'
    case 'thinking':
      return 'Thinking…'
    case 'speaking':
      return assistant.responseText
    case 'error':
      return assistant.errorMessage || 'Something went wrong'
    default:
      return assistant.responseText || 'Listening…'
  }
})
</script>

<template>
  <div class="assistant" role="status" aria-live="polite" @click="assistant.dismiss()">
    <div class="assistant__orb" aria-hidden="true">
      <div class="assistant__halo" />
      <GenerativeOrb class="assistant__mesh" />
    </div>
    <p v-if="assistant.transcript && assistant.phase !== 'listening'" class="assistant__transcript">
      “{{ assistant.transcript }}”
    </p>
    <p class="assistant__status">{{ statusText }}</p>
    <p class="assistant__hint">Tap anywhere to dismiss</p>
  </div>
</template>

<style scoped>
.assistant {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(1rem, 2vw, 1.5rem);
}

.assistant__orb {
  position: relative;
  /* Bounded by vh, not just vw: the halo overflows this box and the status
     text sits below it, so on a fixed-height kiosk screen an orb sized purely
     off viewport width can grow tall enough to bleed into that text. */
  width: clamp(440px, min(58vw, 62vh), 640px);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.assistant__halo {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    var(--color-accent-soft) 0%,
    rgba(67, 56, 202, 0.14) 45%,
    transparent 72%
  );
  filter: blur(20px);
  animation: breathe 4.2s ease-in-out infinite;
}

.assistant__mesh {
  position: relative;
  width: 100%;
  height: 100%;
}

.assistant__transcript {
  margin: 0;
  max-width: min(70vw, 640px);
  text-align: center;
  font-size: clamp(0.95rem, 1.3vw, 1.1rem);
  font-style: italic;
  color: var(--color-text-tertiary);
}

.assistant__status {
  margin: 0;
  max-width: min(70vw, 640px);
  text-align: center;
  font-size: clamp(1.25rem, 2.4vw, 1.9rem);
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--color-text-primary);
}

.assistant__hint {
  margin: 0;
  font-size: clamp(0.85rem, 1.1vw, 1rem);
  color: var(--color-text-tertiary);
}

@keyframes breathe {
  0%,
  100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.06);
  }
}

@media (prefers-reduced-motion: reduce) {
  .assistant__halo {
    animation: none;
  }
}
</style>
