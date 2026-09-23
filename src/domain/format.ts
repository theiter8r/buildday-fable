/**
 * Formatting helpers for the timeline and duration fields. Pure string
 * functions, no locale/timezone surprises beyond `Intl` defaults.
 *
 * `run.timeline.timestampFormat` (CONTENT.md §6): relative to run start,
 * formatted as `+0.0s` (one decimal place); switch to `+m:ss` once the run
 * passes 60 seconds.
 */

/** Formats a simulated offset in ms as `+1.40s`-style relative timestamp (see CONTENT.md §6). */
export function formatOffset(ms: number): string {
  const sign = ms < 0 ? '-' : '+'
  const abs = Math.abs(ms)
  if (abs < 60_000) {
    const seconds = abs / 1000
    return `${sign}${seconds.toFixed(1)}s`
  }
  const totalSeconds = Math.floor(abs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${sign}${minutes}:${String(seconds).padStart(2, '0')}`
}

/** Formats `new Date(baseWallClockMs + offsetMs)` as a short clock time, e.g. `19:42:03`. */
export function formatClock(baseWallClockMs: number, offsetMs: number): string {
  const date = new Date(baseWallClockMs + offsetMs)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/** Formats a duration in ms as a human string, e.g. `4.3s`, `900ms`, `1m 12s`. */
export function formatDuration(ms: number): string {
  const abs = Math.abs(ms)
  const sign = ms < 0 ? '-' : ''
  if (abs < 1000) {
    return `${sign}${Math.round(abs)}ms`
  }
  if (abs < 60_000) {
    const seconds = abs / 1000
    // Trim a trailing `.0` so exact seconds read as `4s`, not `4.0s`.
    const rounded = Math.round(seconds * 10) / 10
    return `${sign}${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}s`
  }
  const totalSeconds = Math.round(abs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${sign}${minutes}m ${seconds}s`
}
