/**
 * The simulator: a pure, synchronous, deterministic walk of the workflow
 * graph against an incident payload (ARCHITECTURE.md §4 has the full walk
 * algorithm, the "re-simulation with an accumulating decision map" pause
 * strategy for manual approvals, and the player's replay contract).
 *
 * No `Math.random`, no `Date.now`, no `setTimeout` anywhere in this file —
 * `at` on every emitted event is a simulated offset in ms from run start.
 *
 * STUB — owned by Lane A (domain). Throws until implemented.
 */
import type { IncidentPayload, NodeRunState, SimulateOptions, SimulationResult, WorkflowDocument } from './types'

export type { SimulateOptions, SimulationResult }

/**
 * Runs the full walk described in ARCHITECTURE.md §4 and returns a
 * `SimulationResult`. Calling this twice with identical arguments must
 * produce byte-identical `events` (determinism is asserted in
 * `simulator.test.ts` and relied on by the approval re-simulation flow).
 */
export function simulate(
  _doc: WorkflowDocument,
  _payload: IncidentPayload,
  _options?: SimulateOptions,
): SimulationResult {
  throw new Error('not implemented')
}

/**
 * Pure reducer: applies one `ExecutionEvent` to a `nodeStates` map, returning
 * a new map. Shared between `simulate()` (to build `finalNodeStates`) and
 * the run store's player (to derive live state as events are replayed), so
 * the UI and the domain can never disagree about what a state transition
 * means.
 */
export function applyEventToStates(
  _states: Record<string, NodeRunState>,
  _event: SimulationResult['events'][number],
): Record<string, NodeRunState> {
  throw new Error('not implemented')
}
