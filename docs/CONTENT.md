# OpsFlow — Content & Microcopy

All user-facing strings for OpsFlow, keyed for direct use by UI code. Organized by surface. Tone: calm, precise, operator-grade, slightly literary — never cutesy, no lorem ipsum. Background painting: "GOD'S PLAN." (night sky, clouds).

Format: `key` — string (notes in _italics_ where relevant).

---

## 1. App Identity & Hero

`app.name` — OpsFlow

`app.tagline` — Design the response before the incident writes it for you.

`app.header.title` — OpsFlow

`app.header.subtitle` — Visual incident-response studio

`hero.eyebrow` — Local-first. Nothing leaves this machine.

`hero.headline` — Every incident has a shape. Draw it before it happens.

`hero.subhead` — Build, simulate, and stress-test your incident-response workflow on a canvas — triggers, conditions, actions, approvals, resolutions — then watch it run node by node before it ever meets a real page.

`hero.cta.primary` — Load the demo workflow

`hero.cta.secondary` — Start from a blank canvas

`hero.cta.tertiary` — Import JSON

---

## 2. Palette (Node Library)

_Drag/tap instruction, shown once above the palette list._

`palette.instruction.desktop` — Drag a node onto the canvas, or click to drop it at the center.

`palette.instruction.mobile` — Tap a node to add it to the canvas.

### Trigger

`palette.trigger.label` — Trigger

`palette.trigger.description` — The signal that opens the incident.

`palette.trigger.hint.1` — Starts the run — every workflow needs exactly one.

`palette.trigger.hint.2` — Simulated: fires from a chosen source, not a live integration.

`palette.trigger.hint.3` — Can be filtered by severity and service before it fans out.

### Condition

`palette.condition.label` — Condition

`palette.condition.description` — A fork in the road, decided by the payload.

`palette.condition.hint.1` — Evaluates one field against one value.

`palette.condition.hint.2` — Always produces two branches: true and false.

`palette.condition.hint.3` — Leaving a branch empty stalls that half of the run.

### Action

`palette.action.label` — Action

`palette.action.description` — A step the response actually takes.

`palette.action.hint.1` — Simulated duration and outcome — nothing is paged for real.

`palette.action.hint.2` — Can be set to fail on demand, to test what happens next.

`palette.action.hint.3` — Chain several to model a real remediation sequence.

### Approval

`palette.approval.label` — Approval

`palette.approval.description` — A deliberate pause for a human decision.

`palette.approval.hint.1` — Assign the role whose judgment the step requires.

`palette.approval.hint.2` — Choose whether the simulator waits, approves, or rejects automatically.

`palette.approval.hint.3` — A timeout models what happens when no one answers.

### Resolution

`palette.resolution.label` — Resolution

`palette.resolution.description` — Where a path ends and the record closes.

`palette.resolution.hint.1` — Every reachable path should end at one of these.

`palette.resolution.hint.2` — Carries the final status: resolved, mitigated, or escalated.

`palette.resolution.hint.3` — Can require a postmortem before the run is called complete.

---

## 3. Inspector

`inspector.empty.title` — No node selected

`inspector.empty.body` — Select a node on the canvas to see and edit its configuration here.

`inspector.empty.hint` — Tip: click an empty area of the canvas to deselect.

`inspector.edge.selected.title` — Connection selected

`inspector.edge.selected.body` — This edge links two nodes in the run order. Give it a label to document why the path branches this way, or delete it to disconnect them.

`inspector.actions.duplicate` — Duplicate node

`inspector.actions.delete` — Delete node

### Trigger fields

`inspector.trigger.name.label` — Name

`inspector.trigger.name.placeholder` — e.g. Checkout API alerts

`inspector.trigger.source.label` — Source

`inspector.trigger.source.helper` — All sources are simulated — no external service is contacted.

`inspector.trigger.source.option.pagerduty` — PagerDuty webhook

`inspector.trigger.source.option.datadog` — Datadog monitor

`inspector.trigger.source.option.manual` — Manual report

`inspector.trigger.source.option.synthetic` — Synthetic check

`inspector.trigger.severityFilter.label` — Severity filter

`inspector.trigger.severityFilter.helper` — Only payloads at or above this severity will fire the trigger.

`inspector.trigger.severityFilter.option.any` — Any

`inspector.trigger.severityFilter.option.critical` — Critical

`inspector.trigger.severityFilter.option.high` — High

`inspector.trigger.severityFilter.option.medium` — Medium

`inspector.trigger.severityFilter.option.low` — Low

`inspector.trigger.serviceFilter.label` — Service filter

`inspector.trigger.serviceFilter.placeholder` — e.g. checkout-api (leave blank for any service)

`inspector.trigger.serviceFilter.helper` — Restrict this trigger to incidents from a single service.

### Condition fields

`inspector.condition.name.label` — Name

`inspector.condition.name.placeholder` — e.g. Is this critical?

`inspector.condition.field.label` — Field

`inspector.condition.field.helper` — The payload field this condition inspects.

`inspector.condition.field.option.severity` — Severity

`inspector.condition.field.option.service` — Service

`inspector.condition.field.option.errorRate` — Error rate

`inspector.condition.field.option.region` — Region

`inspector.condition.field.option.affectedUsers` — Affected users

`inspector.condition.field.option.title` — Title

`inspector.condition.operator.label` — Operator

`inspector.condition.operator.option.equals` — Equals

`inspector.condition.operator.option.notEquals` — Not equals

`inspector.condition.operator.option.greaterThan` — Greater than

`inspector.condition.operator.option.atLeast` — At least

`inspector.condition.operator.option.lessThan` — Less than

`inspector.condition.operator.option.atMost` — At most

`inspector.condition.operator.option.contains` — Contains

`inspector.condition.operator.option.isOneOf` — Is one of

`inspector.condition.operator.option.exists` — Exists

`inspector.condition.value.label` — Value

`inspector.condition.value.placeholder` — e.g. critical

`inspector.condition.value.helper` — _Hidden when operator is "Exists" — that check needs no value._

`inspector.condition.branch.true.label` — True branch

`inspector.condition.branch.true.helper` — Where the run continues when this condition holds.

`inspector.condition.branch.false.label` — False branch

`inspector.condition.branch.false.helper` — Where the run continues when this condition doesn't hold.

### Action fields

`inspector.action.name.label` — Name

`inspector.action.name.placeholder` — e.g. Page primary on-call

`inspector.action.type.label` — Action type

`inspector.action.type.option.page` — Page on-call

`inspector.action.type.option.slack` — Post to Slack

`inspector.action.type.option.ticket` — Create ticket

`inspector.action.type.option.rollback` — Rollback deploy

`inspector.action.type.option.scale` — Scale service

`inspector.action.type.option.runbook` — Run runbook

`inspector.action.target.label` — Target

`inspector.action.target.placeholder` — e.g. #incidents, SRE primary

`inspector.action.target.helper` — Who or what this action is directed at.

`inspector.action.duration.label` — Simulated duration (ms)

`inspector.action.duration.helper` — How long this step takes to complete when the run plays.

`inspector.action.simulateFailure.label` — Simulate failure

`inspector.action.simulateFailure.helper` — When on, this action fails during the run so you can see how the workflow handles it.

### Approval fields

`inspector.approval.name.label` — Name

`inspector.approval.name.placeholder` — e.g. Approve rollback

`inspector.approval.approverRole.label` — Approver role

`inspector.approval.approverRole.option.incidentCommander` — Incident commander

`inspector.approval.approverRole.option.sreLead` — SRE lead

`inspector.approval.approverRole.option.engManager` — Engineering manager

`inspector.approval.approverRole.option.security` — Security

`inspector.approval.timeout.label` — Timeout (min)

`inspector.approval.timeout.helper` — How long the run waits before treating this approval as timed out.

`inspector.approval.policy.label` — Simulation policy

`inspector.approval.policy.helper` — Controls how this approval resolves during a simulated run.

`inspector.approval.policy.option.manual` — Wait for manual decision

`inspector.approval.policy.option.manual.helper` — The run pauses here until you approve or reject it.

`inspector.approval.policy.option.autoApprove` — Auto-approve

`inspector.approval.policy.option.autoApprove.helper` — The run treats this as approved the moment it arrives.

`inspector.approval.policy.option.autoReject` — Auto-reject

`inspector.approval.policy.option.autoReject.helper` — The run treats this as rejected the moment it arrives.

### Resolution fields

`inspector.resolution.name.label` — Name

`inspector.resolution.name.placeholder` — e.g. Resolved

`inspector.resolution.status.label` — Status

`inspector.resolution.status.option.resolved` — Resolved

`inspector.resolution.status.option.mitigated` — Mitigated

`inspector.resolution.status.option.escalated` — Escalated

`inspector.resolution.postmortemRequired.label` — Postmortem required

`inspector.resolution.postmortemRequired.helper` — Flag this path as needing a written postmortem before it's considered closed.

`inspector.resolution.summary.label` — Summary

`inspector.resolution.summary.placeholder` — e.g. Checkout API restored after rollback; no data loss.

`inspector.resolution.summary.helper` — A short record of how this path ends.

---

## 4. Validation

_Each issue: title, one-sentence explanation, fix hint._

`validation.NO_TRIGGER.title` — No trigger

`validation.NO_TRIGGER.explanation` — This workflow has no trigger, so nothing can start it.

`validation.NO_TRIGGER.fix` — Add a Trigger node from the palette.

`validation.MULTIPLE_TRIGGERS.title` — Multiple triggers

`validation.MULTIPLE_TRIGGERS.explanation` — A workflow can only begin from one place, and this one has more than one trigger.

`validation.MULTIPLE_TRIGGERS.fix` — Delete or merge the extra trigger nodes.

`validation.MISSING_CONFIG.title` — Missing configuration — {field}

`validation.MISSING_CONFIG.explanation` — This node is missing a required value for "{field}".

`validation.MISSING_CONFIG.fix` — Select the node and fill in {field} in the inspector.

`validation.UNREACHABLE_NODE.title` — Unreachable node

`validation.UNREACHABLE_NODE.explanation` — This node has no path leading to it from the trigger, so it can never run.

`validation.UNREACHABLE_NODE.fix` — Connect it from an upstream node, or remove it.

`validation.DANGLING_EDGE.title` — Dangling connection

`validation.DANGLING_EDGE.explanation` — This connection points to a node that no longer exists.

`validation.DANGLING_EDGE.fix` — Delete the connection or reconnect it to a valid node.

`validation.CONDITION_BRANCH_MISSING.true.title` — Missing true branch

`validation.CONDITION_BRANCH_MISSING.true.explanation` — This condition has no path for when it evaluates to true.

`validation.CONDITION_BRANCH_MISSING.true.fix` — Connect the condition's true branch to a next step.

`validation.CONDITION_BRANCH_MISSING.false.title` — Missing false branch

`validation.CONDITION_BRANCH_MISSING.false.explanation` — This condition has no path for when it evaluates to false.

`validation.CONDITION_BRANCH_MISSING.false.fix` — Connect the condition's false branch to a next step.

`validation.NO_RESOLUTION.title` — No resolution

`validation.NO_RESOLUTION.explanation` — This workflow has no Resolution node, so no run through it can ever be marked closed.

`validation.NO_RESOLUTION.fix` — Add a Resolution node and connect it to an ending path.

`validation.PATH_WITHOUT_RESOLUTION.title` — Path doesn't end in resolution

`validation.PATH_WITHOUT_RESOLUTION.explanation` — At least one path through this workflow never reaches a Resolution node.

`validation.PATH_WITHOUT_RESOLUTION.fix` — Trace this path and connect its final step to a Resolution node.

`validation.CYCLE_DETECTED.title` — Cycle detected

`validation.CYCLE_DETECTED.explanation` — This workflow loops back on itself, so a run could continue indefinitely.

`validation.CYCLE_DETECTED.fix` — Remove or redirect the connection that closes the loop.

`validation.DEAD_END.title` — Dead end

`validation.DEAD_END.explanation` — This node has no outgoing connection and isn't a Resolution, so a run can enter it and go no further.

`validation.DEAD_END.fix` — Connect it to a next step, or replace it with a Resolution node.

### Run gating & panel chrome

`validation.runDisabled.hasErrors` — Fix the issues below before running this workflow.

`validation.runDisabled.noTrigger` — Add a trigger to enable the run.

`validation.runDisabled.emptyCanvas` — Add at least one node to run a workflow.

`validation.success` — Workflow is valid — ready to run.

`validation.panel.header` — Issues

`validation.panel.empty` — No issues found. This workflow is ready to run.

---

## 5. Payload Editor

`payload.title` — Incident payload

`payload.description` — This is the data the trigger reacts to. Edit it directly or start from a preset, then run the workflow to see how it responds.

`payload.field.title.label` — Title

`payload.field.title.placeholder` — e.g. Checkout API returning 5xx errors

`payload.field.service.label` — Service

`payload.field.service.placeholder` — e.g. checkout-api

`payload.field.severity.label` — Severity

`payload.field.severity.helper` — How serious this incident is reported to be.

`payload.field.errorRate.label` — Error rate (%)

`payload.field.errorRate.helper` — Share of requests currently failing.

`payload.field.region.label` — Region

`payload.field.region.placeholder` — e.g. us-east-1

`payload.field.affectedUsers.label` — Affected users

`payload.field.affectedUsers.helper` — Estimated number of users experiencing impact.

`payload.field.source.label` — Source

`payload.field.source.helper` — Where this incident report originated.

`payload.field.detectedAt.label` — Detected at

`payload.field.detectedAt.helper` — When the incident was first observed.

### Presets

`payload.preset.critical.name` — Critical API outage

`payload.preset.critical.sample` — _title: "Checkout API returning 5xx errors", service: checkout-api, severity: critical, errorRate: 42.5, region: us-east-1, affectedUsers: 18400, source: PagerDuty webhook_

`payload.preset.latency.name` — Elevated latency, single region

`payload.preset.latency.sample` — _title: "p95 latency above SLO in eu-west-1", service: checkout-api, severity: medium, errorRate: 3.1, region: eu-west-1, affectedUsers: 2200, source: Datadog monitor_

`payload.preset.anomaly.name` — Low-priority anomaly

`payload.preset.anomaly.sample` — _title: "Unusual traffic pattern on search endpoint", service: search-api, severity: low, errorRate: 0.4, region: ap-southeast-1, affectedUsers: 60, source: Synthetic check_

### JSON mode

`payload.jsonMode.toggle` — Edit as JSON

`payload.jsonMode.fieldsMode.toggle` — Edit as fields

`payload.jsonMode.helper` — Paste or edit the raw payload. Switching back to fields will validate the shape.

`payload.jsonMode.error.invalid` — This isn't valid JSON — check for a missing comma or bracket.

`payload.jsonMode.error.schema` — This JSON is valid but doesn't match the expected payload shape:

---

## 6. Run Panel

`run.idle` — Ready to run. Press Run to start the simulation.

`run.running` — Running — {nodeName}

`run.awaitingApproval.title` — Waiting on approval

`run.awaitingApproval.body` — {nodeName} is waiting on a decision from the {approverRole}.

`run.awaitingApproval.approve` — Approve

`run.awaitingApproval.reject` — Reject

`run.summary.success` — Resolved via {branch} branch in {duration}.

`run.summary.failed` — Run failed at {nodeName} after {duration}.

`run.summary.cancelled` — Run cancelled at {nodeName}.

### Player controls

`run.controls.run` — Run

`run.controls.run.tooltip` — Start the simulation from the trigger.

`run.controls.pause` — Pause

`run.controls.pause.tooltip` — Pause the run where it stands.

`run.controls.resume` — Resume

`run.controls.resume.tooltip` — Continue the run from where it paused.

`run.controls.step` — Step

`run.controls.step.tooltip` — Advance one node at a time.

`run.controls.reset` — Reset

`run.controls.reset.tooltip` — Clear this run and return to idle.

`run.controls.speed.1x` — 1x

`run.controls.speed.2x` — 2x

`run.controls.speed.instant` — Instant

`run.controls.speed.tooltip` — Set playback speed.

### Timeline row templates

`run.timeline.triggerFired` — Trigger fired — {nodeName}

`run.timeline.conditionEvaluated` — {field} {operator} {value} → {result}

`run.timeline.actionStarted` — Action started — {nodeName}

`run.timeline.actionFinished` — Action finished — {nodeName} ({duration})

`run.timeline.actionFailed` — Action failed — {nodeName} ({duration})

`run.timeline.approvalRequested` — Approval requested — {nodeName} ({approverRole})

`run.timeline.approvalApproved` — Approval granted — {nodeName}

`run.timeline.approvalRejected` — Approval rejected — {nodeName}

`run.timeline.resolutionReached` — Resolution reached — {nodeName} ({status})

`run.timeline.runFinished` — Run finished ({outcome})

`run.timeline.timestampFormat` — _Relative to run start, formatted as `+0.0s` (one decimal place); switch to `+m:ss` once the run passes 60 seconds._

`run.timeline.empty` — Nothing has run yet. Press Run to start.

---

## 7. Toolbar & Menus

`toolbar.undo` — Undo

`toolbar.redo` — Redo

`toolbar.fitToView` — Fit to view

`toolbar.zoomIn` — Zoom in

`toolbar.zoomOut` — Zoom out

`toolbar.minimapToggle` — Toggle minimap

`toolbar.exportJson` — Export JSON

`toolbar.importJson` — Import JSON

### Import dialog

`importDialog.title` — Import workflow

`importDialog.tab.file` — Upload file

`importDialog.tab.paste` — Paste JSON

`importDialog.file.instruction` — Choose a `.json` file exported from OpsFlow.

`importDialog.paste.placeholder` — Paste workflow JSON here…

`importDialog.submit` — Import

`importDialog.cancel` — Cancel

`importDialog.toast.success` — Workflow imported.

`importDialog.error.invalidJson` — This isn't valid JSON — check for a missing comma or bracket.

`importDialog.error.schemaIntro` — This file doesn't match the OpsFlow workflow format:

### Reset to demo

`resetDialog.title` — Reset to demo workflow?

`resetDialog.body` — This replaces your current canvas with the built-in Critical API Incident demo. Your current workflow will be lost unless you've exported it.

`resetDialog.confirm` — Reset to demo

`resetDialog.cancel` — Cancel

### Save status

`saveStatus.saved` — Saved locally

`saveStatus.saving` — Saving…

`saveStatus.error` — Couldn't save — storage unavailable

### Keyboard shortcuts help

`shortcuts.title` — Keyboard shortcuts

`shortcuts.undo` — Undo — Cmd/Ctrl+Z

`shortcuts.redo` — Redo — Cmd/Ctrl+Shift+Z

`shortcuts.delete` — Delete selected — Delete / Backspace

`shortcuts.duplicate` — Duplicate selected — Cmd/Ctrl+D

`shortcuts.fitToView` — Fit to view — Shift+1

`shortcuts.zoomIn` — Zoom in — Cmd/Ctrl+=

`shortcuts.zoomOut` — Zoom out — Cmd/Ctrl+-

`shortcuts.run` — Run workflow — Cmd/Ctrl+Enter

`shortcuts.step` — Step run — Right arrow

`shortcuts.pauseResume` — Pause / resume run — Space

`shortcuts.export` — Export JSON — Cmd/Ctrl+S

---

## 8. States & Toasts

`state.boot.loading` — Restoring your workflow…

`state.storageCorrupt.title` — Something's off with your saved workflow

`state.storageCorrupt.body` — The workflow stored on this device couldn't be read. You can reset to the demo workflow, or export the raw data first in case it's recoverable.

`state.storageCorrupt.cta.reset` — Reset to demo

`state.storageCorrupt.cta.export` — Export raw data

`state.import.error` — Import failed — the file wasn't a valid OpsFlow workflow.

`state.timeline.empty` — Nothing has run yet. Press Run to start.

`state.issues.empty` — No issues found. This workflow is ready to run.

`state.notFound.title` — Nothing here

`state.notFound.body` — This route doesn't lead anywhere in OpsFlow.

`state.notFound.cta` — Back to the canvas

### Toasts

`toast.nodeAdded` — {nodeType} added

`toast.nodeDuplicated` — {nodeName} duplicated

`toast.nodeDeleted` — {nodeName} deleted

`toast.exported` — Workflow exported

`toast.imported` — Workflow imported

`toast.resetToDemo` — Workflow reset to demo

`toast.undo` — Undo

`toast.redo` — Redo

---

## 9. Demo Workflow — "Critical API Incident"

`demo.workflow.name` — Critical API Incident

`demo.workflow.description` — A checkout-service outage, routed by severity: critical incidents page and roll back with sign-off; everything else gets ticketed and tracked.

`demo.node.trigger.name` — Checkout API alerts

`demo.node.trigger.description` — Watches for PagerDuty alerts on the checkout API and starts the response.

`demo.edge.triggerToCondition.label` — On alert

`demo.node.condition.name` — Is this critical?

`demo.node.condition.description` — Splits the response by severity: severity equals critical.

`demo.edge.condition.true.label` — Critical

`demo.edge.condition.false.label` — Not critical

`demo.node.pageOnCall.name` — Page primary on-call

`demo.node.pageOnCall.description` — Pages the primary on-call engineer immediately.

`demo.edge.pageToApproval.label` — Paged

`demo.node.approveRollback.name` — Approve rollback

`demo.node.approveRollback.description` — Holds for sign-off from the incident commander before rolling back.

`demo.edge.approvalToRollback.label` — Approved

`demo.node.rollback.name` — Roll back checkout-api

`demo.node.rollback.description` — Reverts checkout-api to the last known-good deploy.

`demo.edge.rollbackToResolved.label` — Rolled back

`demo.node.resolved.name` — Resolved

`demo.node.resolved.description` — Closes the incident once the rollback confirms healthy.

`demo.node.openTicket.name` — Open tracking ticket

`demo.node.openTicket.description` — Files a ticket so the anomaly is tracked without paging anyone.

`demo.edge.ticketToNotify.label` — Filed

`demo.node.notifySlack.name` — Notify #incidents

`demo.node.notifySlack.description` — Posts a summary to #incidents for visibility.

`demo.edge.notifyToMitigated.label` — Posted

`demo.node.mitigated.name` — Mitigated

`demo.node.mitigated.description` — Closes the incident as mitigated pending further review.

---

## 10. README Outline

`readme.section.overview` — Overview — what OpsFlow is and who it's for.

`readme.section.concepts` — Core concepts — the five node types and how a run flows between them.

`readme.section.gettingStarted` — Getting started — install, run locally, load the demo.

`readme.section.buildingWorkflow` — Building a workflow — palette, canvas, inspector, connecting nodes.

`readme.section.validation` — Validation — what's checked before a run is allowed.

`readme.section.simulating` — Simulating a run — the player, approvals, the timeline.

`readme.section.dataAndStorage` — Data & storage — autosave, local-first, export/import, reset to demo.

`readme.section.keyboardShortcuts` — Keyboard shortcuts — quick reference.

`readme.section.architecture` — Architecture — high-level structure of the codebase.

`readme.section.contributing` — Contributing — how to propose changes.

---

## 11. Accessibility Copy

### Aria-labels (icon-only buttons)

`a11y.aria.undo` — Undo

`a11y.aria.redo` — Redo

`a11y.aria.fitToView` — Fit workflow to view

`a11y.aria.zoomIn` — Zoom in

`a11y.aria.zoomOut` — Zoom out

`a11y.aria.minimapToggle` — Toggle minimap

`a11y.aria.closeDialog` — Close dialog

`a11y.aria.deleteNode` — Delete node

`a11y.aria.duplicateNode` — Duplicate node

`a11y.aria.runControls.run` — Run workflow

`a11y.aria.runControls.pause` — Pause run

`a11y.aria.runControls.resume` — Resume run

`a11y.aria.runControls.step` — Step to next node

`a11y.aria.runControls.reset` — Reset run

`a11y.aria.paletteNode` — Add {nodeType} node to canvas

### Live-region announcements

`a11y.live.runStarted` — Run started.

`a11y.live.nodeRunning` — Now running {nodeName}.

`a11y.live.awaitingApproval` — Waiting on approval from {approverRole} at {nodeName}.

`a11y.live.runFinished` — Run finished: {outcome}.

`a11y.live.saveStatus.saved` — Saved locally.

`a11y.live.saveStatus.saving` — Saving.

`a11y.live.saveStatus.error` — Couldn't save. Storage unavailable.
