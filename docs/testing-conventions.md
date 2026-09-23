# Testing conventions

Canonical `data-testid` table and `window.__opsflow` API. Every lane (canvas, app, panels,
components) must use these exact ids — Playwright specs in `e2e/**` are written against them, and
none of them are optional decoration: if a spec needs to find something, it needs a row here.

Prefer `getByRole`/`getByLabel` when a real accessible name exists (per ARCHITECTURE.md §12); fall
back to `data-testid` for canvas internals and anything without a natural role/name.

## `data-testid` table

| `data-testid`                                  | Where                                                         |
| ---------------------------------------------- | ------------------------------------------------------------- |
| `palette-item-{type}`                          | One per `NodeType` in the palette (`palette-item-trigger`, …) |
| `canvas`                                       | The React Flow canvas root                                    |
| `node-{id}`                                    | A canvas node, keyed by `WorkflowNode.id`                     |
| `node-card-{type}`                             | The node card content, keyed by `NodeType`                    |
| `inspector`                                    | The inspector panel root                                      |
| `inspector-field-{name}`                       | One per inspector form field, keyed by config field name      |
| `run-button`                                   | The Run/Stop button in the top bar                            |
| `run-blocked-reason`                           | The text explaining why Run is disabled                       |
| `validation-issue-{code}`                      | One per `ValidationIssue`, keyed by `ValidationCode`          |
| `validation-panel`                             | The validation panel root                                     |
| `timeline`                                     | The timeline log root                                         |
| `timeline-row-{index}`                         | One per `ExecutionEvent`, keyed by its index in `events`      |
| `payload-editor`                               | The payload editor root                                       |
| `payload-field-{name}`                         | One per payload form field, keyed by `IncidentPayload` key    |
| `payload-preset-{n}`                           | One per payload preset button, 0-indexed                      |
| `undo-button`                                  | Undo control                                                  |
| `redo-button`                                  | Redo control                                                  |
| `fit-view-button`                              | Fit-view canvas control                                       |
| `zoom-in-button`                               | Zoom-in canvas control                                        |
| `zoom-out-button`                              | Zoom-out canvas control                                       |
| `minimap`                                      | The React Flow minimap                                        |
| `export-button`                                | Export workflow JSON                                          |
| `import-button`                                | Opens the import dialog                                       |
| `import-file-input`                            | The (visually hidden, always-in-DOM) file input               |
| `import-paste-textarea`                        | The paste-JSON textarea                                       |
| `import-submit`                                | Submits the paste-JSON tab                                    |
| `reset-button`                                 | Reset to demo                                                 |
| `confirm-dialog-confirm`                       | Confirm button on the generic destructive-confirm dialog      |
| `confirm-dialog-cancel`                        | Cancel button on the generic destructive-confirm dialog       |
| `toast`                                        | One per queued `ToastMessage`                                 |
| `empty-state`                                  | Generic empty-state component instance                        |
| `error-state`                                  | Generic error-state component instance                        |
| `loading-state`                                | Generic loading-state component instance                      |
| `approve-button`                               | Inline Approve action on an awaiting-approval node/prompt     |
| `reject-button`                                | Inline Reject action on an awaiting-approval node/prompt      |
| `speed-select`                                 | The 1×/2×/Instant speed control                               |
| `step-button`                                  | Advances the run by exactly one event                         |
| `pause-button`                                 | Pauses playback                                               |
| `save-status`                                  | The "Saved · 19:42" / "Saving…" / storage-warning chip        |
| `workflow-name-input`                          | The editable workflow name field in the top bar               |
| `mobile-tab-{palette\|canvas\|inspector\|run}` | Bottom tab bar buttons on mobile                              |
| `hero`                                         | The `HeroWelcome` root                                        |
| `hero-load-demo`                               | "Load the demo incident" button                               |
| `hero-blank`                                   | "Start blank" button                                          |
| `hero-import`                                  | Import-from-hero entry point (if present)                     |

Rules:

- Every interactive element with a `data-testid` also has a real accessible name (`aria-label`,
  visible text, or `<label>`) — the testid is a fallback locator, not a substitute for
  accessibility.
- Ids that key off a domain value (`{id}`, `{type}`, `{code}`, `{name}`, `{index}`, `{n}`) must use
  the exact string form shown — no extra prefixing/casing changes — so specs can build the selector
  from data they already have (e.g. `` `node-${doc.nodes[0].id}` ``).
- Do not invent parallel ids for the same element across lanes; if a new testid is genuinely
  needed, add it to this table in the same change that introduces it.

## `window.__opsflow` (e2e test handle)

Installed by `src/store/testHandle.ts`. See that file for the authoritative implementation; this
section documents the contract.

**When it's installed:** the URL has an `e2e` search param (`/?e2e=1`) **or** `import.meta.env.DEV`
is true. When installed, `document.documentElement.dataset.e2e` is also set to `'1'`, which
`src/styles/tokens.css` uses to collapse every CSS animation/transition duration to ~0 so
Playwright never races motion.

**Not a second code path.** Every method below calls the exact store action the UI calls — it
exists so tests can set up state precisely (e.g. connect two nodes without a flaky pointer drag),
never so a test can bypass a broken button.

```ts
interface OpsflowTestHandle {
  /** Current workflow document. */
  getDocument(): WorkflowDocument
  /** Current run status + event log. */
  getRun(): { status: RunStatus; events: ExecutionEvent[] }
  /** Same validation `addEdge` runs in the UI; returns false (no-op) if the connection is illegal. */
  connect(source: string, target: string, sourceHandle?: 'true' | 'false' | null): boolean
  /** Replaces the whole payload the next run will simulate against. */
  setPayload(payload: IncidentPayload): void
  /** Reloads the demo workflow via the real `resetToDemo` action. */
  reset(): void
  /** Clears the app's localStorage keys. */
  clearStorage(): void
  /** Full zustand state snapshot (escape hatch for assertions the table above doesn't cover). */
  getState(): unknown
  /** Merges a partial state patch directly into the store (escape hatch only — prefer real actions). */
  setState(partial: Record<string, unknown>): void
  undo(): void
  redo(): void
  /** Adds a node of `type` via the real `addNode` action, returns its id. */
  addNode(type: NodeType): string
  /** Selects a node (or clears selection with `null`) via the real action. */
  selectNode(id: string | null): void
  /** Runs the workflow to completion synchronously (`speed: 'instant'`). */
  runInstant(): void
  /** Approves the current pending approval, if any. */
  approve(): void
  /** Rejects the current pending approval, if any. */
  reject(): void
  /** Imports a workflow from raw JSON text via the real import path. */
  importJson(text: string): boolean
  /** Exports the current workflow document as JSON text. */
  exportJson(): string
}
```

Tests open the app at `/?e2e=1` (or rely on dev mode locally) and read `window.__opsflow` off
`page.evaluate`, e.g.:

```ts
await expect
  .poll(() => page.evaluate(() => window.__opsflow!.getDocument().edges.length))
  .toBe(n + 1)
```
