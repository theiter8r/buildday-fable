/**
 * Whether the e2e test flag is active (ARCHITECTURE.md §11,
 * `docs/testing-conventions.md`). Pulled out of `testHandle.ts` into its own
 * tiny, side-effect-free module so `workflowStore.ts` can read it too (e.g.
 * to default `speed` to `'instant'` under `?e2e=1`) without an import cycle
 * between the store module and the test-handle module.
 */

/** True when the URL has an `e2e` search param (`/?e2e=1`) or `import.meta.env.DEV` is true. Safe with no `window`. */
export function isE2eEnabled(): boolean {
  if (typeof window === 'undefined') return false
  const hasSearchFlag = new URLSearchParams(window.location.search).has('e2e')
  const isDev = Boolean(import.meta.env.DEV)
  return hasSearchFlag || isDev
}
