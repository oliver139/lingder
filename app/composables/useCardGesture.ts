import type { ShallowRef } from 'vue'
import type { Rating } from '../types/study'

export function useCardGesture(target: Readonly<ShallowRef<HTMLElement | null>>, rate: (rating: Rating) => void, disabled: () => boolean = () => false) {
  const offset = shallowRef({ x: 0, y: 0 })
  const dragging = shallowRef(false)
  const moved = shallowRef(false)
  let pointer: number | null = null
  let start = { x: 0, y: 0 }

  function cancel() {
    pointer = null
    dragging.value = false
    offset.value = { x: 0, y: 0 }
  }

  // Firefox can drag a page-wide selection even from a user-select:none card.
  // Native drag would cancel our pointer gesture before pointerup arrives.
  useEventListener(target, 'dragstart', event => event.preventDefault())

  useEventListener(target, 'pointerdown', (event) => {
    if ((event.target instanceof Element && event.target.closest('button, a, input, select, textarea')) || disabled() || !event.isPrimary || event.button !== 0 || pointer !== null) {
      return
    }
    pointer = event.pointerId
    start = { x: event.clientX, y: event.clientY }
    moved.value = false
    dragging.value = true
    target.value?.setPointerCapture(event.pointerId)
  })
  useEventListener(target, 'pointermove', (event) => {
    if (event.pointerId !== pointer) {
      return
    }
    offset.value = { x: event.clientX - start.x, y: event.clientY - start.y }
    if (Math.hypot(offset.value.x, offset.value.y) > 8) {
      moved.value = true
    }
  })
  useEventListener(target, 'pointerup', (event) => {
    if (event.pointerId !== pointer) {
      return
    }
    const x = event.clientX - start.x
    const y = event.clientY - start.y
    const distance = Math.max(Math.abs(x), Math.abs(y))
    pointer = null
    dragging.value = false
    if (distance >= 70) {
      offset.value = { x, y }
      moved.value = true
      rate(Math.abs(x) >= Math.abs(y) ? 'review' : 'mastered')
    } else {
      cancel()
    }
  })
  useEventListener(target, ['pointercancel', 'lostpointercapture'], (event) => {
    if (event.pointerId === pointer) {
      moved.value = true
      cancel()
    }
  })
  return { offset, dragging, moved, cancel }
}
