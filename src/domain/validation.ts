/**
 * `validateWorkflow` runs on every document change and produces the single
 * source of issues rendered by the Issue panel, node badges and the Run
 * button's disabled reason (ARCHITECTURE.md §6 has the full code table and
 * message copy — implemented against that table exactly, including the
 * `id` stability contract below; wording draws on the matching entries in
 * CONTENT.md §4 where a CONTENT.md code maps onto one of these).
 */
import {
  findCycles,
  incomers,
  outgoers,
  outgoersByHandle,
  reachableFromTrigger,
} from './graph'
import type {
  IssueSeverity,
  ValidationCode,
  ValidationIssue,
  WorkflowDocument,
  WorkflowEdge,
  WorkflowNode,
} from './types'

interface RawIssue {
  severity: IssueSeverity
  code: ValidationCode
  message: string
  nodeId?: string
  edgeId?: string
  field?: string
  /** Extra uniqueness suffix folded into the stable id (e.g. a filter index). */
  idSuffix?: string
}

/**
 * Returns every validation issue for `doc`. Errors (see `IssueSeverity`)
 * block Run; warnings do not. Each issue's `id` is stable across calls for
 * an unchanged underlying problem so the panel and any animation keyed on
 * it doesn't thrash, and the returned list is ordered errors-first, then by
 * the position of the node (or the source node of the edge) the issue
 * anchors to, graph-level issues sorting first within their severity.
 */
export function validateWorkflow(doc: WorkflowDocument): ValidationIssue[] {
  const raw: RawIssue[] = []

  if (doc.nodes.length === 0) {
    raw.push({
      severity: 'error',
      code: 'EMPTY_WORKFLOW',
      message: 'This workflow is empty. Add a Trigger to begin.',
    })
    return finalize(raw, doc)
  }

  const triggers = doc.nodes.filter((node) => node.type === 'trigger')

  if (triggers.length === 0) {
    raw.push({
      severity: 'error',
      code: 'NO_TRIGGER',
      message: 'Add a Trigger node — every workflow needs exactly one entry point.',
    })
  } else if (triggers.length > 1) {
    for (const extra of triggers.slice(1)) {
      raw.push({
        severity: 'error',
        code: 'MULTIPLE_TRIGGERS',
        message: 'Only one Trigger is allowed. Remove the extra trigger.',
        nodeId: extra.id,
      })
    }
  }

  for (const trigger of triggers) {
    for (const edge of incomers(doc, trigger.id)) {
      raw.push({
        severity: 'error',
        code: 'TRIGGER_HAS_INPUT',
        message: "A Trigger can't have an incoming connection.",
        edgeId: edge.id,
      })
    }
  }

  const hasResolution = doc.nodes.some((node) => node.type === 'resolution')
  if (!hasResolution) {
    raw.push({
      severity: 'error',
      code: 'NO_RESOLUTION',
      message: 'Add a Resolution node so the workflow can end.',
    })
  }

  const disconnected = findDisconnectedNodeIds(doc)
  for (const node of doc.nodes) {
    if (disconnected.has(node.id)) {
      raw.push({
        severity: 'error',
        code: 'DISCONNECTED_NODE',
        message: `${node.label} isn't connected to anything.`,
        nodeId: node.id,
      })
    }
  }

  const reachable = reachableFromTrigger(doc)
  if (reachable) {
    if (hasResolution) {
      const reachableResolution = doc.nodes.some(
        (node) => node.type === 'resolution' && reachable.has(node.id),
      )
      if (!reachableResolution) {
        raw.push({
          severity: 'error',
          code: 'NO_REACHABLE_RESOLUTION',
          message: 'No Resolution is reachable from the Trigger.',
        })
      }
    }
    for (const node of doc.nodes) {
      if (!reachable.has(node.id) && !disconnected.has(node.id)) {
        raw.push({
          severity: 'error',
          code: 'UNREACHABLE_NODE',
          message: `${node.label} can't be reached from the Trigger.`,
          nodeId: node.id,
        })
      }
    }
  }

  for (const node of doc.nodes) {
    if (node.type === 'resolution') continue
    if (disconnected.has(node.id)) continue
    if (outgoers(doc, node.id).length === 0) {
      raw.push({
        severity: 'warning',
        code: 'DEAD_END_NODE',
        message: `${node.label} has no outgoing connection — this path ends without a Resolution.`,
        nodeId: node.id,
      })
    }
  }

  for (const node of doc.nodes) {
    if (node.type !== 'condition') continue
    for (const handle of ['true', 'false'] as const) {
      const edges = outgoersByHandle(doc, node.id, handle)
      if (edges.length === 0) {
        raw.push({
          severity: 'error',
          code: 'CONDITION_MISSING_BRANCH',
          message: `Condition ${node.label} is missing its ${handle} branch.`,
          nodeId: node.id,
          field: handle,
        })
      } else if (edges.length > 1) {
        for (const extraEdge of edges.slice(1)) {
          raw.push({
            severity: 'error',
            code: 'CONDITION_DUPLICATE_BRANCH',
            message: `Condition ${node.label} has two ${handle} branches. Remove one.`,
            edgeId: extraEdge.id,
          })
        }
      }
    }
  }

  for (const node of doc.nodes) {
    if (node.type !== 'condition') continue
    if (node.config.field.trim() === '') {
      raw.push({
        severity: 'error',
        code: 'CONDITION_MISSING_FIELD',
        message: `Choose a payload field for ${node.label} to test.`,
        nodeId: node.id,
        field: 'field',
      })
    }
  }

  for (const node of doc.nodes) {
    if (node.type !== 'action') continue
    if (node.config.target.trim() === '') {
      raw.push({
        severity: 'error',
        code: 'ACTION_MISSING_TARGET',
        message: `${node.label} needs a target (channel, service or rota).`,
        nodeId: node.id,
        field: 'target',
      })
    }
    if (
      !Number.isFinite(node.config.durationMs) ||
      node.config.durationMs < 0 ||
      node.config.durationMs > 60_000
    ) {
      raw.push({
        severity: 'error',
        code: 'ACTION_INVALID_DURATION',
        message: 'Duration must be between 0 and 60000 ms.',
        nodeId: node.id,
        field: 'durationMs',
      })
    }
  }

  for (const node of doc.nodes) {
    if (node.type !== 'approval') continue
    if (node.config.approverRole.trim() === '') {
      raw.push({
        severity: 'error',
        code: 'APPROVAL_MISSING_ROLE',
        message: `${node.label} needs an approver role.`,
        nodeId: node.id,
        field: 'approverRole',
      })
    }
    if (!Number.isFinite(node.config.timeoutMs) || node.config.timeoutMs <= 0) {
      raw.push({
        severity: 'error',
        code: 'APPROVAL_INVALID_TIMEOUT',
        message: 'Timeout must be a positive number of milliseconds.',
        nodeId: node.id,
        field: 'timeoutMs',
      })
    }
  }

  for (const node of doc.nodes) {
    if (node.type !== 'resolution') continue
    if (node.config.summary.trim() === '') {
      raw.push({
        severity: 'warning',
        code: 'RESOLUTION_MISSING_SUMMARY',
        message: 'Add a summary so the postmortem has context.',
        nodeId: node.id,
        field: 'summary',
      })
    }
  }

  for (const trigger of triggers) {
    if (trigger.type !== 'trigger') continue
    trigger.config.filters.forEach((filterRule, index) => {
      const missingField = filterRule.field.trim() === ''
      const missingValue = filterRule.operator !== 'exists' && filterRule.value.trim() === ''
      if (missingField || missingValue) {
        raw.push({
          severity: 'error',
          code: 'TRIGGER_FILTER_INCOMPLETE',
          message: `Filter ${index + 1} on ${trigger.label} is missing a field or value.`,
          nodeId: trigger.id,
          field: 'filters',
          idSuffix: String(index),
        })
      }
    })
  }

  for (const edge of doc.edges) {
    if (edge.source === edge.target) {
      raw.push({
        severity: 'error',
        code: 'SELF_LOOP',
        message: "A node can't connect to itself.",
        edgeId: edge.id,
      })
    }
  }

  const nodesById = new Map(doc.nodes.map((node) => [node.id, node]))
  for (const cycle of findCycles(doc)) {
    const ring = cycle.slice(0, -1)
    if (ring.length <= 1) continue // self-loops are reported as SELF_LOOP above
    const firstEdge = doc.edges.find(
      (edge) => edge.source === cycle[0] && edge.target === cycle[1],
    )
    const labels = cycle.map((id) => nodesById.get(id)?.label ?? id)
    raw.push({
      severity: 'error',
      code: 'CYCLE_DETECTED',
      message: `These nodes form a loop: ${labels.join(' → ')}. Remove a connection.`,
      edgeId: firstEdge?.id,
      idSuffix: ring.join(','),
    })
  }

  for (const node of doc.nodes) {
    if (node.type === 'condition' || node.type === 'resolution') continue
    if (outgoers(doc, node.id).length > 1) {
      raw.push({
        severity: 'error',
        code: 'MULTIPLE_OUTPUTS',
        message: `${node.label} has more than one outgoing connection. Use a Condition to branch.`,
        nodeId: node.id,
      })
    }
  }

  return finalize(raw, doc)
}

function findDisconnectedNodeIds(doc: WorkflowDocument): Set<string> {
  const ids = new Set<string>()
  for (const node of doc.nodes) {
    if (incomers(doc, node.id).length === 0 && outgoers(doc, node.id).length === 0) {
      ids.add(node.id)
    }
  }
  return ids
}

function finalize(raw: RawIssue[], doc: WorkflowDocument): ValidationIssue[] {
  const nodesById = new Map(doc.nodes.map((node) => [node.id, node]))
  const edgesById = new Map(doc.edges.map((edge) => [edge.id, edge]))

  const issues: ValidationIssue[] = raw.map((item) => ({
    id: buildId(item),
    severity: item.severity,
    code: item.code,
    message: item.message,
    ...(item.nodeId !== undefined ? { nodeId: item.nodeId } : {}),
    ...(item.edgeId !== undefined ? { edgeId: item.edgeId } : {}),
    ...(item.field !== undefined ? { field: item.field } : {}),
  }))

  return issues.sort((a, b) => {
    const severityRank = severityOrder(a.severity) - severityOrder(b.severity)
    if (severityRank !== 0) return severityRank
    const posA = positionFor(a, nodesById, edgesById)
    const posB = positionFor(b, nodesById, edgesById)
    if (posA.x !== posB.x) return posA.x - posB.x
    if (posA.y !== posB.y) return posA.y - posB.y
    return a.id.localeCompare(b.id)
  })
}

function buildId(item: RawIssue): string {
  const base = `${item.code}:${item.nodeId ?? item.edgeId ?? 'graph'}:${item.field ?? ''}`
  return item.idSuffix !== undefined ? `${base}:${item.idSuffix}` : base
}

function severityOrder(severity: IssueSeverity): number {
  return severity === 'error' ? 0 : 1
}

function positionFor(
  issue: ValidationIssue,
  nodesById: Map<string, WorkflowNode>,
  edgesById: Map<string, WorkflowEdge>,
): { x: number; y: number } {
  if (issue.nodeId) {
    const node = nodesById.get(issue.nodeId)
    if (node) return node.position
  }
  if (issue.edgeId) {
    const edge = edgesById.get(issue.edgeId)
    if (edge) {
      const source = nodesById.get(edge.source)
      if (source) return source.position
    }
  }
  return { x: -Infinity, y: -Infinity }
}
