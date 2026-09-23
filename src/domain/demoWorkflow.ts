/**
 * The prebuilt "Critical API Incident" demo workflow (ARCHITECTURE.md
 * product brief): a Trigger feeding a severity Condition, branching to a
 * paged + approved rollback on `true` and a quieter ticket/Slack path on
 * `false`.
 *
 * DECISION: node/edge ids are fixed, human-readable strings (`demo-trigger`,
 * `demo-condition`, ...) rather than random UUIDs. ARCHITECTURE.md §2 calls
 * for "fixed ids/positions" so Playwright specs and unit tests can address
 * demo nodes by a stable selector (`node-demo-trigger`) instead of
 * re-deriving an id from a freshly-generated document.
 */
import { SCHEMA_VERSION } from './constants'
import type { WorkflowDocument, WorkflowEdge, WorkflowNode } from './types'

const TRUE_BRANCH_Y = 80
const FALSE_BRANCH_Y = 440
const CONVERGE_X = [40, 300, 580, 860, 1140, 1420]

function node<T extends WorkflowNode>(n: T): T {
  return n
}

/** Builds a fresh "Critical API Incident" workflow document. */
export function createDemoWorkflow(): WorkflowDocument {
  const nodes: WorkflowNode[] = [
    node({
      id: 'demo-trigger',
      type: 'trigger',
      label: 'Incident trigger',
      position: { x: CONVERGE_X[0], y: 260 },
      config: {
        source: 'datadog',
        filters: [
          {
            id: 'demo-filter-service',
            field: 'service',
            operator: 'equals',
            value: 'api-gateway',
          },
        ],
        description: 'Any Datadog alert on the api-gateway service.',
      },
    }),
    node({
      id: 'demo-condition',
      type: 'condition',
      label: 'Severity check',
      position: { x: CONVERGE_X[1], y: 260 },
      config: {
        field: 'severity',
        operator: 'equals',
        value: 'critical',
      },
    }),
    // --- true branch: page -> approve -> rollback -> resolved -------------
    node({
      id: 'demo-page-oncall',
      type: 'action',
      label: 'Page on-call',
      position: { x: CONVERGE_X[2], y: TRUE_BRANCH_Y },
      config: {
        action: 'page-oncall',
        target: 'sre-primary',
        durationMs: 900,
        simulateFailure: false,
        continueOnFailure: false,
      },
    }),
    node({
      id: 'demo-approval-rollback',
      type: 'approval',
      label: 'Approve rollback',
      position: { x: CONVERGE_X[3], y: TRUE_BRANCH_Y },
      config: {
        approverRole: 'incident-commander',
        timeoutMs: 300000,
        policy: 'auto-approve',
        prompt: 'Roll back api-gateway-v482 to the previous stable version?',
      },
    }),
    node({
      id: 'demo-rollback-deploy',
      type: 'action',
      label: 'Rollback deploy',
      position: { x: CONVERGE_X[4], y: TRUE_BRANCH_Y },
      config: {
        action: 'rollback-deploy',
        target: 'api-gateway',
        durationMs: 4300,
        simulateFailure: false,
        continueOnFailure: false,
      },
    }),
    node({
      id: 'demo-resolution-resolved',
      type: 'resolution',
      label: 'Resolved',
      position: { x: CONVERGE_X[5], y: TRUE_BRANCH_Y },
      config: {
        status: 'resolved',
        postmortemRequired: true,
        summary: 'Rolled back api-gateway-v482; error rate returned to baseline.',
      },
    }),
    // --- false branch: ticket -> slack -> mitigated ------------------------
    node({
      id: 'demo-create-ticket',
      type: 'action',
      label: 'Create ticket',
      position: { x: CONVERGE_X[2], y: FALSE_BRANCH_Y },
      config: {
        action: 'create-ticket',
        target: 'jira:OPS',
        durationMs: 600,
        simulateFailure: false,
        continueOnFailure: true,
      },
    }),
    node({
      id: 'demo-post-slack',
      type: 'action',
      label: 'Post to Slack',
      position: { x: CONVERGE_X[3], y: FALSE_BRANCH_Y },
      config: {
        action: 'post-slack',
        target: '#incidents',
        durationMs: 400,
        simulateFailure: false,
        continueOnFailure: true,
      },
    }),
    node({
      id: 'demo-resolution-mitigated',
      type: 'resolution',
      label: 'Mitigated',
      position: { x: CONVERGE_X[4], y: FALSE_BRANCH_Y },
      config: {
        status: 'mitigated',
        postmortemRequired: false,
        summary: 'Non-critical incident tracked and communicated; no rollback needed.',
      },
    }),
  ]

  const edges: WorkflowEdge[] = [
    edge('demo-edge-trigger-condition', 'demo-trigger', 'demo-condition'),
    edge('demo-edge-true-page', 'demo-condition', 'demo-page-oncall', 'true'),
    edge('demo-edge-page-approval', 'demo-page-oncall', 'demo-approval-rollback'),
    edge('demo-edge-approval-rollback', 'demo-approval-rollback', 'demo-rollback-deploy'),
    edge('demo-edge-rollback-resolved', 'demo-rollback-deploy', 'demo-resolution-resolved'),
    edge('demo-edge-false-ticket', 'demo-condition', 'demo-create-ticket', 'false'),
    edge('demo-edge-ticket-slack', 'demo-create-ticket', 'demo-post-slack'),
    edge('demo-edge-slack-mitigated', 'demo-post-slack', 'demo-resolution-mitigated'),
  ]

  return {
    schemaVersion: SCHEMA_VERSION,
    id: 'demo-critical-api-incident',
    name: 'Critical API Incident',
    nodes,
    edges,
    updatedAt: new Date().toISOString(),
  }
}

function edge(
  id: string,
  source: string,
  target: string,
  sourceHandle?: 'true' | 'false',
): WorkflowEdge {
  return { id, source, target, sourceHandle: sourceHandle ?? null }
}
