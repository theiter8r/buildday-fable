/**
 * Formatting helpers for the timeline and duration fields. Pure string
 * functions, no locale/timezone surprises beyond `Intl` defaults.
 *
 * STUB — owned by Lane A (domain). Throws until implemented.
 */

/** Formats a simulated offset in ms as `+1.40s` (mono, tabular-nums in the UI). */
export function formatOffset(_ms: number): string {
  throw new Error('not implemented')
}

/** Formats `new Date(baseWallClockMs + offsetMs)` as a short clock time, e.g. `19:42:03`. */
export function formatClock(_baseWallClockMs: number, _offsetMs: number): string {
  throw new Error('not implemented')
}

/** Formats a duration in ms as a human string, e.g. `4.3s`, `900ms`, `1m 12s`. */
export function formatDuration(_ms: number): string {
  throw new Error('not implemented')
}
