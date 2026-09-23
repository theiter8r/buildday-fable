/**
 * The demo incident payload paired with `demoWorkflow.ts`'s "Critical API
 * Incident" graph: severity `critical` so the demo, run unmodified, takes
 * the true branch all the way to a resolved rollback.
 */
import type { IncidentPayload } from './types'

/** Builds a fresh demo payload object (new `detectedAt` each call). */
export function createDemoPayload(): IncidentPayload {
  return {
    title: 'Elevated 5xx rate on api-gateway',
    severity: 'critical',
    service: 'api-gateway',
    errorRate: 0.42,
    region: 'us-east-1',
    affectedUsers: 18400,
    source: 'datadog',
    tags: ['api', 'checkout', 'p1'],
    detectedAt: new Date().toISOString(),
    metadata: {
      cluster: 'prod-use1-a',
      deploy: 'api-gateway-v482',
      onCallEscalated: false,
    },
  }
}

/**
 * A stable snapshot of `createDemoPayload()`, for callers (tests, the
 * task-brief-facing barrel) that want a constant rather than a factory. Not
 * used for the live payload editor default — that always calls
 * `createDemoPayload()` so `detectedAt` reflects "now".
 */
export const DEFAULT_PAYLOAD: IncidentPayload = createDemoPayload()
