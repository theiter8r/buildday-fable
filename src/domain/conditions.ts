/**
 * The condition evaluator: resolves a dot-path against the incident payload
 * and applies one of the nine `Operator`s (see ARCHITECTURE.md §5 for the
 * full coercion table). Used by both `simulator.ts` (Condition nodes) and
 * `validation.ts`; the Trigger form's filters reuse the same operator
 * semantics via this module.
 */
import type { ConditionConfig, IncidentPayload, Operator } from './types'

/** Resolves a dot path (numeric segments index arrays) against `obj`; missing -> `undefined`, never throws. */
export function getByPath(obj: unknown, path: string): unknown {
  if (path === '') return undefined
  const segments = path.split('.')
  let current: unknown = obj
  for (const segment of segments) {
    if (current === null || current === undefined) return undefined
    if (typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

/** Coerces `x` to a number per the rules in ARCHITECTURE.md §5 (`''` -> `NaN`, booleans -> `1`/`0`). */
export function toNumber(x: unknown): number {
  if (typeof x === 'number') return x
  if (typeof x === 'string') {
    const trimmed = x.trim()
    return trimmed === '' ? NaN : Number(trimmed)
  }
  if (typeof x === 'boolean') return x ? 1 : 0
  return NaN
}

/** Trims and lowercases a string for the friendly case-insensitive comparisons ARCHITECTURE.md §5 mandates. */
function normalizeString(x: unknown): string {
  if (typeof x === 'boolean') return x ? 'true' : 'false'
  return String(x).trim().toLowerCase()
}

/** Human label for an operator, per CONTENT.md §3 inspector copy, used in explanations. */
const OPERATOR_LABELS: Record<Operator, string> = {
  equals: 'equals',
  'not-equals': 'not equals',
  gt: 'greater than',
  gte: 'at least',
  lt: 'less than',
  lte: 'at most',
  contains: 'contains',
  in: 'is one of',
  exists: 'exists',
}

/** True when `left` (after coercion per operator) satisfies the operator against `value`. */
function applyOperator(operator: Operator, left: unknown, value: string): boolean {
  switch (operator) {
    case 'equals':
    case 'not-equals': {
      let isEqual: boolean
      if (typeof left === 'number') {
        isEqual = left === Number(value)
      } else if (typeof left === 'boolean') {
        isEqual = normalizeString(left) === normalizeString(value)
      } else {
        isEqual = normalizeString(left) === normalizeString(value)
      }
      return operator === 'equals' ? isEqual : !isEqual
    }
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      const leftNum = toNumber(left)
      const rightNum = toNumber(value)
      if (Number.isNaN(leftNum) || Number.isNaN(rightNum)) return false
      if (operator === 'gt') return leftNum > rightNum
      if (operator === 'gte') return leftNum >= rightNum
      if (operator === 'lt') return leftNum < rightNum
      return leftNum <= rightNum
    }
    case 'contains': {
      if (typeof left === 'string') {
        return left.toLowerCase().includes(normalizeString(value))
      }
      if (Array.isArray(left)) {
        return left.some((item) => normalizeString(item) === normalizeString(value))
      }
      return false
    }
    case 'in': {
      const options = value.split(',').map((option) => normalizeString(option))
      return options.includes(normalizeString(left))
    }
    case 'exists': {
      return left !== undefined && left !== null && left !== ''
    }
  }
}

/** The result of evaluating a single condition against a payload. */
export interface ConditionEvaluation {
  result: boolean
  /** Human-readable rendering, e.g. "severity equals critical → true". */
  explanation: string
}

/** Renders a condition as a short human phrase, e.g. "severity equals critical", without evaluating it. */
export function describeCondition(cfg: ConditionConfig): string {
  const operatorLabel = OPERATOR_LABELS[cfg.operator]
  if (cfg.operator === 'exists') {
    return `${cfg.field} ${operatorLabel}`
  }
  return `${cfg.field} ${operatorLabel} ${cfg.value}`
}

/**
 * Evaluates `cfg` against `payload`, returning both the boolean result and
 * its explanation, built from the `run.timeline.conditionEvaluated` template
 * in CONTENT.md §6: "{field} {operator} {value} → {result}".
 */
export function evaluateCondition(
  cfg: ConditionConfig,
  payload: IncidentPayload,
): ConditionEvaluation {
  const left = getByPath(payload, cfg.field)
  const result = applyOperator(cfg.operator, left, cfg.value)
  const explanation = `${describeCondition(cfg)} → ${result}`
  return { result, explanation }
}
