# Store lane notes

Requested changes to shared contracts the store lane does not own. Nothing here blocks
the store lane — everything is implemented against a local adapter/type in the meantime.

## `src/vite-env.d.ts` — extend `OpsflowTestHandle`

The task brief for this lane asks for a richer `window.__opsflow` than
`docs/testing-conventions.md`'s documented interface: `addNode(type)`, `selectNode(id)`,
`runInstant()`, `approve()`, `reject()` (no-arg convenience over the pending approval),
`importJson(text)`, `exportJson()`, in addition to the existing
`getDocument/getRun/connect/setPayload/reset/clearStorage/getState/setState/undo/redo`.

`src/store/testHandle.ts` implements all of these today via a local
`OpsflowTestHandleExtended` interface and assigns it to `window.__opsflow` as a typed
variable (not an object literal), which sidesteps TypeScript's excess-property check
against the narrower global type — so this is **not blocking**, just undocumented at the
global-type level. If you'd like the global contract to match, add to
`OpsflowTestHandle` in `src/vite-env.d.ts`:

```ts
addNode: (type: NodeType) => string
selectNode: (id: string | null) => void
runInstant: () => void
approve: () => void
reject: () => void
importJson: (text: string) => boolean
exportJson: () => string
```

and update `docs/testing-conventions.md`'s `OpsflowTestHandle` snippet to match.

## Boot semantics — ARCHITECTURE.md §8 vs. this lane's task brief

ARCHITECTURE.md §8 has a missing-`localStorage`-key boot show an interactive
`HeroWelcome` ("Load the demo incident" / "Start blank"). This lane's task brief instead
says "first-ever boot loads the demo workflow" outright. `src/store/boot.ts` follows the
task brief: `bootWorkflowStore` loads the demo workflow itself on a missing key (the
store's initial state already defaults to it, so this is a no-op in the common case).

If the app lane wants a `HeroWelcome`-style first-run affordance instead, it's free to
layer one on top — e.g. show it whenever `bootWorkflowStore(...).status === 'first-boot'`
and let its "Start blank" button call `setDoc(EMPTY_WORKFLOW(), 'clear')`. No store change
needed either way; flag here in case the UI lane wants to coordinate on this.

## What other lanes get from `@/store`

Importing the barrel (`import '@/store'` or any named import from it) side-effect-installs,
against the live `workflowStore` singleton:

- `bootWorkflowStore(workflowStore)` — restores from persistence or loads the demo.
- `installAutosave(workflowStore)` — 600ms-debounced autosave.
- `installTestHandle()` — `window.__opsflow`, only under `?e2e=1` or dev.

None of these run against `createWorkflowStore()` test instances.
