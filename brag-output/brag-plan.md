# Brag Plan: OpsFlow

## What is this app?
OpsFlow is a local-first visual studio where on-call teams draw an incident-response workflow on a canvas — trigger, conditions, actions, approvals, resolutions — then simulate it node by node before it ever meets a real page. Nothing leaves the machine and nothing gets paged for real.

> Source note: the working canvas UI is not yet implemented in `src/` (App.tsx renders only the wordmark). Every screen in this video is reconstructed from the project's own spec: `docs/DESIGN.md` (tokens, node-card anatomy, run-state glows) and `docs/CONTENT.md` (every string, including the "Critical API Incident" demo workflow and the "Critical API outage" payload preset). No invented copy, no real user data — the payload is the project's own fictional preset.

## The angle
An oil painting turned into an instrument. The product's design system is literally derived from the painting "GOD'S PLAN." (cobalt impasto night sky, cream clouds, a glowing serif title). The video opens inside that painting, then the sky settles into the app's canvas and a real incident runs across it — every node lighting up in the palette the painting gave it: peach trigger, cobalt condition, gold approval, verdigris resolution. Calm, precise, operator-grade. The only drama is the gold pause where a human has to say yes.

## Hook (first 2-3 seconds)
Full-bleed painting, slow push-in. Serif line, glowing: **"Every incident has a shape."** Then beneath it: **"Draw it before it happens."** The hero headline from the spec, verbatim.

## Key moments (the middle)
- The demo workflow assembling itself on the canvas, one node card per beat, edges drawing between them, branch pills TRUE / FALSE hanging off the condition.
- The Run press: trigger fires, the condition evaluates `severity equals critical → true`, the false branch dims to skipped (dashed, 55%), "Page primary on-call" pulses cobalt, then the run **stops** at "Approve rollback" — gold glow, real inline Approve / Reject buttons — while the timeline rows stack up on the right.
- The Approve click: gold → verdigris, "Roll back checkout-api" runs, "Resolved" lights up with a RESOLVED chip, and the serif summary lands: **"Resolved via critical branch in 4.3s."**

## Outro / punchline
Back into the night sky. **OpsFlow** in glowing serif. Tagline verbatim: **"Design the response before the incident writes it for you."** Small eyebrow beneath: **"Local-first. Nothing leaves this machine."**

## User flow worth showing
1. Load the demo workflow ("Critical API Incident") — the canvas fills with nine nodes.
2. Payload "Checkout API returning 5xx errors · checkout-api · critical · 18,400 affected users" → press **Run**.
3. Watch the run: branch decided, on-call paged, approval gate pauses, human clicks **Approve**, rollback runs, **Resolved**.

## Tone
- Preset: polished
- Creative direction: "a quiet premium product film — an oil painting turned into an instrument"
- Interpretation: few scenes, long holds, soft 0.6–0.8s crossfades, restrained serif for moments of arrival, Inter for everything in the UI. Energy comes from the run lighting up, not from cuts. No caps, no slams, one bell.

## Format: landscape — 1920x1080
## Duration: 22 seconds

## Visual identity (from the project)
- Background: `#0A0F1F` (navy-900 app shell) over `#05070F` (navy-950 page backdrop)
- Panels: `#0E152B` (navy-850) · Cards/inputs: `#131C38` (navy-800) · Raised: `#1B2850`
- Accent: gold `#E8B75A` / `#F2CE7E` (approval, focus, the primary CTA); cobalt `#3A63C8` / `#5B84E6` (edges, primary button)
- Text: `#FBF6EC` (cream-50) · muted `#A9B4D0` · subtle `#8A93AE`
- Node accents: trigger peach `#F0B98E`, condition cobalt `#5B84E6`, action bright cobalt `#7FB0FF`, approval gold `#E8B75A`, resolution verdigris `#79D3A6`
- Run states: running `#7FB0FF`, success `#79D3A6`, failed `#FF8F82`, awaiting `#F2CE7E`, skipped `#8A93AE` @55% dashed
- Glows: `--glow-title: 0 0 24px rgb(251 246 236 / .28), 0 0 72px rgb(232 183 90 / .18)`; running `0 0 18px rgb(91 132 230 / .35)`; awaiting `0 0 18px rgb(232 183 90 / .30)`
- Display font: Cormorant Garamond (600/700) — self-hosted from node_modules/@fontsource
- Body font: Inter Variable — self-hosted from node_modules/@fontsource-variable
- Strongest visual element: `public/gods-plan.jpg` (735×484 — low-res; use as a blurred/impasto backdrop under the spec's hero gradient, never sharp full-frame) and the node-card anatomy from DESIGN.md §5.

## Share copy (draft)
Every incident has a shape. Draw it before it happens.
OpsFlow: a local-first canvas for designing and simulating incident response — triggers, conditions, approvals, rollbacks — where nothing gets paged for real.

## Audio direction
- Role: cinematic support, restrained
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (steady and clean, ~110 BPM)
- Music treatment: start at 0, volume 0.30, fade out over the last 1.0s (21.0→22.0)
- Music cue guidance: preset read from `<skill-dir>/assets/music/cues/…vol-12….music-cues.md`. Strong cues to lock: **8.74s** (Run click), **13.11s** (Approve click), **17.47s** (OpsFlow title lands). Beat grid for node arrivals in Scene 2: 4.91, 5.34, 6.00, 6.56, 7.09, 7.64 (cards, not readable lines — they hold on screen afterward). Secondary beats for run states: 9.29, 9.83, 10.93, 14.20, 14.73, 15.29.
- Audio-reactive treatment: subtle; bass/RMS drives the serif title glow (hook and outro) and the impasto sky-gradient warmth behind the canvas. No waveform, no equalizer, no scaling text.
- SFX posture: sparse, polished. Low-HF-risk picks only.
- Audio-coupled moments: shell arrival (soft drop), first and last node arrival (soft drop), Run click (click), Approve click (click), Resolved (one bell), OpsFlow title (soft impact).
- Restraint rule: never more than one SFX per beat; music never above 0.30; nothing on the hook lines — let the music carry the painting.

## Storyboard

### Scene 1 — The painting — 4.4s (0.00–4.39)
Full-bleed `gods-plan.jpg`, scaled slightly up and slowly settling (1.06→1.00), under the spec's hero gradient (`rgb(5 7 15 / .45) → .72 → rgb(10 15 31 / .95)`) with a faint cream inner hairline. Line 1 rises in at 0.56: "Every incident has a shape." (Cormorant 600, ~96px, cream-50, title glow). Line 2 at 1.64: "Draw it before it happens." (same face, ~64px, cream-200). Both hold until the crossfade.
Sequential/interaction: yes — two lines, one after the other, each held to the reading floor (line 1 ≥ 2.8s, line 2 ≥ 2.2s).
Audio intent: hushed, expectant; music alone.
Audio-coupled idea: title glow breathes with bass (audio-reactive).
Music: steady bed, 0.30.
Transition mood: soft 0.7s crossfade — the sky darkens into the app shell → Scene 2

### Scene 2 — The canvas assembles — 4.35s (4.39–8.74)
The OpsFlow app shell (spec §5): top bar with the wordmark, workflow name "Critical API Incident", "Saved locally" chip, and a cobalt **Run** button; left palette listing Trigger / Condition / Action / Approval / Resolution with their one-line descriptions; center canvas with dot grid over the impasto sky gradients; right Run panel showing the "Incident payload" card (title "Checkout API returning 5xx errors", service checkout-api, severity critical, error rate 42.5%, region us-east-1, affected users 18,400, source PagerDuty webhook) and an empty timeline reading "Nothing has run yet. Press Run to start."
Node cards arrive one per beat with fade + 4px rise: 4.91 "Checkout API alerts" (trigger, PagerDuty · 1 filter) → 5.34 "Is this critical?" (condition, severity equals critical, TRUE/FALSE pills) → 6.00 "Page primary on-call" → 6.56 "Approve rollback" (Incident commander · 5 min) → 7.09 "Roll back checkout-api" → 7.64 "Resolved" (RESOLVED chip) and, together on that beat, the false-branch trio "Open tracking ticket" → "Notify #incidents" → "Mitigated". Bezier edges draw in behind each arrival with their labels (On alert, Critical, Not critical, Paged, Approved, Rolled back, Filed, Posted).
Sequential/interaction: yes — 6 beat-gridded node arrivals plus one trio; the full graph then holds.
Audio intent: things clicking into place, quietly.
Audio-coupled idea: soft drop on the shell arrival and on the first and last node; the rest ride the music's pulse.
Music: same bed.
Transition mood: none (continuous) → Scene 3

### Scene 3 — Run it — 8.7s (8.74–17.47)
A small cream cursor glides to **Run** and clicks at **8.74 (beat-locked)**. The run plays exactly as the simulator spec describes:
- 8.74 trigger → running (cobalt pulse ring) → 9.29 success (✓, verdigris). Timeline row: `+0.0s  Trigger fired — Checkout API alerts`.
- 9.29 condition running → 9.83 branch decided: the "Critical" TRUE pill fills solid, the "Not critical" pill drops to 40%, and the whole false branch (ticket, Slack, Mitigated) dims to skipped (dashed, 55%). Row: `+0.1s  severity equals critical → true`.
- 9.83 "Page primary on-call" running → 10.93 success. Rows: `+0.2s Action started — Page primary on-call`, `+1.4s Action finished — Page primary on-call (1.2s)`.
- 10.93 "Approve rollback" → **awaiting approval**: gold ring + slow gold breathe, inline **Approve** / **Reject** buttons appear on the card. Row: `+1.4s  Approval requested — Approve rollback (Incident commander)`. Run panel header reads "Waiting on approval".
- 11.5–12.4 the camera eases in on the gold node (scale ~1.3 around it). Hold on the human decision.
- Cursor moves to **Approve**; click at **13.11 (beat-locked)**. Gold → verdigris ✓. Row: `+1.8s  Approval granted — Approve rollback`.
- 13.11 "Roll back checkout-api" running → 14.20 success; camera eases back out 13.6–14.6. Row: `+3.9s  Action finished — Roll back checkout-api (2.0s)`.
- 14.73 "Resolved" lights verdigris, RESOLVED chip fills; edge "Rolled back" fills solid. Row: `+4.1s  Resolution reached — Resolved (resolved)`.
- 15.29 the serif summary card lands at the top of the timeline: **"Resolved via critical branch in 4.3s."** Run panel header chip: "Completed". Hold to 17.47.
Sequential/interaction: yes — simulated cursor clicks on Run and Approve; node states and timeline rows arrive in the sequence above (rows are short, ~0.5–1s apart, and stay on screen).
Audio intent: a machine doing its job, then one bright moment of relief.
Audio-coupled idea: click SFX on the two cursor presses; one bell on Resolved; the running pulse rides the music.
Music: same bed.
Transition mood: soft 0.7s crossfade — the shell dissolves back into the night sky → Scene 4

### Scene 4 — Outro — 4.5s (17.47–22.00)
The painting again, darker (gradient at ~.8 overall), very slow drift. **OpsFlow** (Cormorant 700, ~168px, cream-50, title glow) lands at **17.47 (beat-locked)**. Tagline at 18.02: "Design the response before the incident writes it for you." (Cormorant 600, ~52px, cream-200; 11 words — holds ~3.5s). Eyebrow at 19.66, small Inter uppercase tracked, muted: "LOCAL-FIRST. NOTHING LEAVES THIS MACHINE." Music fades 21.0→22.0.
Sequential/interaction: yes — title, then tagline, then eyebrow; all hold to the end.
Audio intent: arrival, then quiet.
Audio-coupled idea: soft impact under the title; glow breathes with bass until the fade.
Music: bed fading to silence.
Transition mood: fade to navy-950 at the very end.

**Music mood for this video:** cinematic-calm, steady.
**Audio summary:** one clean bed the whole way; a handful of soft UI sounds where the cursor actually does something; one bell when the incident resolves; the title glow breathes with the bass throughout.
