/**
 * The three payload presets from CONTENT.md §5. Each builds a full
 * `IncidentPayload`; `detectedAt` is stamped at click time (`new
 * Date().toISOString()`) rather than baked in, same convention as
 * `createDemoPayload()`.
 */
import type { IncidentPayload } from '@/domain/types'
import { PAYLOAD_CONTENT } from './content'

export interface PayloadPreset {
  name: string
  build: () => IncidentPayload
}

export const PAYLOAD_PRESETS: readonly PayloadPreset[] = [
  {
    name: PAYLOAD_CONTENT.presets[0].name,
    build: () => ({
      title: 'Checkout API returning 5xx errors',
      severity: 'critical',
      service: 'checkout-api',
      errorRate: 0.425,
      region: 'us-east-1',
      affectedUsers: 18400,
      source: 'PagerDuty webhook',
      tags: ['checkout', 'p1'],
      detectedAt: new Date().toISOString(),
      metadata: {},
    }),
  },
  {
    name: PAYLOAD_CONTENT.presets[1].name,
    build: () => ({
      title: 'p95 latency above SLO in eu-west-1',
      severity: 'medium',
      service: 'checkout-api',
      errorRate: 0.031,
      region: 'eu-west-1',
      affectedUsers: 2200,
      source: 'Datadog monitor',
      tags: ['latency'],
      detectedAt: new Date().toISOString(),
      metadata: {},
    }),
  },
  {
    name: PAYLOAD_CONTENT.presets[2].name,
    build: () => ({
      title: 'Unusual traffic pattern on search endpoint',
      severity: 'low',
      service: 'search-api',
      errorRate: 0.004,
      region: 'ap-southeast-1',
      affectedUsers: 60,
      source: 'Synthetic check',
      tags: ['anomaly'],
      detectedAt: new Date().toISOString(),
      metadata: {},
    }),
  },
]
