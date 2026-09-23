import { useMediaQuery } from './useMediaQuery'

/** `prefers-reduced-motion: reduce` listener feeding motion tokens (ARCHITECTURE.md §2, DESIGN.md §6). */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
