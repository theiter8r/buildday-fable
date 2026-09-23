import { useSyncExternalStore } from 'react'

function hasMatchMedia(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
}

/**
 * SSR-safe `matchMedia` subscription (ARCHITECTURE.md §2). Also degrades
 * gracefully (always `false`) in test environments that don't implement
 * `matchMedia` at all, rather than throwing.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (!hasMatchMedia()) return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => (hasMatchMedia() ? window.matchMedia(query).matches : false),
    () => false,
  )
}

/** True below the 1024px desktop breakpoint (ARCHITECTURE.md §10). */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 1023px)')
}
