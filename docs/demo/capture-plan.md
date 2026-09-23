# OpsFlow — Playwright Capture Plan

Practical plan for capturing `docs/demo/STORYBOARD.md` once the app is built. `docs/testing-conventions.md`
does not exist in this repo yet, so every selector below is **inferred from `docs/ARCHITECTURE.md` §11**
(the `window.__opsflow` test handle, the mandatory data-testid examples like
`[data-testid="node-condition-1"]`, `[data-handleid="true"]`, `data-run-state`) and from the accessible
names/roles given throughout ARCHITECTURE and CONTENT (`getByRole`/`getByLabel` is the primary pattern per
§11: "tests prefer `getByRole`/`getByLabel` and fall back to testids only for canvas internals"). Anywhere a
concrete testid string isn't already written down in ARCHITECTURE, it's marked **[INFERRED]** and listed
again in the "Not yet verified" section at the end.

---

## 1. Viewport and recording settings

Two Playwright projects, matching `playwright.config.ts` (ARCHITECTURE §2: "chromium only... 2 projects:
desktop 1440x900, mobile 390x844") plus a dedicated capture config layered on top so normal CI runs aren't
slowed down by video:

```ts
// capture.config.ts (new, capture-only — not the CI playwright.config.ts)
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/capture',
  timeout: 120_000,
  retries: 0,
  workers: 1, // serial: shots reuse localStorage state between some clips
  projects: [
    {
      name: 'demo-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2, // crisp footage for a 1920x1080 export
        recordVideo: { dir: 'qa/capture/desktop', size: { width: 1440, height: 900 } },
        video: 'on',
      },
    },
    {
      name: 'demo-mobile',
      use: {
        ...devices['Desktop Chrome'], // NOT a touch-emulation device preset; see §3 note on real mouse drags
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3, // matches real phone pixel density for the vertical export
        recordVideo: { dir: 'qa/capture/mobile', size: { width: 390, height: 844 } },
        video: 'on',
      },
    },
  ],
})
```

**Recording method: native video via `recordVideo`, not per-frame screenshots**, as the primary path. Reasons:

- The storyboard's signature beats (edge dash-flow, node pulse, approval gold breathe, timeline row
  stagger, sheet slide) are continuous CSS/SVG animations (DESIGN §6) — a screenshot cadence would have to
  sample faster than the animation's own timing to avoid visible stepping, which is wasteful and still
  risks aliasing against the `1.6s`/`700ms`/`2.4s` animation periods.
- `recordVideo` produces WebM directly off Chromium's compositor, so motion is smooth without extra
  encoding logic in test code.

Per-frame screenshots are the **fallback path only** — see §7.

---

## 2. The `e2e` flag: what it's for, and which shots must NOT use it

ARCHITECTURE §11 defines the flag: `?e2e=1` (or `MODE === 'test'`) installs `window.__opsflow`, a plain
pass-through to the same store actions the UI calls. Nothing in ARCHITECTURE says the flag disables CSS
transitions or forces instant timers by itself — the actual determinism levers are (a) the **Instant**
speed setting (`run.controls.speed.instant`, a real UI/store feature, always available with or without the
flag) and (b) `prefers-reduced-motion`, which independently collapses all of DESIGN §6's motion to instant
or ≤80ms fades. So concretely:

- **Use `?e2e=1`** whenever a shot needs `window.__opsflow` for connecting nodes without a fragile drag, for
  reading `getDocument()`/`getRun()` to assert state before advancing the capture script, or for
  `window.__opsflow.reset()` / `clearStorage()` to guarantee a clean starting document between takes.
- **Do NOT set `prefers-reduced-motion: reduce`, and do NOT use Instant speed**, for Shot 3 (building the
  workflow — node-add fade/rise and edge draw must read as intentional, not snapped), Shot 5 (the critical
  run — the entire point is the node-by-node pulse, the edge dash-flow, the branch-pill fill animation, and
  the gold awaiting-approval breathe; Instant speed applies all events synchronously per ARCHITECTURE §4 and
  would make the pause invisible), Shot 6 (2× is still real interpolated playback, not Instant), and Shot 8
  (mobile sheet/drawer slide transforms are load-bearing for "feels native").
  → For these shots, launch the browser context with `reducedMotion: 'no-preference'` explicitly (Playwright
  defaults can vary by OS), and drive the player via the real **1×** / **2×** UI control, not `instant`.
- **Fine to use `?e2e=1` freely, including Instant speed / reduced motion**, for any shot that only needs a
  *result state* on screen and isn't demonstrating the animation itself: Shot 4's "issue fixed → Run
  enabled" beat can be reached instantly before the camera-relevant hover/click is captured; Shot 7's
  reload/export/import has no animation to preserve; between-shot setup (loading the demo, seeding a
  specific payload) should always use the flag/handle rather than clicking through the UI off-camera.

Every capture script should navigate to `/?e2e=1` for setup and state assertions regardless, since the
handle is documented as "not a second code path" (§11) — using it to seed state doesn't fake anything the
UI itself wouldn't do.

---

## 3. Per-shot interaction script

Selectors use `getByRole`/`getByLabel` from CONTENT.md strings first, falling back to the `data-testid`
pattern shown in ARCHITECTURE §11 (`node-<type>-<slug>`, `.react-flow__handle-{top,bottom}[data-handleid=...]`)
where CONTENT has no accessible name to hook (canvas internals). Testids not explicitly spelled out in
ARCHITECTURE (e.g. exact node ids for the demo graph) are **[INFERRED]**.

### Shot 1 — Title card
1. `page.goto('/')` with `localStorage` cleared (fresh hero state, no `?e2e=1` needed — this is the
   pre-boot hero, `HeroWelcome`).
2. Hold 2s on load before any interaction (title glow should be static/settled, not mid-fade-in).

### Shot 2 — The problem
- Not app footage; captured/edited outside Playwright (stock/mock screens). No script needed here.

### Shot 3 — Building the workflow
1. `page.goto('/?e2e=1')`, then `window.__opsflow.reset()` is **not** used here — instead
   `window.__opsflow.clearStorage()` then reload to land on `HeroWelcome`, click
   `getByRole('button', { name: 'Start from a blank canvas' })` (`hero.cta.secondary`).
2. `getByRole('button', { name: 'Add Trigger node' })` **[INFERRED — pattern from §11's documented example
   `'Add Action node'`, extrapolated to the other four types]** → click (adds at viewport center, selects it).
3. In the Inspector, `getByLabel('Name')` → fill "Checkout API alerts"; `getByLabel('Source')` → select
   "PagerDuty webhook" (`inspector.trigger.source.option.pagerduty`).
4. `getByRole('button', { name: 'Add Condition node' })` → click. Fill `getByLabel('Name')` → "Is this
   critical?"; `getByLabel('Field')` → "Severity"; `getByLabel('Operator')` → "Equals"; `getByLabel('Value')`
   → "critical".
5. Real drag-connect (per §11's mandated pattern, reused verbatim):
   ```ts
   const from = page.locator('[data-testid="node-trigger-checkout-api-alerts"] .react-flow__handle-bottom')
   const to = page.locator('[data-testid="node-condition-is-this-critical"] .react-flow__handle-top')
   const a = await from.boundingBox(); const b = await to.boundingBox()
   await page.mouse.move(a.x + a.width/2, a.y + a.height/2)
   await page.mouse.down()
   await page.mouse.move(b.x + b.width/2, b.y + b.height/2, { steps: 24 })
   await page.mouse.up()
   ```
   **[INFERRED]**: the exact `data-testid` slugging convention (`node-<type>-<slugified-label>`) — §11 only
   shows `node-condition-1` / `node-action-page` as examples, so slug format (numeric suffix vs. label slug)
   needs confirming against real DOM once nodes exist.
6. Repeat click-to-add for Action ×2, Approval ×1, Resolution ×2 via
   `getByRole('button', { name: 'Add Action node' })` / `'Add Approval node'` / `'Add Resolution node'`,
   filling each inspector per the storyboard's field values.
7. Drag-connect the remaining 5 edges the same way, sped up in post (see §6) rather than in the script —
   capture at real speed, speed up the clip.

### Shot 4 — Validation
1. From the graph above, delete the false-branch edge:
   `page.locator('[data-testid="edge-condition-false"]') .click()` **[INFERRED testid]** then press
   `Delete`.
2. Hover `getByRole('button', { name: 'Run workflow' })` (`a11y.aria.runControls.run`) — capture the
   disabled state + tooltip.
3. Open the Issues tab/panel: `getByRole('tab', { name: 'Issues' })` **[INFERRED — Run panel tab strip named
   "Payload · Timeline · Issues" per ARCHITECTURE §10, exact accessible names not spelled out]**.
4. `getByRole('button', { name: /Missing false branch/ })` → click → assert canvas re-centers and Inspector
   focuses the branch field (`field: 'field'`/`'true'`/`'false'` per the `ValidationIssue.field` contract in
   ARCHITECTURE §6).
5. Re-drag the Condition's false handle to the ticket Action node (same drag pattern as Shot 3 step 5).
6. Assert `getByRole('button', { name: 'Run workflow' })` is now enabled.

### Shot 5 — Critical run
1. Open payload editor, select the **Critical API outage** preset
   (`getByRole('button', { name: 'Critical API outage' })` — `payload.preset.critical.name`).
2. Set speed: `getByRole('radio', { name: '1x' })` within the `role="radiogroup"` speed control
   (`run.controls.speed.1x`).
3. **Do not** append `reducedMotion` override here — this is a real-animation shot (see §2). Launch this
   spec's context explicitly with `contextOptions: { reducedMotion: 'no-preference' }`.
4. `getByRole('button', { name: 'Run workflow' })` → click.
5. `await expect.poll(() => page.locator('[data-testid="node-approval-approve-rollback"]').getAttribute('data-run-state')).toBe('awaiting-approval')`
   — this is the documented `data-run-state` poll pattern from §11, reused to know exactly when to hold the
   camera rather than sleeping a fixed duration.
6. **Hold 3–4s** on the awaiting-approval state before doing anything (see §5 pacing/hold-time guidance).
7. `getByRole('button', { name: 'Approve' })` on the node itself (DESIGN §5: "two real inline buttons
   Approve/Reject, in tab order") → click.
8. Let playback run to completion at real 1× speed (no `instant`), capture the Timeline panel filling in
   parallel — split-frame capture: run the same script twice, once framed on canvas, once framed on
   `TimelineLog`, and composite in post (see §6) rather than trying to fit both live in one recorded frame
   at demo resolution.

### Shot 6 — Non-critical run
1. `window.__opsflow.reset()` via the test handle to restore the clean demo graph (or re-run Shot 3's
   build), then select payload preset **Low-priority anomaly** (`payload.preset.anomaly.name`).
2. Speed: `getByRole('radio', { name: '2x' })`.
3. Run, `expect.poll` on the ticket/notify/mitigated nodes' `data-run-state` to sequence the hold points
   the same way as Shot 5.
4. Capture the skipped subtree by asserting `[data-testid="node-approval-approve-rollback"]` carries
   `data-run-state="skipped"` before panning past it.

### Shot 7 — Local-first proof
1. After Shot 6, capture the `saveStatus` chip: `getByText('Saving…')` → `getByText('Saved locally')`
   (`saveStatus.saving` / `saveStatus.saved`).
2. `page.reload()` — capture cold to loaded, assert `window.__opsflow.getDocument()` node/edge counts match
   pre-reload.
3. Export:
   ```ts
   const [download] = await Promise.all([
     page.waitForEvent('download'),
     page.getByRole('button', { name: 'Export JSON' }).click(), // toolbar.exportJson
   ])
   ```
   (This exact pattern, filename assertion included, is already given verbatim in ARCHITECTURE §9.)
4. Import: open `getByRole('button', { name: 'Import JSON' })` → `getByRole('tab', { name: 'Paste JSON' })`
   (`importDialog.tab.paste`) → fill the textarea with the downloaded JSON → `getByRole('button', { name:
   'Import' })` (`importDialog.submit`) → assert toast `getByText('Workflow imported')`
   (`importDialog.toast.success`).

### Shot 8 — Mobile
1. Run under the `demo-mobile` project (390×844). `page.goto('/?e2e=1')`, seed the demo graph via
   `window.__opsflow.reset()`.
2. `getByRole('button', { name: 'Add node' })` (FAB) **[INFERRED accessible name]** → click → drawer slides
   in.
3. `getByRole('button', { name: 'Add Action node to canvas' })` (`a11y.aria.paletteNode` template:
   "Add {nodeType} node to canvas") → click → drawer closes, node placed, Inspector `BottomSheet` auto-opens.
4. Swipe-down to dismiss: `page.mouse` drag from sheet handle downward, or press `Escape` (documented
   alternate dismissal, ARCHITECTURE §10).
5. `getByRole('button', { name: 'Run workflow' })` → Run panel opens as a full sheet with
   `getByRole('tab', { name: 'Payload' })` / `'Timeline'` / `'Issues'`.
6. Start a run at 1× (same no-reduced-motion context override as Shot 5) and hold on the mini-player docked
   state (96px, per DESIGN's mobile sketch) while canvas animates behind it.

### Shot 9 — Closing card
1. `window.__opsflow.clearStorage()`, reload to hero state, hold 3s (same frame as Shot 1, different VO).

---

## 4. Cursor visibility and pacing

- **Cursor:** inject a synthetic cursor overlay (Playwright does not render the OS cursor in video). Use a
  small fixed-position `<div>` injected via `page.addStyleTag`/`page.addInitScript` that tracks
  `page.mouse` positions issued by the script — simplest is a `page.evaluate` cursor-dot element updated on
  every `mousemove`/`click` the capture script performs, so every deliberate click is visible on the
  recording. Never rely on the invisible default; a demo with clicks that appear to happen by themselves
  reads as broken, not slick.
- **Minimum hold time per state:** 1.5s minimum on any static UI state before it changes (form filled,
  dialog open, tooltip shown); 3s minimum on any state that is itself the point of the shot (the
  awaiting-approval pause in Shot 5, the disabled-Run tooltip in Shot 4, the mobile mini-player in Shot 8).
  Faster than that and the cut-down edits (§ in STORYBOARD.md) will have nothing to trim from.
  Movement between clicks: `steps: 20+` on every `page.mouse.move` (already required by §11 for React Flow
  drags) doubles as smooth, visible cursor travel instead of a teleport.
- **Typing:** use `locator.pressSequentially(text, { delay: 35 })` rather than `.fill()` for any inspector
  field the camera lingers on (Shot 3's Trigger name, Condition config) — `.fill()` sets the value instantly
  and looks like a glitch on camera; reserve `.fill()` for off-camera setup only.

## 5. Approval-pause capture (not resolving too fast)

The simulator (ARCHITECTURE §4) genuinely stops and returns control at a manual approval node — it does not
auto-advance — so there's no race to "beat a timer." The actual risk is the *opposite*: the capture script
clicking Approve too quickly for the pause to register on camera. Mitigation:
1. Poll `data-run-state === 'awaiting-approval'` (§3 Shot 5 step 5) rather than a fixed sleep, so the click
   never fires before the pause is actually visible.
2. After the poll resolves, insert an explicit **hold** (`await page.waitForTimeout(3500)`) before touching
   Approve — this is the one place a fixed wait is appropriate, because it's timing a human beat for the
   camera, not synchronizing with app state.
3. Frame the shot so the gold `--glow-awaiting` breathing halo (2.4s cycle, DESIGN §6) completes at least
   one full cycle during the hold, so the animation reads as intentional rather than a freeze-frame.
4. Never use the `Instant` speed control anywhere near this shot — Instant applies all remaining events
   synchronously (§4/§2 above) and, per ARCHITECTURE, still stops at `awaiting-approval` but leaves zero
   visible transition into or out of the pause.

## 6. Making the two runs (Shots 5 and 6) visually distinguishable

- **Speed control on screen**: 1× for the critical run, 2× for the non-critical run — the segmented control
  with the gold underline (DESIGN §5) is captured in both, so the difference is legible without reading a
  caption.
- **Path taken**: critical run fills the `TRUE` branch pill solid and dims `FALSE` to 40%; non-critical run
  does the reverse — frame both so the branch pills are in shot.
- **Skipped subtree**: the untaken branch's nodes render at 55% opacity with a dashed border and grayscale
  icon (DESIGN "Node cards" section) — keep the skipped nodes in frame during the non-critical run so the
  contrast against Shot 5's fully-lit critical path is visible without a side-by-side.
- **Approval presence/absence**: Shot 5 has the gold awaiting-approval halo and the pause; Shot 6 has none —
  this is the single strongest visual differentiator and should not be edited around.
- **Post-production**: apply a very slight cool/neutral grade to Shot 6 versus a slightly warmer grade on
  Shot 5's gold-approval beat, per §7's grading notes, to reinforce the contrast non-verbally.

## 7. Post-production edit list

1. **Title cards** (Shots 1, 9): built directly from the captured `HeroWelcome` frames — no separate motion
   graphics needed, since the real UI already renders the painted-sky treatment. Add the caption text as a
   simple fade-in cream serif overlay timed to the VO, not baked into the recording.
2. **Captions**: burn in the per-shot caption strings from STORYBOARD.md as lower-third or top-safe text in
   Inter (matching `--font-sans`), cream-50 on a subtle navy-950 scrim, appearing ~0.3s after each shot's
   cut and holding for the shot's duration.
3. **Music direction**: a single sparse, low-tempo, minor-key bed — sustained pads/strings evoking a night
   sky, no percussion until Shot 5's run sequence, where a subtle low pulse can sync to the node-by-node
   pacing; drop the music (or duck hard, −18dB) under the approval-pause hold so the pause reads as quiet/
   tense rather than scored-over; swell slightly back in on Approve. No music at all under Shot 2's problem
   montage — silence or a dissonant sting sells "this is the bad state."
4. **Colour grade**: match the painting's palette — crush blacks toward `#05070F`/`#0A0F1F` (navy-950/900),
   lift cream/gold highlights slightly (targeting the `--color-cream-50`/`--color-gold-300` values already
   in DESIGN §1) so the captured UI and the painted title-card frames don't look like two different color
   spaces cut together. Keep contrast conservative — the app is already AA-contrast tuned; don't crush
   shadows so far that node-card text becomes unreadable in the export.
5. **Pacing edit**: honor the hold times from §4 in the raw capture, then tighten further in the edit per
   shot as needed to hit the exact STORYBOARD.md timecodes — cut on animation completion beats (edge-flow
   finishing, sheet fully open) rather than mid-motion.
6. **Sequence**: assemble in storyboard order; Shot 3's sped-up edge-connect montage (§3 Shot 3 step 7) is
   the one clip that should be time-remapped (3–4×) in the edit rather than scripted at that speed, so the
   underlying animation timing curve is preserved and just compressed, not literally fast-forwarded frames.

## 8. Deliverable formats

- **Landscape:** 1920×1080, H.264 MP4, from the `demo-desktop` 1440×900 capture upscaled/repositioned with a
  navy-950 letterbox pillar if needed (or captured at a `deviceScaleFactor` high enough to source-downscale
  cleanly — the config in §1 uses `deviceScaleFactor: 2` for exactly this reason).
- **Vertical:** 1080×1920, from the `demo-mobile` 390×844 capture (Shot 8) plus vertically-cropped/reframed
  versions of the desktop shots for the rest of the sequence — desktop 1440×900 does not crop cleanly to
  9:16, so the vertical cut should recompose each desktop shot to keep the canvas/inspector centered rather
  than naively center-cropping the 16:10 frame.
- Export both at 30fps minimum (60fps if the animation timing in Shots 5/6 shows any judder at 30).

## 9. Fallback plan: screenshots-to-slideshow

If `recordVideo` proves unreliable (known Playwright/WebM flakiness on some CI runners, or if the capture
machine can't sustain smooth compositor output):

1. Replace `recordVideo`/`video: 'on'` with a screenshot cadence driven by the same `expect.poll` hold
   points already scripted in §3 — capture `page.screenshot()` at each state-transition (node reaches
   `running`, branch decided, approval requested, approval resolved, run finished) rather than a fixed
   interval, since the meaningful states are already enumerated by `data-run-state` polling.
2. For continuous motion beats that don't fit a discrete-state model (edge dash-flow, gold breathe),
   additionally sample every 200ms for the ~1–2s window around that transition, so the slideshow can
   simulate motion with a fast slide/crossfade instead of a hard cut.
3. Assemble in the same edit software as the video path (§7), using short crossfades (150–250ms) between
   stills rather than hard cuts, timed to the VO exactly as in STORYBOARD.md — the slideshow should still
   hit every timecode in the storyboard, just with photographic beats instead of continuous footage.
4. This fallback cannot represent Shot 3's live drag-connect or Shot 8's sheet-drag-to-dismiss convincingly;
   for those two, script the discrete before/after states only (unconnected → connected; sheet open → sheet
   closed) and let the caption/VO carry the "how," rather than trying to fake a drag with stills.
5. `scripts/screenshots.ts` (ARCHITECTURE §2/§13, `npm run screenshots`) already exists as infrastructure
   for exactly this kind of state capture and can be extended with the additional named states this plan
   needs, rather than writing a parallel screenshot harness from scratch.

---

## 10. Not yet verified

The following are inferred or assumed because the underlying UI/tests do not exist yet at the time this
plan was written (`docs/testing-conventions.md` is absent; only ARCHITECTURE/DESIGN/CONTENT exist):

1. **`data-testid` slugging convention** for nodes beyond the two literal examples in ARCHITECTURE §11
   (`node-condition-1`, `node-action-page`) — whether real nodes use a numeric suffix, a label slug, or the
   node's domain `id`. All node testids referenced in §3 above (e.g.
   `node-trigger-checkout-api-alerts`) are placeholders following the label-slug guess.
2. **Edge testids** (`edge-condition-false` etc.) — ARCHITECTURE never shows an edge testid example, only
   node/handle ones; edges may instead be selected via `page.locator('.react-flow__edge').filter(...)` or a
   dedicated data attribute not yet named.
3. **Exact accessible names for palette add-buttons for all five types** — only `'Add Action node'` is given
   verbatim in §11; `'Add Trigger node'`, `'Add Condition node'`, `'Add Approval node'`, `'Add Resolution
   node'` are extrapolated from that pattern and from `a11y.aria.paletteNode`'s template string
   ("Add {nodeType} node to canvas") in CONTENT §11, which doesn't exactly match the §11 example's wording
   either ("Add Action node" vs. "Add Action node to canvas") — **these two docs disagree on the button's
   accessible name and need reconciling once the component ships.**
4. **Run panel tab accessible names** (`Payload` / `Timeline` / `Issues`) — ARCHITECTURE §10 names the strip
   verbally but doesn't give exact `role="tab"` accessible-name strings; assumed to match the tab labels
   literally.
5. **Mobile FAB accessible name** ("Add node") — DESIGN/ARCHITECTURE describe the FAB's behavior but not its
   `aria-label`.
6. **Whether the awaiting-approval banner and the inline node buttons expose the same accessible name for
   Approve/Reject** — CONTENT gives `run.awaitingApproval.approve`/`.reject` for the banner; DESIGN's node
   card spec separately describes "two real inline buttons Approve / Reject" on the node — assumed identical
   strings but not confirmed as the same DOM element or duplicated ones (matters for `getByRole` uniqueness
   in the capture script; may need `.first()`/scoping once real).
7. **`window.__opsflow` availability under the `demo-mobile`/touch-emulated project** — ARCHITECTURE's flag
   logic doesn't mention any touch/pointer-type gating, so it's assumed to work identically on both
   projects, but this plan's mobile scripts have not been run against a real build to confirm.
8. **Exact video/animation frame timing under `deviceScaleFactor` 2–3** — whether Chromium's headless
   compositor sustains the DESIGN §6 animation curves smoothly at those scale factors on the actual capture
   hardware is unverified; §9's fallback exists specifically to de-risk this.
