<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useSwipe } from '@/composables/useSwipe'
import { SLIDESHOW_DELETE_CONFIRM_MS, SLIDESHOW_INTERVAL_MS } from '@/config/constants'
import { usePhotoStore } from '@/stores/photos'

const store = usePhotoStore()
const photos = computed(() => store.photos)

const rootRef = ref<HTMLElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const currentIndex = ref(0)
const currentPhoto = computed(() => photos.value[currentIndex.value] ?? null)

function next() {
  if (photos.value.length === 0) return
  currentIndex.value = (currentIndex.value + 1) % photos.value.length
}

function prev() {
  if (photos.value.length === 0) return
  currentIndex.value = (currentIndex.value - 1 + photos.value.length) % photos.value.length
}

let autoAdvanceTimer: ReturnType<typeof setTimeout> | undefined

function scheduleAutoAdvance() {
  clearTimeout(autoAdvanceTimer)
  if (photos.value.length < 2) return
  autoAdvanceTimer = setTimeout(next, SLIDESHOW_INTERVAL_MS)
}

watch(currentIndex, scheduleAutoAdvance)
watch(
  () => photos.value.length,
  (length) => {
    if (length === 0) currentIndex.value = 0
    else if (currentIndex.value >= length) currentIndex.value = length - 1
    scheduleAutoAdvance()
  },
)

useSwipe(rootRef, { onSwipeLeft: next, onSwipeRight: prev })

onMounted(() => {
  store.init()
  scheduleAutoAdvance()
})

onBeforeUnmount(() => clearTimeout(autoAdvanceTimer))

function openFilePicker() {
  fileInputRef.value?.click()
}

async function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    await store.addFiles(input.files)
  }
  input.value = ''
}

const pendingDeleteId = ref<string | null>(null)
let pendingDeleteTimer: ReturnType<typeof setTimeout> | undefined

function requestDelete(id: string) {
  if (pendingDeleteId.value === id) {
    clearTimeout(pendingDeleteTimer)
    pendingDeleteId.value = null
    void store.removePhoto(id)
    return
  }
  pendingDeleteId.value = id
  clearTimeout(pendingDeleteTimer)
  pendingDeleteTimer = setTimeout(() => {
    pendingDeleteId.value = null
  }, SLIDESHOW_DELETE_CONFIRM_MS)
}

onBeforeUnmount(() => clearTimeout(pendingDeleteTimer))
</script>

<template>
  <div ref="rootRef" class="slideshow">
    <template v-if="currentPhoto">
      <Transition name="photo-fade" mode="out-in">
        <img :key="currentPhoto.id" :src="currentPhoto.url" class="slideshow__image" alt="" />
      </Transition>

      <div class="slideshow__scrim" aria-hidden="true" />

      <div class="slideshow__toolbar">
        <p class="slideshow__count">{{ currentIndex + 1 }} / {{ photos.length }}</p>
        <button
          type="button"
          class="slideshow__btn slideshow__btn--danger"
          :class="{ 'slideshow__btn--confirm': pendingDeleteId === currentPhoto.id }"
          @click="requestDelete(currentPhoto.id)"
        >
          <span v-if="pendingDeleteId === currentPhoto.id">Remove?</span>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
            <path d="M4 7h16" stroke-linecap="round" />
            <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke-linecap="round" stroke-linejoin="round" />
            <path
              d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </template>

    <div v-else class="slideshow__empty">
      <p class="slideshow__empty-title">No photos yet</p>
      <p class="slideshow__empty-hint">Add pictures to start the slideshow</p>
    </div>

    <button type="button" class="slideshow__btn slideshow__add-btn" @click="openFilePicker">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
        <path d="M12 5v14M5 12h14" stroke-linecap="round" />
      </svg>
    </button>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      multiple
      class="slideshow__file-input"
      @change="onFilesSelected"
    />
  </div>
</template>

<style scoped>
.slideshow {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
  border-radius: var(--radius-card);
  background: var(--color-glass-bg);
}

.slideshow__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-fade-enter-active,
.photo-fade-leave-active {
  transition: opacity 640ms ease;
}

.photo-fade-enter-from,
.photo-fade-leave-to {
  opacity: 0;
}

.slideshow__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, transparent 18%, transparent 82%, rgba(0, 0, 0, 0.4) 100%);
  pointer-events: none;
}

.slideshow__toolbar {
  position: absolute;
  top: clamp(1rem, 2.5vw, 1.75rem);
  left: clamp(1rem, 2.5vw, 1.75rem);
  right: clamp(1rem, 2.5vw, 1.75rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.slideshow__count {
  margin: 0;
  padding: 0.4em 0.9em;
  border-radius: 999px;
  background: var(--color-glass-bg);
  border: 1px solid var(--color-glass-border);
  backdrop-filter: blur(var(--blur-glass)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--blur-glass)) saturate(140%);
  font-size: clamp(0.8rem, 1.1vw, 0.95rem);
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.slideshow__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4em;
  height: clamp(2.4rem, 4vw, 3rem);
  min-width: clamp(2.4rem, 4vw, 3rem);
  padding: 0 0.9em;
  border: 1px solid var(--color-glass-border);
  border-radius: 999px;
  background: var(--color-glass-bg);
  backdrop-filter: blur(var(--blur-glass)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--blur-glass)) saturate(140%);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: clamp(0.8rem, 1.1vw, 0.95rem);
  cursor: pointer;
}

.slideshow__btn svg {
  width: clamp(1.1rem, 1.8vw, 1.4rem);
  height: clamp(1.1rem, 1.8vw, 1.4rem);
}

.slideshow__btn--danger {
  color: var(--color-text-secondary);
}

.slideshow__btn--confirm {
  color: var(--color-warning);
  border-color: var(--color-warning);
}

.slideshow__add-btn {
  position: absolute;
  bottom: clamp(1rem, 2.5vw, 1.75rem);
  right: clamp(1rem, 2.5vw, 1.75rem);
  color: var(--color-accent);
}

.slideshow__file-input {
  display: none;
}

.slideshow__empty {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4em;
  text-align: center;
}

.slideshow__empty-title {
  margin: 0;
  font-size: clamp(1.4rem, 2.6vw, 2rem);
  font-weight: 600;
  color: var(--color-text-primary);
}

.slideshow__empty-hint {
  margin: 0;
  font-size: clamp(0.9rem, 1.2vw, 1.05rem);
  color: var(--color-text-secondary);
}

@media (prefers-reduced-motion: reduce) {
  .photo-fade-enter-active,
  .photo-fade-leave-active {
    transition: opacity 200ms ease;
  }
}
</style>
