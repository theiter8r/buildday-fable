import { describe, expect, it } from 'vitest'
import { describeCondition, evaluateCondition, getByPath, toNumber } from '../conditions'
import type { ConditionConfig, IncidentPayload } from '../types'

function payload(overrides: Partial<IncidentPayload> = {}): IncidentPayload {
  return {
    title: 'Checkout API returning 5xx errors',
    severity: 'critical',
    service: 'checkout-api',
    errorRate: 0.42,
    region: 'us-east-1',
    affectedUsers: 18_400,
    source: 'pagerduty',
    tags: ['prod', 'checkout'],
    detectedAt: '2026-09-23T00:00:00.000Z',
    metadata: { cluster: 'us-east-1a', retries: 3, degraded: true },
    ...overrides,
  }
}

function cond(field: string, operator: ConditionConfig['operator'], value: string): ConditionConfig {
  return { field, operator, value }
}

describe('getByPath', () => {
  it('resolves top-level and nested fields', () => {
    const p = payload()
    expect(getByPath(p, 'severity')).toBe('critical')
    expect(getByPath(p, 'metadata.cluster')).toBe('us-east-1a')
  })

  it('indexes arrays with numeric segments', () => {
    const p = payload()
    expect(getByPath(p, 'tags.0')).toBe('prod')
    expect(getByPath(p, 'tags.1')).toBe('checkout')
  })

  it('never throws on a missing intermediate, returning undefined', () => {
    const p = payload()
    expect(getByPath(p, 'metadata.nope.deeper')).toBeUndefined()
    expect(getByPath(p, 'nope')).toBeUndefined()
    expect(getByPath(null, 'a.b')).toBeUndefined()
    expect(getByPath(undefined, 'a')).toBeUndefined()
  })

  it('returns undefined for an empty path', () => {
    expect(getByPath(payload(), '')).toBeUndefined()
  })
})

describe('toNumber', () => {
  it('coerces per the documented rules', () => {
    expect(toNumber(42)).toBe(42)
    expect(toNumber('42')).toBe(42)
    expect(toNumber('  42  ')).toBe(42)
    expect(toNumber('')).toBeNaN()
    expect(toNumber(true)).toBe(1)
    expect(toNumber(false)).toBe(0)
    expect(toNumber(null)).toBeNaN()
    expect(toNumber(undefined)).toBeNaN()
    expect(toNumber({})).toBeNaN()
  })
})

describe('evaluateCondition operator matrix', () => {
  const p = payload()

  it('equals: number left coerces the value', () => {
    expect(evaluateCondition(cond('affectedUsers', 'equals', '18400'), p).result).toBe(true)
    expect(evaluateCondition(cond('affectedUsers', 'equals', '1'), p).result).toBe(false)
  })

  it('equals: string left is trimmed and case-insensitive', () => {
    expect(evaluateCondition(cond('severity', 'equals', 'Critical'), p).result).toBe(true)
    expect(evaluateCondition(cond('severity', 'equals', '  critical  '), p).result).toBe(true)
    expect(evaluateCondition(cond('severity', 'equals', 'low'), p).result).toBe(false)
  })

  it('equals: boolean left compares against "true"/"false"', () => {
    expect(evaluateCondition(cond('metadata.degraded', 'equals', 'true'), p).result).toBe(true)
    expect(evaluateCondition(cond('metadata.degraded', 'equals', 'false'), p).result).toBe(false)
  })

  it('not-equals inverts equals', () => {
    expect(evaluateCondition(cond('severity', 'not-equals', 'low'), p).result).toBe(true)
    expect(evaluateCondition(cond('severity', 'not-equals', 'critical'), p).result).toBe(false)
  })

  it('numeric comparisons gt/gte/lt/lte', () => {
    expect(evaluateCondition(cond('errorRate', 'gt', '0.4'), p).result).toBe(true)
    expect(evaluateCondition(cond('errorRate', 'gt', '0.42'), p).result).toBe(false)
    expect(evaluateCondition(cond('errorRate', 'gte', '0.42'), p).result).toBe(true)
    expect(evaluateCondition(cond('errorRate', 'lt', '0.5'), p).result).toBe(true)
    expect(evaluateCondition(cond('errorRate', 'lte', '0.42'), p).result).toBe(true)
  })

  it('numeric comparisons are false when either side is NaN', () => {
    expect(evaluateCondition(cond('service', 'gt', '1'), p).result).toBe(false)
    expect(evaluateCondition(cond('errorRate', 'gt', 'not-a-number'), p).result).toBe(false)
    expect(evaluateCondition(cond('missing.path', 'gte', '1'), p).result).toBe(false)
  })

  it('contains on a string is case-insensitive substring', () => {
    expect(evaluateCondition(cond('title', 'contains', '5xx'), p).result).toBe(true)
    expect(evaluateCondition(cond('title', 'contains', 'CHECKOUT'), p).result).toBe(true)
    expect(evaluateCondition(cond('title', 'contains', 'nope'), p).result).toBe(false)
  })

  it('contains on an array checks membership', () => {
    expect(evaluateCondition(cond('tags', 'contains', 'prod'), p).result).toBe(true)
    expect(evaluateCondition(cond('tags', 'contains', 'staging'), p).result).toBe(false)
  })

  it('contains is false for non-string, non-array left values', () => {
    expect(evaluateCondition(cond('affectedUsers', 'contains', '1'), p).result).toBe(false)
  })

  it('in splits the value on commas, trimmed and case-insensitive', () => {
    expect(evaluateCondition(cond('severity', 'in', 'high, critical'), p).result).toBe(true)
    expect(evaluateCondition(cond('severity', 'in', 'low,medium'), p).result).toBe(false)
  })

  it('exists is true only for present, non-null, non-empty values', () => {
    expect(evaluateCondition(cond('severity', 'exists', ''), p).result).toBe(true)
    expect(evaluateCondition(cond('nope', 'exists', ''), p).result).toBe(false)
    expect(evaluateCondition(cond('metadata.missing', 'exists', ''), p).result).toBe(false)
  })

  it('comparing against a missing path is always false (except exists)', () => {
    expect(evaluateCondition(cond('nope', 'equals', 'x'), p).result).toBe(false)
    expect(evaluateCondition(cond('nope', 'contains', 'x'), p).result).toBe(false)
    expect(evaluateCondition(cond('nope', 'in', 'x,y'), p).result).toBe(false)
  })

  it('always returns a real boolean, never an implicit-truthy value', () => {
    const { result } = evaluateCondition(cond('metadata.degraded', 'equals', 'true'), p)
    expect(result).toBe(true)
    expect(typeof result).toBe('boolean')
  })
})

describe('describeCondition / explanation strings', () => {
  it('renders "field operator value" for value-bearing operators', () => {
    expect(describeCondition(cond('severity', 'equals', 'critical'))).toBe(
      'severity equals critical',
    )
    expect(describeCondition(cond('errorRate', 'gte', '0.4'))).toBe('errorRate at least 0.4')
  })

  it('omits the value for exists', () => {
    expect(describeCondition(cond('severity', 'exists', ''))).toBe('severity exists')
  })

  it('evaluateCondition explanation follows the timeline template "{field} {operator} {value} → {result}"', () => {
    const p = payload()
    expect(evaluateCondition(cond('severity', 'equals', 'critical'), p).explanation).toBe(
      'severity equals critical → true',
    )
    expect(evaluateCondition(cond('severity', 'equals', 'low'), p).explanation).toBe(
      'severity equals low → false',
    )
  })
})
