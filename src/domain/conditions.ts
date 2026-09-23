/**
 * The condition evaluator: resolves a dot-path against the incident payload
 * and applies one of the nine `Operator`s (see ARCHITECTURE.md §5 for the
 * full coercion table). Used by both `simulator.ts` (Condition nodes) and
 * `validation.ts`/the Trigger form is not evaluated here — filters reuse
 * the same operator semantics via this module.
 *
 * STUB — owned by Lane A (domain). Every export below throws until
 * implemented.
 */
import type { ConditionConfig, IncidentPayload } from './types'

/** Resolves a dot path (numeric segments index arrays) against `obj`; missing -> `undefined`, never throws. */
export function getByPath(_obj: unknown, _path: string): unknown {
  throw new Error('not implemented')
}

/** Coerces `x` to a number per the rules in ARCHITECTURE.md §5 (`''` -> `NaN`, booleans -> `1`/`0`). */
export function toNumber(_x: unknown): number {
  throw new Error('not implemented')
}

/** The result of evaluating a single condition against a payload. */
export interface ConditionEvaluation {
  result: boolean
  /** Human-readable rendering, e.g. "severity equals critical". */
  explanation: string
}

/** Evaluates `cfg` against `payload`, returning both the boolean result and its explanation. */
export function evaluateCondition(
  _cfg: ConditionConfig,
  _payload: IncidentPayload,
): ConditionEvaluation {
  throw new Error('not implemented')
}

/** Renders a condition as a short human phrase, e.g. "severity equals critical", without evaluating it. */
export function describeCondition(_cfg: ConditionConfig): string {
  throw new Error('not implemented')
}
