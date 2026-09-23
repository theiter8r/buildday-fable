/**
 * Verbatim user-facing strings for the panels lane, copied from
 * docs/CONTENT.md (sections 2–6). Every panel component reads its copy from
 * here rather than inlining literals, so a CONTENT.md edit only touches one
 * file.
 */
import type { ActionKind, ApprovalPolicy, NodeType, Operator, ResolutionStatus } from '@/domain/types'

export const PALETTE_CONTENT = {
  instructionDesktop: 'Drag a node onto the canvas, or click to drop it at the center.',
  instructionMobile: 'Tap a node to add it to the canvas.',
} as const

export const PALETTE_NODE_CONTENT: Record<
  NodeType,
  { label: string; description: string; hints: readonly string[] }
> = {
  trigger: {
    label: 'Trigger',
    description: 'The signal that opens the incident.',
    hints: [
      'Starts the run — every workflow needs exactly one.',
      'Simulated: fires from a chosen source, not a live integration.',
      'Can be filtered by severity and service before it fans out.',
    ],
  },
  condition: {
    label: 'Condition',
    description: 'A fork in the road, decided by the payload.',
    hints: [
      'Evaluates one field against one value.',
      'Always produces two branches: true and false.',
      'Leaving a branch empty stalls that half of the run.',
    ],
  },
  action: {
    label: 'Action',
    description: 'A step the response actually takes.',
    hints: [
      'Simulated duration and outcome — nothing is paged for real.',
      'Can be set to fail on demand, to test what happens next.',
      'Chain several to model a real remediation sequence.',
    ],
  },
  approval: {
    label: 'Approval',
    description: 'A deliberate pause for a human decision.',
    hints: [
      'Assign the role whose judgment the step requires.',
      'Choose whether the simulator waits, approves, or rejects automatically.',
      'A timeout models what happens when no one answers.',
    ],
  },
  resolution: {
    label: 'Resolution',
    description: 'Where a path ends and the record closes.',
    hints: [
      'Every reachable path should end at one of these.',
      'Carries the final status: resolved, mitigated, or escalated.',
      'Can require a postmortem before the run is called complete.',
    ],
  },
}

export const INSPECTOR_CONTENT = {
  empty: {
    title: 'No node selected',
    body: 'Select a node on the canvas to see and edit its configuration here.',
    hint: 'Tip: click an empty area of the canvas to deselect.',
  },
  edgeSelected: {
    title: 'Connection selected',
    body: "This edge links two nodes in the run order. Give it a label to document why the path branches this way, or delete it to disconnect them.",
  },
  actions: {
    duplicate: 'Duplicate node',
    delete: 'Delete node',
  },
} as const

export const TRIGGER_FIELDS = {
  name: { label: 'Name', placeholder: 'e.g. Checkout API alerts' },
  source: {
    label: 'Source',
    helper: 'All sources are simulated — no external service is contacted.',
    options: [
      { value: 'pagerduty', label: 'PagerDuty webhook' },
      { value: 'datadog', label: 'Datadog monitor' },
      { value: 'sentry', label: 'Sentry issue' },
      { value: 'cloudwatch', label: 'CloudWatch alarm' },
      { value: 'manual', label: 'Manual report' },
      { value: 'webhook', label: 'Synthetic check' },
    ],
  },
  description: {
    label: 'Description',
    placeholder: 'e.g. Any incident from PagerDuty.',
    helper: 'Shown on the node card as a short summary.',
  },
  filters: {
    label: 'Filters',
    helper: 'All filters must match for the trigger to fire.',
    addLabel: 'Add filter',
    removeLabel: 'Remove filter',
    empty: 'No filters — this trigger fires on every incident.',
  },
} as const

export const CONDITION_FIELDS = {
  name: { label: 'Name', placeholder: 'e.g. Is this critical?' },
  field: {
    label: 'Field',
    helper: 'The payload field this condition inspects.',
  },
  operator: {
    label: 'Operator',
  },
  value: {
    label: 'Value',
    placeholder: 'e.g. critical',
    helper: 'Hidden when operator is "Exists" — that check needs no value.',
  },
  branch: {
    true: { label: 'True branch', helper: 'Where the run continues when this condition holds.' },
    false: {
      label: 'False branch',
      helper: "Where the run continues when this condition doesn't hold.",
    },
  },
} as const

export const OPERATOR_OPTIONS: Record<Operator, string> = {
  equals: 'Equals',
  'not-equals': 'Not equals',
  gt: 'Greater than',
  gte: 'At least',
  lt: 'Less than',
  lte: 'At most',
  contains: 'Contains',
  in: 'Is one of',
  exists: 'Exists',
}

export const CONDITION_FIELD_OPTIONS = [
  { value: 'severity', label: 'Severity' },
  { value: 'service', label: 'Service' },
  { value: 'errorRate', label: 'Error rate' },
  { value: 'region', label: 'Region' },
  { value: 'affectedUsers', label: 'Affected users' },
  { value: 'title', label: 'Title' },
]

export const ACTION_FIELDS = {
  name: { label: 'Name', placeholder: 'e.g. Page primary on-call' },
  type: { label: 'Action type' },
  target: {
    label: 'Target',
    placeholder: 'e.g. #incidents, SRE primary',
    helper: 'Who or what this action is directed at.',
  },
  duration: {
    label: 'Simulated duration (ms)',
    helper: 'How long this step takes to complete when the run plays.',
  },
  simulateFailure: {
    label: 'Simulate failure',
    helper: 'When on, this action fails during the run so you can see how the workflow handles it.',
  },
  continueOnFailure: {
    label: 'Continue on failure',
    helper: 'When on, the run keeps going past this step even if it fails.',
  },
} as const

export const ACTION_TYPE_OPTIONS: Record<ActionKind, string> = {
  'page-oncall': 'Page on-call',
  'post-slack': 'Post to Slack',
  'create-ticket': 'Create ticket',
  'rollback-deploy': 'Rollback deploy',
  'scale-service': 'Scale service',
  'run-runbook': 'Run runbook',
}

export const APPROVAL_FIELDS = {
  name: { label: 'Name', placeholder: 'e.g. Approve rollback' },
  approverRole: { label: 'Approver role' },
  timeout: {
    label: 'Timeout (min)',
    helper: 'How long the run waits before treating this approval as timed out.',
  },
  policy: {
    label: 'Simulation policy',
    helper: 'Controls how this approval resolves during a simulated run.',
  },
  prompt: {
    label: 'Prompt',
    placeholder: 'e.g. Approve the rollback?',
    helper: 'Shown to whoever answers the approval.',
  },
} as const

export const APPROVER_ROLE_OPTIONS = [
  { value: 'incident-commander', label: 'Incident commander' },
  { value: 'sre-lead', label: 'SRE lead' },
  { value: 'eng-manager', label: 'Engineering manager' },
  { value: 'security', label: 'Security' },
]

export const APPROVAL_POLICY_OPTIONS: Record<ApprovalPolicy, { label: string; helper: string }> = {
  manual: {
    label: 'Wait for manual decision',
    helper: 'The run pauses here until you approve or reject it.',
  },
  'auto-approve': {
    label: 'Auto-approve',
    helper: 'The run treats this as approved the moment it arrives.',
  },
  'auto-reject': {
    label: 'Auto-reject',
    helper: 'The run treats this as rejected the moment it arrives.',
  },
}

export const RESOLUTION_FIELDS = {
  name: { label: 'Name', placeholder: 'e.g. Resolved' },
  status: { label: 'Status' },
  postmortemRequired: {
    label: 'Postmortem required',
    helper: "Flag this path as needing a written postmortem before it's considered closed.",
  },
  summary: {
    label: 'Summary',
    placeholder: 'e.g. Checkout API restored after rollback; no data loss.',
    helper: 'A short record of how this path ends.',
  },
} as const

export const RESOLUTION_STATUS_OPTIONS: Record<ResolutionStatus, string> = {
  resolved: 'Resolved',
  mitigated: 'Mitigated',
  escalated: 'Escalated',
}

export const META_FIELDS = {
  label: { label: 'Label' },
  notes: { label: 'Notes', placeholder: 'Optional notes for this node.' },
} as const

export const VALIDATION_CONTENT = {
  runDisabled: {
    hasErrors: 'Fix the issues below before running this workflow.',
    noTrigger: 'Add a trigger to enable the run.',
    emptyCanvas: 'Add at least one node to run a workflow.',
  },
  success: 'Workflow is valid — ready to run.',
  panel: {
    header: 'Issues',
    empty: 'No issues found. This workflow is ready to run.',
  },
} as const

export const PAYLOAD_CONTENT = {
  title: 'Incident payload',
  description:
    'This is the data the trigger reacts to. Edit it directly or start from a preset, then run the workflow to see how it responds.',
  fields: {
    title: { label: 'Title', placeholder: 'e.g. Checkout API returning 5xx errors' },
    service: { label: 'Service', placeholder: 'e.g. checkout-api' },
    severity: { label: 'Severity', helper: 'How serious this incident is reported to be.' },
    errorRate: { label: 'Error rate (%)', helper: 'Share of requests currently failing.' },
    region: { label: 'Region', placeholder: 'e.g. us-east-1' },
    affectedUsers: {
      label: 'Affected users',
      helper: 'Estimated number of users experiencing impact.',
    },
    source: { label: 'Source', helper: 'Where this incident report originated.' },
    detectedAt: { label: 'Detected at', helper: 'When the incident was first observed.' },
  },
  presets: [
    { name: 'Critical API outage' },
    { name: 'Elevated latency, single region' },
    { name: 'Low-priority anomaly' },
  ],
  jsonMode: {
    toggle: 'Edit as JSON',
    fieldsModeToggle: 'Edit as fields',
    helper: 'Paste or edit the raw payload. Switching back to fields will validate the shape.',
    errorInvalid: "This isn't valid JSON — check for a missing comma or bracket.",
    errorSchema: "This JSON is valid but doesn't match the expected payload shape:",
  },
} as const

export const RUN_CONTENT = {
  idle: 'Ready to run. Press Run to start the simulation.',
  running: (nodeName: string) => `Running — ${nodeName}`,
  awaitingApproval: {
    title: 'Waiting on approval',
    body: (nodeName: string, approverRole: string) =>
      `${nodeName} is waiting on a decision from the ${approverRole}.`,
    approve: 'Approve',
    reject: 'Reject',
  },
  summary: {
    success: (branch: string, duration: string) => `Resolved via ${branch} branch in ${duration}.`,
    failed: (nodeName: string, duration: string) => `Run failed at ${nodeName} after ${duration}.`,
    cancelled: (nodeName: string) => `Run cancelled at ${nodeName}.`,
  },
  controls: {
    run: 'Run',
    runTooltip: 'Start the simulation from the trigger.',
    pause: 'Pause',
    pauseTooltip: 'Pause the run where it stands.',
    resume: 'Resume',
    resumeTooltip: 'Continue the run from where it paused.',
    step: 'Step',
    stepTooltip: 'Advance one node at a time.',
    reset: 'Reset',
    resetTooltip: 'Clear this run and return to idle.',
    speed1x: '1x',
    speed2x: '2x',
    speedInstant: 'Instant',
    speedTooltip: 'Set playback speed.',
  },
  timeline: {
    triggerFired: (nodeName: string) => `Trigger fired — ${nodeName}`,
    conditionEvaluated: (field: string, operator: string, value: string, result: string) =>
      `${field} ${operator} ${value} → ${result}`,
    actionStarted: (nodeName: string) => `Action started — ${nodeName}`,
    actionFinished: (nodeName: string, duration: string) =>
      `Action finished — ${nodeName} (${duration})`,
    actionFailed: (nodeName: string, duration: string) =>
      `Action failed — ${nodeName} (${duration})`,
    approvalRequested: (nodeName: string, approverRole: string) =>
      `Approval requested — ${nodeName} (${approverRole})`,
    approvalApproved: (nodeName: string) => `Approval granted — ${nodeName}`,
    approvalRejected: (nodeName: string) => `Approval rejected — ${nodeName}`,
    resolutionReached: (nodeName: string, status: string) =>
      `Resolution reached — ${nodeName} (${status})`,
    runFinished: (outcome: string) => `Run finished (${outcome})`,
    empty: 'Nothing has run yet. Press Run to start.',
  },
} as const

export const A11Y_CONTENT = {
  deleteNode: 'Delete node',
  duplicateNode: 'Duplicate node',
  runControls: {
    run: 'Run workflow',
    pause: 'Pause run',
    resume: 'Resume run',
    step: 'Step to next node',
    reset: 'Reset run',
  },
  paletteNode: (nodeType: string) => `Add ${nodeType} node to canvas`,
  live: {
    runStarted: 'Run started.',
    nodeRunning: (nodeName: string) => `Now running ${nodeName}.`,
    awaitingApproval: (approverRole: string, nodeName: string) =>
      `Waiting on approval from ${approverRole} at ${nodeName}.`,
    runFinished: (outcome: string) => `Run finished: ${outcome}.`,
  },
} as const

export const RESET_DIALOG_CONTENT = {
  title: 'Reset to demo workflow?',
  body: "This replaces your current canvas with the built-in Critical API Incident demo. Your current workflow will be lost unless you've exported it.",
  confirm: 'Reset to demo',
  cancel: 'Cancel',
} as const
