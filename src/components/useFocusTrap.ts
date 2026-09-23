import { useCallback } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Returns a `keydown` handler that traps Tab/Shift+Tab inside `containerRef`.
 * Shared by `Dialog`, `BottomSheet` and `Drawer` so the trap logic (and its
 * unit test coverage) lives in exactly one place.
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>) {
  return useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const container = containerRef.current
      if (!container) return
      const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [containerRef],
  )
}
