<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

import { useSwipe } from '@/composables/useSwipe'
import { useWakeWord } from '@/composables/useWakeWord'
import { useAssistantStore } from '@/stores/assistant'
import AssistantView from '@/views/AssistantView.vue'

const assistant = useAssistantStore()
const wakeWord = useWakeWord(() => assistant.wake())

// The assistant's own speech recognition (for capturing the question) can't run
// alongside the wake-word listener, so pause the latter while the assistant is active.
watch(
  () => assistant.isActive,
  (active) => {
    if (active) wakeWord.stop()
    else wakeWord.start()
  },
)

const route = useRoute()
const router = useRouter()
const viewStageRef = ref<HTMLElement | null>(null)

const isAlbum = computed(() => route.name === 'album')

function goToAlbum() {
  router.push({ name: 'album' })
}

function goToDashboard() {
  router.push({ name: 'dashboard' })
}

function toggleView() {
  if (isAlbum.value) goToDashboard()
  else goToAlbum()
}

// Vertical swipe switches between dashboard and album; horizontal swipes are left
// for the album view itself to navigate between photos.
useSwipe(viewStageRef, {
  onSwipeUp: () => {
    if (!assistant.isActive && !isAlbum.value) goToAlbum()
  },
  onSwipeDown: () => {
    if (!assistant.isActive && isAlbum.value) goToDashboard()
  },
})
</script>

<template>
  <div ref="viewStageRef" class="view-stage">
    <Transition name="view-fade">
      <AssistantView v-if="assistant.isActive" key="assistant" />
      <RouterView v-else key="dashboard" />
    </Transition>

    <button
      v-if="!assistant.isActive"
      type="button"
      class="view-switch"
      :class="{ 'view-switch--album': isAlbum }"
      :aria-label="isAlbum ? 'Switch to dashboard' : 'Switch to photo album'"
      @click="toggleView"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
        <path d="M6 15l6-6 6 6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.view-stage {
  position: relative;
  width: 100%;
  height: 100%;
}

.view-fade-enter-active,
.view-fade-leave-active {
  position: absolute;
  inset: 0;
  transition:
    opacity 480ms ease,
    transform 480ms ease;
}

.view-fade-enter-from {
  opacity: 0;
  transform: scale(1.03);
}

.view-fade-leave-to {
  opacity: 0;
  transform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .view-fade-enter-active,
  .view-fade-leave-active {
    transition: opacity 200ms ease;
  }

  .view-fade-enter-from,
  .view-fade-leave-to {
    transform: none;
  }
}

.view-switch {
  position: absolute;
  z-index: 2;
  left: 50%;
  bottom: clamp(0.6rem, 1.6vw, 1.1rem);
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(2.4rem, 4vw, 3rem);
  height: clamp(1.5rem, 2.4vw, 1.9rem);
  padding: 0;
  border: 1px solid var(--color-glass-border);
  border-radius: 999px;
  background: var(--color-glass-bg);
  backdrop-filter: blur(var(--blur-glass)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--blur-glass)) saturate(140%);
  color: var(--color-text-tertiary);
  opacity: 0.55;
  cursor: pointer;
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.view-switch:hover,
.view-switch:focus-visible {
  opacity: 1;
}

.view-switch svg {
  width: 55%;
  height: 55%;
}

.view-switch--album {
  top: clamp(0.6rem, 1.6vw, 1.1rem);
  bottom: auto;
  transform: translateX(-50%) rotate(180deg);
}
</style>
