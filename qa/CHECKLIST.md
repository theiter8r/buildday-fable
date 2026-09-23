# OpsFlow — Manual QA Checklist

Run this pass before every release candidate, at both **1440×900** (desktop) and **390×844**
(mobile), in a real Chromium-based browser (not just the automated Playwright run). Check every
box; do not skip a row because "it probably still works."

## 1. Four states, every async/empty surface (ARCHITECTURE.md §12)

- [ ] **Empty** — fresh browser profile, no `localStorage`: hero/welcome screen shows, `alt=""` on
      the painting, "Load the demo incident" and "Start blank" both work.
- [ ] **Empty canvas** — "Start blank" shows the dashed drop-zone empty state with an inline Add
      Trigger affordance.
- [ ] **Empty inspector** — deselect everything (click empty canvas / Escape): "Select a node…"
      copy shows, no leftover form fields from the previous selection.
- [ ] **Empty timeline** — before any run: "Nothing has run yet. Press Run to start." copy shows.
- [ ] **Empty issues** — a clean workflow shows "No issues found. This workflow is ready to run."
- [ ] **Loading** — boot skeleton is visible for at least one frame on a throttled network (DevTools
      "Slow 4G"); import-parsing shows a loading state, not a frozen dialog.
- [ ] **Success** — run-complete card, save-status "Saved · …" chip, import/export toasts all
      appear and auto-dismiss (except errors).
- [ ] **Error** — corrupt `localStorage` value (`JSON` garbage in `opsflow:document:v2`) shows the
      full-panel error state with Reset-to-demo and Download-raw-data, not a blank screen or a
      console-only failure.

## 2. Keyboard-only pass (unplug the mouse)

- [ ] Tab order: palette → canvas nodes (document order) → inspector → run panel, with no dead
      ends and no focus trap outside of open dialogs/sheets.
- [ ] Enter on a focused palette card adds a node at the viewport centre.
- [ ] Enter on a focused canvas node opens the inspector.
- [ ] Arrow keys nudge the selected node 8px (16px with Shift); confirmed via position readout or
      by checking `window.__opsflow.getDocument()` in the console.
- [ ] `Cmd/Ctrl+Z` / `Shift+Cmd/Ctrl+Z` undo/redo from anywhere outside a text field.
- [ ] `Cmd/Ctrl+D` duplicates the current selection; `Delete`/`Backspace` deletes it.
- [ ] `Cmd/Ctrl+A` selects all nodes; `Escape` clears selection, then closes the top-most
      sheet/dialog on a second press.
- [ ] Every dialog and bottom sheet traps focus and returns it to the trigger element on close.
- [ ] The `?` shortcuts-help dialog is reachable by keyboard and lists every shortcut above.

## 3. Contrast & color (WCAG AA)

- [ ] Body text, labels, and timestamps hold ≥4.5:1 against their surface at both `navy-800` and
      `navy-850` (spot-check with a contrast checker against the hexes in DESIGN.md §1).
- [ ] Every run/validation state is legible with color vision deficiency simulation on (glyph +
      border + text label present, not color alone) — check Chrome DevTools' vision-deficiency
      emulation for at least protanopia and deuteranopia.
- [ ] Focus ring (`--glow-focus`) is visible on every focusable element, including canvas nodes,
      edges, handles, splitters, and sheet grab handles — never `outline: none` without it.
- [ ] `prefers-contrast: more` emulation: borders shift to `--color-line-strong`, glows turn off,
      nothing becomes unreadable.

## 4. `prefers-reduced-motion: reduce`

- [ ] Emulate reduced motion (DevTools → Rendering → Emulate CSS media feature
      `prefers-reduced-motion`). Confirm: no edge dash animation, no node pulse (static ring
      instead), sheets/panels appear without a slide (fade only), `fitView` jumps instantly.
- [ ] Run step **timing** (the pacing between timeline rows) is unchanged — reduced motion removes
      decoration, not information.

## 5. 1440×900 (desktop)

- [ ] Three-pane grid renders with no overlap; palette and inspector splitters are draggable and
      keyboard-operable (`role="separator"`, arrow keys).
- [ ] Run panel docks under the canvas, collapsible, and the canvas + timeline stay visible during
      a run.
- [ ] Minimap and zoom/undo/redo controls are visible in the bottom-left capsule and bottom-right
      minimap; all have tooltips and `aria-label`s.
- [ ] Browser zoom to 200%: no clipped text, panels scroll instead of overflowing the viewport.

## 6. 390×844 (mobile)

- [ ] No horizontal scroll anywhere (`document.scrollingElement.scrollWidth <= 390`).
- [ ] Palette opens as a left drawer from the FAB/tab, tapping a card adds the node at the
      viewport centre and opens the inspector sheet.
- [ ] Inspector sheet covers ≤60% of the height, canvas pans the selected node into the visible
      area, drag-handle drag-to-dismiss and swipe-down both work.
- [ ] Run panel opens as a full sheet with Payload/Timeline/Issues tabs; during playback it docks
      to the 96px mini-player.
- [ ] All touch targets are ≥44×44px; one-finger pan and pinch-zoom work on the canvas;
      pull-to-refresh does not hijack the page (`overscroll-behavior: none`).
- [ ] On-screen keyboard open (tap a text field): the field remains visible, sheets use `dvh` and
      scroll their own body rather than being pushed off-screen.

## 7. Automated coverage cross-check

- [ ] `npm run test:e2e -- --project=desktop` and `--project=mobile` both pass locally before
      sign-off (informational once the UI lanes land — this checklist exists for what automation
      can't see: real device feel, real contrast, real motion).
- [ ] `npm run screenshots` produces every file listed in `docs/ARCHITECTURE.md` §13/§2 evidence
      set under `qa/screenshots/`, and each one is reviewed by eye, not just "exists on disk."
