# Panels lane notes

Written while `src/components/**` (primitives) and `src/canvas/**` (React Flow
surface) were still empty/in progress. Everything below is a request for the
integration worker to reconcile, not a blocker — the panels lane is fully
functional against local fallbacks in the meantime.

## Local fallbacks to swap out

All under `src/panels/_fallback/`, each documented inline with which real
primitive it stands in for:

- `Button`, `Field`, `Select`, `Toggle`, `RadioGroup`, `Textarea`, `Tabs`,
  `Chip`, `Badge`, `Tooltip`, `Dialog`, `ConfirmDialog` → swap for
  `src/components/{Button,Field,Select,Toggle,RadioGroup,Textarea,Tabs,Chip,Badge,Tooltip,Dialog,ConfirmDialog}.tsx`
  once they land, matching ARCHITECTURE.md §2's prop shapes as closely as
  this lane could infer them without seeing the real files. Once swapped,
  delete the `_fallback` files that are no longer imported anywhere.
- `useAddNodeAtCenter` → the real `src/canvas/useAddNodeAtCenter.ts` now
  exists but calls `useReactFlow()`, so it only works once
  `<FlowProvider>`/`<ReactFlowProvider>` wraps `<AppShell>` in `src/App.tsx`
  (currently commented out — see that file's note: the canvas lane's
  `FlowProvider.tsx` isn't wired in yet). Left on the fallback (fixed
  `{x:320,y:200}`) until that wiring lands, to avoid `PalettePanel` crashing
  outside a `ReactFlowProvider`; swap `PalettePanel.tsx`'s import from
  `./_fallback` to `@/canvas/useAddNodeAtCenter` once it does.
- `useIsMobile` — **done.** `src/app/useMediaQuery.ts#useIsMobile` landed;
  `PalettePanel` now imports it directly and the local fallback was deleted.

## Contract mismatches noticed (no files changed to resolve these)

1. **Trigger source enum vs. CONTENT.md options.** `TriggerConfig.source`
   (domain/types.ts) is `'pagerduty' | 'datadog' | 'sentry' | 'cloudwatch' |
   'manual' | 'webhook'`, but CONTENT.md §3 only lists four source options
   (`pagerduty`, `datadog`, `manual`, `synthetic`) with no `synthetic` value
   in the type. `TRIGGER_FIELDS.source.options` in `src/panels/content.ts`
   fills the gap with plain labels for `sentry`/`cloudwatch` and maps
   CONTENT's "Synthetic check" label onto the `webhook` value. Flag for
   whoever owns CONTENT.md next to reconcile the six-value enum with real
   copy for all six.
2. **ValidationCode (domain/types.ts) vs. CONTENT.md §4 validation codes.**
   The two code lists don't match 1:1 (e.g. domain has
   `CONDITION_MISSING_BRANCH`/`ACTION_MISSING_TARGET`/`APPROVAL_MISSING_ROLE`
   where CONTENT.md has a single generic `MISSING_CONFIG` template, and
   domain has no `DANGLING_EDGE`/`PATH_WITHOUT_RESOLUTION` codes at all).
   `ValidationPanel` sidesteps this by rendering `issue.message` directly
   (already the human, imperative string `validateWorkflow` produces per
   ARCHITECTURE.md §6) rather than re-deriving title/body copy from
   CONTENT.md's differently-keyed table. If CONTENT.md's validation section
   is meant to be the literal panel copy, `validation.ts` (domain lane) is
   the file that needs the codes renamed/added to match — not this panel.
3. **`palette.instruction.*` / node hint copy** lives in
   `src/panels/content.ts`, copied verbatim from CONTENT.md §2. If
   CONTENT.md changes, only that one file needs updating.

## New testid requested (not added to docs/testing-conventions.md — not my lane)

`PlayerControls` has no dedicated testid for its primary Run/Resume button
(the canonical `run-button` in testing-conventions.md is documented as the
top bar's control). It currently relies on `getByRole('button', { name:
'Run workflow' | 'Resume run' })`. If e2e specs need a direct hook to the
in-panel button (as opposed to the top bar's), add e.g.
`player-run-button`/`player-resume-button` to
`docs/testing-conventions.md` and this file in the same change.

## Notable choices

- `PALETTE_DND_TYPE = 'application/opsflow-node'` per ARCHITECTURE.md §2/§10
  and the task brief, **not** `application/opsflow-node-type` as written in
  `docs/spikes/react-flow-playwright.md`'s example. The canvas lane's
  `useDropToAdd.ts` should read the same constant — consider exporting it
  from a shared location (currently `src/panels/PalettePanel.tsx`) if canvas
  wants to import it directly rather than hard-coding the string again.
- `useNodeField`/`useDebouncedCommit` debounce text/number fields at the
  `CONFIG_COALESCE_MS` (400ms) window from `domain/constants.ts`, but commit
  **immediately** for discrete controls (select/toggle/radio) via an
  `immediate: true` option — debouncing a dropdown choice would just add
  latency with no coalescing benefit (there's nothing to coalesce).
- `ApprovalForm`'s timeout field displays/edits **minutes** (matching
  CONTENT.md's "Timeout (min)" label) but converts to/from `timeoutMs`
  before calling `updateNodeConfig`, since `ApprovalConfig.timeoutMs` is
  stored in milliseconds (domain/types.ts).
