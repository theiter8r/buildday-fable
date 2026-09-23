# OpsFlow — Design System

Derived from the oil painting **"GOD'S PLAN."** (`public/gods-plan.jpg`): a near-black cobalt night sky built
from thick directional brush strokes, banks of cream / peach / tan impasto cloud along the bottom, a small gilded
cherub, and a luminous white serif title with a soft halo.

The product reads as **that painting turned into an instrument**: a dark, textured cobalt field (the canvas),
cream light where information lives (the panels and node cards), gold where a human decision is required
(approvals, focus, the primary action), and a single serif voice reserved for moments of arrival
(the hero, run-complete, empty states). Everything else is quiet Inter.

**Non-negotiables:** dark theme only, WCAG **AA** everywhere (verified ratios below), full keyboard operation,
always-visible focus, and `prefers-reduced-motion` honoured. Texture never sits between the eye and text.

---

## 1. Color tokens

Declared in `src/styles/tokens.css` inside `@theme { … }` (Tailwind v4) so they exist both as CSS variables
(for React Flow inline styles and canvas SVG) and as Tailwind utilities (`bg-navy-800`, `text-cream-50`).

### 1.1 Sky — backgrounds and surfaces

| Token                 | Hex                       | Role                                                |
| --------------------- | ------------------------- | --------------------------------------------------- |
| `--color-navy-950`    | `#05070F`                 | Page backdrop, the black between brush strokes      |
| `--color-navy-900`    | `#0A0F1F`                 | App shell / canvas background                       |
| `--color-navy-850`    | `#0E152B`                 | Panel background (palette, inspector, run panel)    |
| `--color-navy-800`    | `#131C38`                 | Card / node surface, input background               |
| `--color-navy-700`    | `#1B2850`                 | Raised surface, hover, selected row, dialog surface |
| `--color-navy-600`    | `#26376B`                 | Border strong, splitter, minimap mask edge          |
| `--color-line-soft`   | `rgb(255 255 255 / 0.08)` | Hairline dividers                                   |
| `--color-line`        | `rgb(155 180 255 / 0.18)` | Default border on cards and inputs                  |
| `--color-line-strong` | `rgb(155 180 255 / 0.34)` | Border on hover / focused container                 |

### 1.2 Cobalt — the brush strokes

| Token                 | Hex                      | Role                                                             |
| --------------------- | ------------------------ | ---------------------------------------------------------------- |
| `--color-cobalt-600`  | `#2B4A9E`                | Primary button fill, active tab underline                        |
| `--color-cobalt-500`  | `#3A63C8`                | Edge stroke (traversed), slider fill                             |
| `--color-cobalt-400`  | `#5B84E6`                | Decorative strokes, minimap nodes, **large text / borders only** |
| `--color-cobalt-glow` | `rgb(91 132 230 / 0.35)` | Halo behind running nodes                                        |

### 1.3 Cloud — text and light

| Token                 | Hex       | Role                                       | Contrast on `navy-850` |
| --------------------- | --------- | ------------------------------------------ | ---------------------- |
| `--color-cream-50`    | `#FBF6EC` | Primary text, display type                 | **16.8:1**             |
| `--color-cream-100`   | `#F3E8D6` | Headings on cards                          | 14.9:1                 |
| `--color-cream-200`   | `#E7D5B8` | Secondary text                             | 12.6:1                 |
| `--color-text-muted`  | `#A9B4D0` | Labels, helper text, timestamps            | 8.7:1                  |
| `--color-text-subtle` | `#8A93AE` | Placeholders, disabled text, skipped nodes | 5.9:1                  |

### 1.4 Gilt — accents

| Token               | Hex                      | Role                                               |
| ------------------- | ------------------------ | -------------------------------------------------- |
| `--color-gold-400`  | `#E8B75A`                | Focus ring, approval accent, warnings              |
| `--color-gold-300`  | `#F2CE7E`                | Gold text on dark (11.1:1 on `navy-800`)           |
| `--color-peach-300` | `#F0B98E`                | Trigger accent, hero gradient warmth               |
| `--color-gold-glow` | `rgb(232 183 90 / 0.30)` | Halo on awaiting-approval nodes and the hero title |
| `--color-on-gold`   | `#05070F`                | Text on a gold fill (**10.9:1**)                   |
| `--color-on-cobalt` | `#FBF6EC`                | Text on `cobalt-600` fill (**7.6:1**)              |

### 1.5 Semantic status — palette-native, all AA on `navy-800` and `navy-850`

| Token                    | Hex       | Meaning                                                    | On `navy-800` |
| ------------------------ | --------- | ---------------------------------------------------------- | ------------- |
| `--color-state-idle`     | `#8A93AE` | idle                                                       | 5.5:1         |
| `--color-state-pending`  | `#A9B4D0` | queued on the chosen path                                  | 8.1:1         |
| `--color-state-running`  | `#7FB0FF` | running (cobalt, lightened)                                | **7.6:1**     |
| `--color-state-success`  | `#79D3A6` | success (aged-verdigris green, keeps the oil-paint family) | **9.3:1**     |
| `--color-state-failed`   | `#FF8F82` | failed (terracotta/coral, not fire-engine red)             | **7.6:1**     |
| `--color-state-skipped`  | `#8A93AE` | skipped — always _also_ 55% opacity + dashed border        | 5.5:1         |
| `--color-state-awaiting` | `#F2CE7E` | awaiting approval (gold)                                   | **11.1:1**    |
| `--color-state-warning`  | `#E8B75A` | validation warning                                         | 9.1:1         |
| `--color-state-error`    | `#FF8F82` | validation error                                           | 7.6:1         |

Status is **never carried by hue alone**: every state also has a distinct glyph (▷ running, ✓ success,
✕ failed, ⤼ skipped, ⏸ awaiting, • idle), a distinct border treatment (solid / dashed / double), and a text
label in the node footer and timeline row.

### 1.6 Per-node-type accents

| Node       | Token                     | Hex       | Rationale                              |
| ---------- | ------------------------- | --------- | -------------------------------------- |
| Trigger    | `--color-node-trigger`    | `#F0B98E` | peach — first light at the cloud edge  |
| Condition  | `--color-node-condition`  | `#5B84E6` | cobalt — the split in the sky          |
| Action     | `--color-node-action`     | `#7FB0FF` | bright cobalt — the thing that moves   |
| Approval   | `--color-node-approval`   | `#E8B75A` | gold — the cherub, a human in the loop |
| Resolution | `--color-node-resolution` | `#79D3A6` | verdigris — the calm after             |

Each is used as a 3px left accent bar, the icon color, the minimap swatch, and a 12% tint of the node header
background. Never as body-text color.

---

## 2. Typography

| Role    | Face                                                                                                      | Tokens           |
| ------- | --------------------------------------------------------------------------------------------------------- | ---------------- |
| Display | **Cormorant Garamond Variable** (`@fontsource-variable/cormorant-garamond`), 600, small-caps-ish tracking | `--font-display` |
| UI      | **Inter Variable** (`@fontsource-variable/inter`), 400/500/600                                            | `--font-sans`    |
| Data    | `ui-monospace, "SF Mono", "JetBrains Mono", monospace` — JSON editor, field paths, timestamps, ids        | `--font-mono`    |

Fallback stack is `local()`-first with `size-adjust` tuned so the webfont swap does not reflow.

### Scale

| Token            | Size / line-height                                    | Use                                       |
| ---------------- | ----------------------------------------------------- | ----------------------------------------- |
| `--text-hero`    | `clamp(2.75rem, 7vw, 5rem)` / 1.05, tracking `0.02em` | "GOD'S PLAN."-style hero title (display)  |
| `--text-display` | `2rem` / 1.15                                         | Empty-state and dialog titles (display)   |
| `--text-title`   | `1.25rem` / 1.3, 600                                  | Panel titles (display, or sans on mobile) |
| `--text-body`    | `0.9375rem` / 1.55                                    | Default UI text (sans)                    |
| `--text-label`   | `0.8125rem` / 1.4, 500, tracking `0.01em`             | Form labels, node titles                  |
| `--text-meta`    | `0.75rem` / 1.35                                      | Timestamps, helper text, chips            |
| `--text-micro`   | `0.6875rem` / 1.2, 600, tracking `0.08em`, uppercase  | Section eyebrows, edge labels, badges     |

Rules: display serif is reserved for the hero, empty/error state titles, run-complete summary, and dialog
titles — **never** for form labels, node bodies or timeline rows. Minimum rendered text size is 11px
(`--text-micro`) and only for uppercase, tracked, high-contrast labels. Numbers in the timeline and duration
fields use `font-variant-numeric: tabular-nums`.

---

## 3. Spacing, radius, elevation, glow

**Spacing** — 4px base: `--space-1 4` `2 8` `3 12` `4 16` `5 20` `6 24` `8 32` `10 40` `12 48` `16 64`.
Panel padding 16 (mobile) / 20 (desktop); form row gap 12; section gap 24.

**Radius** — `--radius-xs 4` (chips, badges) · `--radius-sm 6` (inputs, buttons) · `--radius-md 10`
(node cards, panels sections) · `--radius-lg 16` (dialogs, sheets) · `--radius-full 9999`.

**Shadow** (cool, low-saturation, never black-only — painted shadows have blue in them):

```css
--shadow-sm: 0 1px 2px rgb(2 4 10 / 0.5);
--shadow-md: 0 6px 16px -4px rgb(2 4 10 / 0.6), 0 2px 4px rgb(2 4 10 / 0.4);
--shadow-lg: 0 24px 48px -12px rgb(2 4 10 / 0.7), 0 2px 8px rgb(2 4 10 / 0.5);
--shadow-sheet: 0 -12px 32px -8px rgb(2 4 10 / 0.7);
```

**Glow** — the painting's light source; used sparingly and never as the only signal:

```css
--glow-title: 0 0 24px rgb(251 246 236 / 0.28), 0 0 72px rgb(232 183 90 / 0.18);
--glow-running: 0 0 0 1px var(--color-state-running), 0 0 18px var(--color-cobalt-glow);
--glow-awaiting: 0 0 0 1px var(--color-state-awaiting), 0 0 18px var(--color-gold-glow);
--glow-focus: 0 0 0 2px var(--color-navy-900), 0 0 0 4px var(--color-gold-400);
```

---

## 4. Painterly texture

Three layers, all decorative, all `pointer-events: none`, all `aria-hidden`, none of them on top of text.

1. **Grain** (`.texture-grain`, in `texture.css`) — a 120×120 inline SVG `feTurbulence` data-URI
   (`baseFrequency .9`, `numOctaves 3`, grayscale, `opacity .035`, `mix-blend-mode: overlay`) tiled on the
   app shell. Fixed, does not scroll, so it reads as canvas weave rather than moving noise.
2. **Impasto sky** — on the canvas background only: two very large, very soft radial gradients
   (cobalt `#2B4A9E` at 10% and peach `#F0B98E` at 5%) offset top-left and bottom-right, plus one
   `repeating-linear-gradient(112deg, transparent 0 7px, rgb(91 132 230 / .025) 7px 9px)` to hint the
   directional brush strokes. React Flow's dot `<Background>` sits above it at `color: rgb(155 180 255 / .12)`,
   gap 22, size 1.
3. **Cloud bloom** — panels get a single `radial-gradient(120% 80% at 50% 120%, rgb(243 232 214 / .05), transparent)`
   at their bottom edge, echoing the cream cloud bank lifting into the night.

**Contrast guarantee:** all three layers combined shift luminance by <2%. Every text surface is a solid
token color; texture layers are siblings behind content, never parents with opacity. Panels that overlay the
hero image use a solid `navy-850` at ≥92% opacity plus `backdrop-filter: blur(8px)` — the image never bleeds
through a paragraph.

---

## 5. Component specs

### Shell and panels

Full-height grid, `navy-900` shell, panels `navy-850` separated by 1px `--color-line-soft` (no heavy borders —
the value difference does the work). Panel header: 48px, `--text-micro` uppercase eyebrow in
`--color-text-muted`, actions right-aligned as 32px icon buttons. Panel bodies scroll independently
(`overflow-y:auto; overscroll-behavior: contain`) with a 2px cobalt scrollbar thumb. The vertical splitters
are 4px hit-area-8px `role="separator"` handles that show a cobalt line on hover/focus.

### Node cards (canvas)

220×auto, `navy-800`, `--radius-md`, 1px `--color-line`, `--shadow-md`, 3px left accent bar in the type color.
Header row: 16px type icon (type accent) · label in `--text-label` cream-100 · state glyph right.
Body: 2–3 config lines in `--text-meta` `--color-text-muted`, e.g. `#incidents · 1200ms`, with the primary
value in cream-200. Footer strip (only during a run): state label + `+1.4s` offset in mono.

- **Trigger** — peach accent, bolt icon, top edge slightly rounded-out; **no** target handle. Body:
  `PagerDuty · 2 filters`.
- **Condition** — cobalt accent, branch icon, rendered as a soft diamond-notched card (clipped corners, not a
  literal rotated diamond — rotation ruins text). Two labelled source handles, bottom-left `TRUE`, bottom-right
  `FALSE`, each a 10px circle with a `--text-micro` pill label offset 6px.
- **Action** — bright-cobalt accent, per-action icon (pager, slack, ticket, rollback, scale, runbook).
  `simulateFailure` shows a coral `WILL FAIL` badge so the graph is honest at a glance.
- **Approval** — gold accent, shield/hand icon, a gold hairline top border. When `awaiting-approval`: gold glow,
  and two real inline buttons **Approve** / **Reject** (36px, keyboard reachable, in tab order).
- **Resolution** — verdigris accent, flag icon, status chip (`RESOLVED` / `MITIGATED` / `ESCALATED`),
  a small "PM" badge when a postmortem is required; target handle only.

Selected: 2px `--color-cobalt-400` border + `--shadow-lg`. Focused (keyboard): `--glow-focus`.
Has errors: 1px `--color-state-error` border + a 8px dot badge at the top-right.
Skipped: `opacity .55`, dashed border, grayscale icon.

### Edges

2px bezier, default `rgb(155 180 255 / .30)`. Traversed: `--color-cobalt-500`, 2.5px, with an animated dash
flow during the run. Skipped: 1.5px dashed `--color-text-subtle` at 45% opacity. Failed: `--color-state-failed`.
Arrow markers match the stroke. Branch labels are pill chips on the edge midpoint: `TRUE` in
`--color-state-success` on a `navy-900` pill, `FALSE` in `--color-text-muted`; once a run decides a branch the
taken pill fills solid (`on-gold`-style dark text on the accent) and the other drops to 40% opacity.
Hover shows a small delete affordance; the edge is also selectable and deletable by keyboard.

### Controls / minimap

Bottom-left cluster in a `navy-850/90` `--radius-md` capsule with `backdrop-filter: blur(6px)`: zoom out, zoom
in, fit view, undo, redo — each a labelled 32px icon button with a tooltip and `aria-label`.
Minimap bottom-right, 160×110, `navy-950` mask at 72%, nodes in their type accent, 1px `--color-line` frame.
Both hidden below 640px except the fit-view button, which moves into the top bar.

### Inspector forms

One column, 12px row gap. Label `--text-label` cream-200 above the control; helper text `--text-meta` muted
below. Inputs: 36px (40px on touch), `navy-800`, 1px `--color-line`, `--radius-sm`, cream-50 text,
`--color-text-subtle` placeholder; hover raises the border to `--color-line-strong`; focus applies
`--glow-focus` and a cobalt border. Selects use a native `<select>` styled to match (real keyboard behaviour
beats a custom listbox). Number inputs get a unit suffix (`ms`) inside the field. Toggles are 44×24 pill
switches — gold when on, `navy-600` when off, with a check glyph so they are not color-only.
Invalid: coral border + coral `--text-meta` message + `aria-invalid`. Section headers are `--text-micro`
uppercase muted with a hairline rule. A sticky footer shows **Duplicate** and **Delete** (danger ghost).

### Run panel and timeline

Header: status chip (idle / running / awaiting / completed / failed / rejected) + elapsed simulated time in mono.
Player: a primary Play button (cobalt-600 fill, cream-50 text), pause, reset, and a 3-way segmented speed
control `1× · 2× · Instant` (`role="radiogroup"`, gold underline on the selected segment). A 4px progress rail
in `navy-700` fills cobalt as the cursor advances.
Timeline rows: 40px, grid `[64px time] [20px glyph] [1fr text] [auto badge]`, mono offset (`+0.00s`) in muted,
state glyph in the state color, message in cream-200 with the node label in cream-50, hairline separators,
`navy-800` on hover. Each row is a button that selects and centres its node. Branch rows show a `TRUE`/`FALSE`
chip; approval rows show the approver role; the final row is a serif one-line summary
("Resolved — rollback completed in 4.3s").
The payload editor sits above with a `Form | JSON` segmented toggle; JSON mode is a mono textarea with a live
zod status line ("Valid payload" / "severity: expected one of critical, high, medium, low").

### Buttons

`primary` cobalt-600 fill / cream-50 text · `secondary` `navy-700` fill / cream-100 text / 1px line ·
`ghost` transparent / cream-200, hover `navy-800` · `danger` transparent with coral text and coral border,
solid coral-tint fill on hover · `gold` (used only for Approve and the hero CTA) gold-400 fill with
`--color-on-gold` text. Heights 36 (default) / 32 (compact) / 44 (touch). Disabled: 45% opacity,
`cursor: not-allowed`, and **always** paired with a tooltip or adjacent text explaining why.
Loading buttons keep their width and swap the label for a 16px spinner plus `aria-busy`.

### Dialogs, sheets, toasts

Dialog: `navy-850` at `--radius-lg`, `--shadow-lg`, 1px `--color-line`, max-width 560, backdrop
`rgb(5 7 15 / .72)` + `blur(4px)`. Title in display serif `--text-display`. Focus trapped, Escape closes,
focus returns to the trigger. Bottom sheet: same surface, `--radius-lg` top corners only, `--shadow-sheet`,
a 36×4 `navy-600` grab handle, snap points 40% / 60% / 92%, drag-to-dismiss, safe-area bottom padding.
Toasts: bottom-right (desktop) / above the tab bar (mobile), `navy-700`, 1px line, 4px left bar in the
semantic color, title cream-50 + body muted, auto-dismiss 4s (errors never auto-dismiss), dismiss button,
`role="status"` for success/info and `role="alert"` for errors, max 3 stacked.

### Empty / loading / success / error

- **Hero / welcome** (`public/gods-plan.jpg`): the painting as a `background-size: cover` layer, above it
  `linear-gradient(180deg, rgb(5 7 15 / .45) 0%, rgb(5 7 15 / .72) 55%, rgb(10 15 31 / .95) 100%)` plus a
  1.5px cream inner hairline. Centred display title **OpsFlow** with `--glow-title`, one muted sentence
  ("Design and simulate an incident response before the incident."), and two real buttons —
  **Load the demo incident** (gold) and **Start blank** (secondary). Image gets `alt=""` (decorative) and the
  overlay guarantees ≥ 7:1 for the title and ≥ 4.5:1 for the subtitle at every viewport.
- **Empty canvas** — the hero image at 18% opacity behind a dashed `--color-line` drop zone: "Drag a node here,
  or pick one from the palette." with an inline Add Trigger button.
- **Empty inspector** — centred muted line "Select a node to configure it." plus a hint listing the shortcuts.
- **No run yet** — timeline placeholder: "Run the workflow to see the path light up." + the Run button reason.
- **Loading** — shimmerless skeletons (cobalt-tinted `navy-800` blocks at 3-step opacity pulse, 1.4s) for the
  boot gate and import parse; never a bare spinner on a full screen.
- **Success** — run-complete card at the top of the timeline: verdigris hairline, serif one-liner, node/duration
  counts, and **Run again** / **Export** buttons.
- **Error** — coral hairline card with a plain-language title, the technical detail in a collapsible mono block,
  and at least one recovery action (Reset to demo / Download raw data / Try again). Corrupt storage and import
  failures use this exact component.

---

## 6. Motion

Durations `--dur-fast 120ms` · `--dur 200ms` · `--dur-slow 320ms`; easing
`--ease-out cubic-bezier(.16,1,.3,1)` (UI) and `--ease-soft cubic-bezier(.4,0,.2,1)` (transforms).

| Element           | Motion                                                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Running node      | 1.6s `ease-in-out` infinite pulse of `box-shadow` spread (`--glow-running`), 1 → 1.012 scale. Opacity/box-shadow only, no layout. |
| Awaiting approval | 2.4s slow gold breathe + a static gold ring so the state is legible in a screenshot.                                              |
| Edge flow         | `stroke-dasharray: 6 8` with `stroke-dashoffset` animating 0 → -14 over 700ms linear, only on the currently traversing edge.      |
| Branch decision   | The chosen pill scales 0.9 → 1 and fades in over `--dur`; the other fades to 40%.                                                 |
| Node add          | fade + 4px rise, `--dur`, `--ease-out`.                                                                                           |
| Node delete       | fade + 0.96 scale, `--dur-fast`.                                                                                                  |
| Timeline row      | new rows slide in 8px from the top with a 30ms stagger, capped at 6 concurrent.                                                   |
| Panels / sheets   | transform-only slide, `--dur-slow`, `--ease-out`; backdrop fades `--dur`.                                                         |
| Toast             | slide 12px + fade in `--dur`, fade out `--dur-fast`.                                                                              |
| Buttons           | background `--dur-fast`; active `scale(.98)`.                                                                                     |
| fitView           | 400ms (0 when reduced motion).                                                                                                    |

`@media (prefers-reduced-motion: reduce)`: all of the above collapse to instant or to a ≤80ms opacity fade;
the pulse becomes a static ring, the edge dash becomes a solid highlighted stroke, sheets appear without
translation, `fitView duration: 0`, and the run player's _step timing is preserved_ — pacing is information,
not decoration. The `useReducedMotion` hook also feeds React Flow so its internal transitions are disabled.

---

## 7. Accessibility rules

- AA minimum everywhere; the ratios in §1 are measured, and body text is ≥ 5.4:1 in every combination shipped.
- Focus ring: `--glow-focus` (2px navy gap + 2px gold) on **every** focusable element, including canvas nodes,
  edges, handles, splitters and sheet grab handles. `:focus-visible` only — never `outline: none` without a
  replacement.
- Full keyboard path: Tab reaches palette → canvas nodes (document order) → inspector → run panel. Enter on a
  palette card adds a node; Enter on a node opens the inspector; arrow keys nudge; Escape backs out one level.
  The shortcut list is discoverable via a `?` dialog and the empty-inspector hint.
- Status is never color-only: glyph + text label + border style accompany every state and every validation issue.
- `aria-live="polite"` region narrates run progress and save state; `role="alert"` for failures and rejected runs.
- All icon-only buttons have `aria-label` and a tooltip; all inputs have real `<label for>`; all groups use
  `fieldset`/`legend` or `role="radiogroup"` with `aria-labelledby`.
- Canvas nodes expose `aria-label="Action node: Page on-call, running"` and `aria-describedby` pointing at their
  issue list; the whole canvas has `role="application"` with an instructions `aria-describedby`.
- Touch targets ≥ 44×44 on phone; hit areas ≥ 32px on desktop.
- Respects `prefers-reduced-motion`, `prefers-contrast: more` (borders go to `--color-line-strong`, glows off),
  and browser text zoom to 200% without clipping (panels scroll, no fixed pixel heights on text containers).
- The hero image is decorative (`alt=""`, `aria-hidden`) and never carries information.

---

## 8. Responsive

| Breakpoint            | Layout                                                                                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `< 640px` (phone)     | Single surface: canvas + top bar + bottom tab bar. Palette = left drawer (FAB), inspector = bottom sheet, run = full sheet with tabs. Minimap hidden. |
| `640–1023px` (tablet) | Canvas + one docked right panel (inspector or run, toggled by a segmented control). Palette becomes a 64px icon rail with tooltips.                   |
| `1024–1439px`         | Three panes `[240] [1fr] [320]`; run panel docks under the canvas at 220px.                                                                           |
| `≥ 1440px` (target)   | Three panes `[280] [1fr] [360]`; run dock 260px; timeline and payload side by side.                                                                   |

### Mobile layout sketch — 390×844

```
┌───────────────────────────────────────┐ 0
│ ☰  Critical API Incident   ⚠2  ▶ Run ⋯│ 52   top bar (name truncates, validation chip, Run, overflow)
├───────────────────────────────────────┤
│                                       │
│      ┌──────────────┐                 │
│      │ ⚡ Trigger    │                 │
│      │ PagerDuty    │                 │      canvas: 1-finger pan, pinch zoom,
│      └──────┬───────┘                 │      tap node -> inspector sheet
│        ┌────┴─────┐                   │
│        │ ⑂ severity│                  │
│        │ == critical│                 │
│        └─TRUE─┬─FALSE┐                │
│          ┌────┴──┐ ┌─┴────┐           │
│          │ Page  │ │Ticket│           │
│          └───────┘ └──────┘           │
│                                       │
│                            ╭───────╮  │      FAB: opens palette drawer
│                            │  + ▾  │  │ 720
├───────────────────────────────────────┤
│  ▶ Running · Page on-call   1× 2× ⚡  │ 96   mini-player (only during a run)
├───────────────────────────────────────┤
│  ⬚ Canvas   ⊞ Palette   ⚙ Node   ▶ Run│ 64   tab bar + safe-area inset
└───────────────────────────────────────┘ 844
```

Inspector sheet (on node tap) covers the bottom 60%, canvas pans the selected node into the visible 40%:

```
┌───────────────────────────────────────┐
│            ▂▂▂▂  (grab)               │
│  ACTION                            ✕  │
│  Label      [ Page on-call         ]  │
│  Action     [ page-oncall        ▾ ]  │
│  Target     [ sre-primary          ]  │
│  Duration   [ 1200            ms   ]  │
│  Simulate failure            [ ○   ]  │
│  ───────────────────────────────────  │
│  [ Duplicate ]            [ Delete ]  │
└───────────────────────────────────────┘
```

Verified at both target sizes: no horizontal scroll, no element narrower than its content, all controls
reachable with the on-screen keyboard open (sheets use `dvh` and scroll their body).
