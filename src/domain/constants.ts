/**
 * Cross-domain constants. Anything that would otherwise be a magic number or
 * a repeated string literal across `domain/**`, `store/**` and the UI lanes
 * belongs here so there is exactly one place to change it.
 */

/**
 * Bumped whenever `WorkflowDocument`'s shape changes in a way that requires
 * a migrator entry in `migrations.ts`. See ARCHITECTURE.md §8.
 */
export const SCHEMA_VERSION = 2 as const

/** localStorage keys, versioned independently per concern. */
export const STORAGE_KEYS = {
  document: 'opsflow:document:v2',
  payload: 'opsflow:payload:v2',
  ui: 'opsflow:ui:v1',
} as const

/** Cap on the undo/redo stack depth (oldest entries are dropped FIFO). */
export const HISTORY_CAP = 100

/** Debounce window, in ms, for coalescing config-field edits into one undo step. */
export const CONFIG_COALESCE_MS = 400

/** Debounce window, in ms, for the autosave-to-localStorage writer. */
export const AUTOSAVE_DEBOUNCE_MS = 600

/** Default hard stop against pathological/cyclic graphs inside `simulate()`. */
export const DEFAULT_MAX_STEPS = 500

/** Simulated durations (ms) for node kinds that are not independently configured. */
export const SIMULATED_STEP_MS = {
  trigger: 120,
  condition: 80,
  approvalAuto: 250,
  approvalManualDecided: 400,
  resolution: 200,
} as const
