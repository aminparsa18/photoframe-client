import { onBeforeUnmount, onMounted, type Ref } from 'vue'

import { SWIPE_THRESHOLD_PX } from '@/config/constants'

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

export function useSwipe(target: Ref<HTMLElement | null>, handlers: SwipeHandlers) {
  let startX = 0
  let startY = 0
  let tracking = false

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    if (!touch) return
    startX = touch.clientX
    startY = touch.clientY
    tracking = true
  }

  function onTouchEnd(event: TouchEvent) {
    if (!tracking) return
    tracking = false
    const touch = event.changedTouches[0]
    if (!touch) return

    const dx = touch.clientX - startX
    const dy = touch.clientY - startY

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return
      if (dx < 0) handlers.onSwipeLeft?.()
      else handlers.onSwipeRight?.()
    } else {
      if (Math.abs(dy) < SWIPE_THRESHOLD_PX) return
      if (dy < 0) handlers.onSwipeUp?.()
      else handlers.onSwipeDown?.()
    }
  }

  onMounted(() => {
    target.value?.addEventListener('touchstart', onTouchStart, { passive: true })
    target.value?.addEventListener('touchend', onTouchEnd, { passive: true })
  })

  onBeforeUnmount(() => {
    target.value?.removeEventListener('touchstart', onTouchStart)
    target.value?.removeEventListener('touchend', onTouchEnd)
  })
}
