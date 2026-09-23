# OpsFlow — 90-Second Demo Storyboard

Source of truth for every string, node name and UI surface below: `docs/CONTENT.md` (copy),
`docs/DESIGN.md` (visual system, derived from the painting **"GOD'S PLAN."**), and `docs/ARCHITECTURE.md`
§§2, 4, 10, 11 (layout, simulator, mobile, testids). Nothing here is invented; where a detail isn't yet
confirmed in those docs it is flagged inline as **[ASSUMED]**.

Arc: painted-sky title card → the problem → build in the three-panel studio → validation stops a bad run →
run the critical branch with an approval pause → run the non-critical branch for contrast → local-first
proof → mobile → closing card.

Total runtime: **90s** (9 numbered shots + a closing card, 10 shots total).

---

## Shot 1 — Title card

**Timecode:** 0:00–0:04 (4s)

**On screen:** Full-bleed `public/gods-plan.jpg` — the deep navy impasto night sky with the cream/gold cloud
bank — under the hero overlay gradient (`linear-gradient(180deg, rgb(5 7 15/.45) 0%, rgb(5 7 15/.72) 55%,
rgb(10 15 31/.95) 100%)`). Centered display serif wordmark **OpsFlow** in Cormorant Garamond with
`--glow-title`, exactly as the `HeroWelcome` component renders it. No UI chrome yet.

**Caption:** OpsFlow

**Voiceover:** "Every incident has a shape."

**Transition:** Hard cut on the beat, no cross-dissolve — the title card should feel like a painting revealing itself, not a slide.

---

## Shot 2 — The problem

**Timecode:** 0:04–0:11 (7s)

**On screen:** Quick de-saturated cutaway montage (stock-style, not app UI): a wiki page titled something
generic like "Runbook: Checkout API," a Slack thread scrolling, a PagerDuty alert banner. These are the
*only* non-OpsFlow frames in the whole video — kept short and visually flat so the cut into the app at
Shot 3 reads as a relief. End on a freeze-frame with a subtle red pulse on the alert.

**Caption:** Runbooks live in wikis. Incidents do not.

**Voiceover:** "Runbooks live in wikis. Incidents do not — they happen live, under pressure, and nobody has time to read a doc."

**Transition:** Fast whip-pan/blur into the OpsFlow hero (`hero.headline`: "Every incident has a shape. Draw it before it happens."), held just long enough to register the tagline, then cut into the loaded editor.

---

## Shot 3 — Building a workflow in the three-panel studio

**Timecode:** 0:11–0:32 (21s)

**On screen:** Desktop 1440×900, the three-pane grid from ARCHITECTURE §2/§10 — Palette (280px) · Canvas
(center) · Inspector (360px). Starting from a blank canvas (`hero.cta.secondary` — "Start from a blank
canvas"):

1. Click the **Trigger** palette card (`palette.trigger.label`) — it drops at canvas center; canvas shows a
   peach-accented card. Inspector opens with `inspector.trigger.*` fields; type the trigger name
   "Checkout API alerts" and set Source to "PagerDuty webhook."
2. Click **Condition** (`palette.condition.label`) — cobalt diamond-notched card appears. In the inspector,
   name it "Is this critical?", set Field → Severity, Operator → Equals, Value → critical.
3. Drag-connect the Trigger's output handle to the Condition's input handle (a real mouse drag, per
   ARCHITECTURE §11's mandatory drag-connect pattern) — edge draws with the `TRUE`/`FALSE` branch pills at
   the Condition's two source handles.
4. Click **Action** (`palette.action.label`) twice to place "Page primary on-call" (page-oncall target
   sre-primary) and, off to the side, "Open tracking ticket" (create-ticket) — showing the bright-cobalt
   accent and the per-action icon.
5. Click **Approval** (`palette.approval.label`) to place "Approve rollback" — gold accent, hairline top
   border; set Approver role → Incident commander, Policy → "Wait for manual decision."
6. Click **Resolution** (`palette.resolution.label`) twice to place "Resolved" and "Mitigated" — verdigris
   accent, status chip.
7. Quick montage of drag-connecting the remaining edges (Page on-call → Approve rollback → Roll back
   checkout-api → Resolved; Condition false branch → Open tracking ticket → Notify #incidents → Mitigated),
   sped up 3–4×, to land on the full demo graph shape (this is functionally the same graph as
   `createDemoWorkflow()` — "Critical API Incident" — assembled live on camera).

**Caption:** Palette → Canvas → Inspector. Five node types, one workflow.

**Voiceover:** "Drag out a Trigger, branch it with a Condition, chain Actions, drop in an Approval for a human decision, and end every path in a Resolution. Five node types, no code."

**Transition:** Whip-cut to the full assembled graph, camera settles (fit-to-view snaps in), hold half a beat before the next shot.

---

## Shot 4 — Validation blocks an invalid run

**Timecode:** 0:32–0:41 (9s)

**On screen:** With one edge deliberately left disconnected (the Condition's false branch unplugged), the
**Run** button in the `TopBar` is visibly disabled/dimmed with its validation chip showing an error count.
Cursor hovers the Run button — tooltip/`aria-describedby` text reads "Can't run: 1 issue to fix." Cut to the
Run panel's **Issues** view (`ValidationPanel`): the row for `validation.CONDITION_BRANCH_MISSING.false`
("Missing false branch" / "This condition has no path for when it evaluates to false."). Click the issue
row — canvas re-centers (`fitView`) on the Condition node, which now shows the red error-dot badge, and the
Inspector opens focused on the branch field. Drag the missing connection to "Open tracking ticket" live —
the issue row disappears and the Run button lights up (cobalt fill, no longer disabled).

**Caption:** Can't run: 1 issue to fix. Click it, fix it.

**Voiceover:** "Before anything runs, OpsFlow checks it — and every issue is one click away from the exact node and field that needs fixing."

**Transition:** Cut to Run button now enabled, cursor moves to click it.

---

## Shot 5 — Run the critical branch: approval pause + node-by-node animation + timeline

**Timecode:** 0:41–1:02 (21s)

**On screen:** Payload editor (`PayloadEditor`) briefly shown with the **Critical API outage** preset
selected (`payload.preset.critical.name` — severity critical, errorRate 42.5, checkout-api). Player controls
set to **1×** (`run.controls.speed.1x`) so the animation reads clearly on camera — **this shot must not use
the `?e2e=1` flag**, since that flag disables the very node-pulse/edge-dash animation being demonstrated.
Click **Run**. On the canvas: the Trigger card pulses with `--glow-running`, then the traversed edge animates
its dash-flow into the Condition node; the `TRUE` branch pill scales in and fills solid while `FALSE` fades
to 40%. The taken edge flows into "Page primary on-call," which pulses through its simulated duration, then
into "Approve rollback." The Approval node lights up with the gold `--glow-awaiting` breathing halo and its
inline **Approve** / **Reject** buttons appear; simultaneously a banner reads
`run.awaitingApproval.body`: "Approve rollback is waiting on a decision from the Incident commander." Hold
on this paused state for a beat — hand moves to click **Approve**. Run resumes: edge flow continues into
"Roll back checkout-api," then into **Resolved** (verdigris status chip). Cut to the `TimelineLog` alongside
the canvas, scrolling as rows stagger in (`run.timeline.triggerFired`, `conditionEvaluated`,
`actionStarted`/`actionFinished`, `approvalRequested`/`approvalApproved`, `resolutionReached`), ending on the
serif run-complete summary card: "Resolved — rollback completed in \<Xs>."

**Caption:** Awaiting approval from the incident commander.

**Voiceover:** "Run it, and watch the path light up node by node — including the moment it stops and waits for a real human decision. Approve it, and the rollback finishes: resolved."

**Transition:** Cut to Reset button, then Payload editor reopening — cue the contrast run.

---

## Shot 6 — Run the non-critical branch, faster, for contrast

**Timecode:** 1:02–1:11 (9s)

**On screen:** Switch the payload preset to **Low-priority anomaly** (`payload.preset.anomaly.name` —
severity low, search-api, errorRate 0.4). Set speed to **2×** (visibly toggling the segmented
`1× · 2× · Instant` control, gold underline moving) to make the contrast with Shot 5's 1× pacing obvious.
Click Run. The canvas takes the **FALSE** branch this time — that pill fills solid instead — skipping the
Page on-call/Approval/Rollback subtree entirely (those nodes visibly dim to 55% opacity with a dashed
border, the `skipped` treatment). Path runs straight through "Open tracking ticket" → "Notify #incidents" →
**Mitigated**, noticeably quicker and with no approval pause. Split-screen or quick side-by-side wipe against
a freeze-frame of Shot 5's critical path so the two shapes are legible together for ~2s.

**Caption:** Same workflow, different payload, different path.

**Voiceover:** "Change the payload and the same workflow takes a different path — faster, no approval, ticketed and tracked instead of paged."

**Transition:** Cut to the top bar's "Saved · " indicator, into the persistence shot.

---

## Shot 7 — Local-first proof

**Timecode:** 1:11–1:20 (9s)

**On screen:** Close-up on the `TopBar` save-status chip cycling `saveStatus.saving` → `saveStatus.saved`
("Saved locally") after the runs above. Hit browser reload (`page.reload()` in test terms) — the exact same
graph, positions, and configured nodes reappear with no loading flash beyond the brief skeleton state; no
network activity indicator anywhere (framed so a small "no network requests" annotation/caption can sit over
a DevTools Network-tab sliver — **[ASSUMED]**: whether to actually show DevTools on camera is a production
choice, not confirmed against any doc). Cut to `toolbar.exportJson` — click **Export JSON**, a file download
animates into the OS download tray, filename visible matching
`opsflow-critical-api-incident-yyyyMMdd-HHmm.json` per ARCHITECTURE §9. Cut to the **Import workflow** dialog
(`importDialog.title`), Paste JSON tab, pasting that same JSON back in, click **Import** — toast
`importDialog.toast.success` ("Workflow imported") appears.

**Caption:** Nothing leaves this machine.

**Voiceover:** "It's all local-first — reload the page and your work is exactly as you left it. Export it as JSON, hand it to a teammate, import it back in."

**Transition:** Hard cut to the mobile frame appearing, as if the canvas is now viewed on a phone.

---

## Shot 8 — Mobile layout

**Timecode:** 1:20–1:26 (6s)

**On screen:** Viewport 390×844, the mobile layout from ARCHITECTURE §10 / DESIGN §8. Top bar collapsed to
name + validation chip + Run + overflow "⋯". Tap the **Add node** FAB — the Palette slides in as a left
`Drawer`; tap a node card (e.g. Action) — it drops at the viewport center, drawer closes, and the Inspector
opens as a 60%-height `BottomSheet` with the drag handle. Swipe the sheet down to dismiss. Tap **Run** — the
Run panel opens as a full sheet with the **Payload · Timeline · Issues** `Tabs` strip; start a run and show
it docking to the 96px mini-player (play/pause, speed, progress, "Expand") while the canvas keeps animating
behind it.

**Caption:** Full studio, one thumb.

**Voiceover:** "The same studio, full-thumb-operable on a phone — drawers and sheets instead of panels, nothing lost."

**Transition:** Zoom out from the phone frame back to the painted sky.

---

## Shot 9 — Closing title card

**Timecode:** 1:26–1:30 (4s)

**On screen:** Return to the `public/gods-plan.jpg` hero frame, overlay and glow as in Shot 1. Wordmark
**OpsFlow** persists; beneath it, the tagline fades in: `app.tagline` — "Design the response before the
incident writes it for you." Small `hero.eyebrow` line beneath in muted cream: "Local-first. Nothing leaves
this machine."

**Caption:** Design the response before the incident writes it for you.

**Voiceover:** "OpsFlow. Design the response before the incident writes it for you."

**Transition:** Fade to black (`navy-950`), no logo sting beyond the wordmark already on screen.

---

## Full voiceover script (one contiguous block)

> Every incident has a shape. Runbooks live in wikis. Incidents do not — they happen live, under
> pressure, and nobody has time to read a doc. Drag out a Trigger, branch it with a Condition, chain
> Actions, drop in an Approval for a human decision, and end every path in a Resolution. Five node types,
> no code. Before anything runs, OpsFlow checks it — and every issue is one click away from the exact node
> and field that needs fixing. Run it, and watch the path light up node by node — including the moment it
> stops and waits for a real human decision. Approve it, and the rollback finishes: resolved. Change the
> payload and the same workflow takes a different path — faster, no approval, ticketed and tracked instead
> of paged. It's all local-first — reload the page and your work is exactly as you left it. Export it as
> JSON, hand it to a teammate, import it back in. The same studio, full-thumb-operable on a phone —
> drawers and sheets instead of panels, nothing lost. OpsFlow. Design the response before the incident
> writes it for you.

**Word count:** 219 words
**Estimated read time at 150 wpm:** 219 / 150 × 60 ≈ **88 seconds** — matches the 90s runtime with ~2s of
headroom for the wordless title-card beats (Shots 1 and 9's opening frame before VO starts).

---

## Cut-downs

### 30-second cut

Keep only the highest-signal beats: the problem statement is dropped entirely (no time for a montage), and
the demo is reduced to "assemble fast → run → local-first."

| Keep | Timecode | Shot |
| --- | --- | --- |
| ✅ | 0:00–0:03 | Shot 1 — Title card (trimmed to 3s) |
| ✅ | 0:03–0:14 | Shot 3 — Building the workflow, but sped up 2× and cut to just Trigger → Condition → Action → Approval → Resolution placement (no full edge montage) |
| ✅ | 0:14–0:24 | Shot 5 — Critical run, trimmed to: Run click → approval pause → Approve → Resolved (drop the payload-editor preamble and most of the timeline dwell) |
| ✅ | 0:24–0:27 | Shot 7 — Local-first proof, reload beat only (drop export/import) |
| ✅ | 0:27–0:30 | Shot 9 — Closing card |
| ❌ | — | Shots 2, 4, 6, 8 dropped |

VO (30s cut, ~68 words, fits at 150wpm with room): "Every incident has a shape. Build it from five node
types — trigger, condition, action, approval, resolution — no code. Run it, and watch it pause for a real
approval before it finishes: resolved. Reload the page — it's all still there, local-first. OpsFlow. Design
the response before the incident writes it for you."

### 60-second cut

Keeps the problem beat and both run paths, drops the deep validation dwell and the mobile shot to a single
still frame.

| Keep | Timecode | Shot |
| --- | --- | --- |
| ✅ | 0:00–0:03 | Shot 1 — Title card |
| ✅ | 0:03–0:08 | Shot 2 — Problem (trimmed) |
| ✅ | 0:08–0:20 | Shot 3 — Building the workflow (trimmed, sped 1.5×) |
| ✅ | 0:20–0:24 | Shot 4 — Validation, compressed to the disabled-Run tooltip + one issue-row click (drop the live fix) |
| ✅ | 0:24–0:40 | Shot 5 — Critical run with approval pause (trimmed timeline dwell) |
| ✅ | 0:40–0:47 | Shot 6 — Non-critical run, faster, contrast |
| ✅ | 0:47–0:53 | Shot 7 — Local-first proof (reload only, drop export/import) |
| ✅ | 0:53–0:56 | Shot 8 — Mobile, single 3s beauty shot instead of the full FAB→drawer→sheet sequence |
| ✅ | 0:56–1:00 | Shot 9 — Closing card |
| ❌ | — | Export/import portion of Shot 7 dropped; mobile interaction sequence compressed to one frame |

VO word budget at 150wpm for 60s ≈ 150 words — use the first ~150 words of the full script verbatim (through
"...ticketed and tracked instead of paged."), then jump straight to the closing line, dropping the
local-first/mobile sentences.
