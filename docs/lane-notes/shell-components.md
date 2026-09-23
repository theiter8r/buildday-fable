# shell-components lane notes

No shared-contract changes requested — everything below was handled with local adapters inside
this lane's own files, or resolved once the concurrently-landing lanes finished.

## Placeholders — swapped back to real implementations during this pass

`src/panels/{PalettePanel,InspectorPanel,RunPanel}.tsx` and `src/canvas/FlowCanvas.tsx` did not
exist (only `.gitkeep`) when this lane started, so `AppShell`/`MobileChrome` were initially wired
to thin local placeholders under `src/app/_placeholders/`. The panels/canvas lanes finished
mid-session; `AppShell.tsx` and `MobileChrome.tsx` now import the real
`@/panels/*`/`@/canvas/FlowCanvas` (zero-arg component signatures matched exactly), and
`src/app/_placeholders/` has been deleted. `AppShell` also wraps the whole three-pane/mobile grid
in the canvas lane's `<FlowProvider>` (`@/canvas/FlowProvider`) so the palette/inspector can call
`useReactFlow()` too, not just the canvas.

## Store lane landed mid-session — one BootGate adjustment made because of it

`@/store`'s barrel (`store/index.ts`) now runs `bootWorkflowStore(workflowStore)` as a module
side effect (see `store/boot.ts`), which already loads the persisted document into the store
before `BootGate` ever mounts. `BootGate` originally also called `setDoc(loaded.doc, 'import')`
itself on a successful load, which would have pushed a second, redundant `replace-doc` command
onto the undo stack at every boot. Fixed: `BootGate` now only *reads* `loadWorkflow()` for display
purposes (choosing hero vs. editor vs. error-state) and never calls `setDoc` — the store's own
boot is authoritative for what `document` actually is. The corrupt/reset path still uses the real
`resetToDemo()` action, and detection of the corrupt case is still `BootGate`'s own read, so this
required no coordination beyond the fix.

The store's `Toaster`-relevant actions (`pushToast`/`dismissToast`) also landed real (with their
own 4s auto-dismiss timer, skipping `error`), so `Toaster.tsx`'s previously-planned component-level
auto-dismiss `useEffect` was removed to avoid a duplicate timer — the store owns dismiss timing.

## Deliberate deviations from ARCHITECTURE.md (contract files / task brief won where they conflicted)

- `App.tsx` stays at `src/App.tsx` (not moved to `src/app/App.tsx`) because `main.tsx` — a file
  this lane doesn't own — already imports `./App.tsx`. All other shell modules live in `src/app/**`
  as specified. The `<ReactFlowProvider>` ARCHITECTURE.md §2 places at the `App.tsx` level is
  instead one level lower, inside `AppShell`, so `BootGate`'s hero/error states aren't pointlessly
  wrapped in it.
- Desktop layout uses a single ≥1024px three-pane breakpoint (`280px | 1fr | 360px`) per the task
  brief's literal instructions, rather than DESIGN.md §8's finer `1024–1439` (`240/1fr/320`) vs.
  `≥1440` (`280/1fr/360`) split. Gap: the 1024–1439 case currently renders the wider column set.
