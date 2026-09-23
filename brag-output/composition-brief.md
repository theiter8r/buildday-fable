# Hyperframes Composition Brief: OpsFlow

## Objective
Create a short launch-style brag video for OpsFlow — a local-first visual studio for designing and simulating incident-response workflows.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080, 30 fps
- Duration: 22 seconds

## Source Material
- Project root: `/Users/raaj/build-day`
- Primary files read: `index.html`, `src/App.tsx`, `src/styles/index.css`, `docs/DESIGN.md`, `docs/CONTENT.md`, `docs/ARCHITECTURE.md`, `src/domain/nodeDefs.ts`, `src/domain/types.ts`, `src/components/icons/index.tsx`, `public/gods-plan.jpg`
- Product name: OpsFlow
- Tagline / strongest claim: "Design the response before the incident writes it for you."
- Key UI or visual moment to recreate: the three-pane app shell (palette / canvas / run panel) with the "Critical API Incident" demo workflow running node by node, pausing at the gold approval gate, then resolving. Node-card anatomy, run-state glyphs, colours and glows per `docs/DESIGN.md` §1, §5, §6.
- Copy that must appear verbatim (all from `docs/CONTENT.md`):
  - Every incident has a shape. Draw it before it happens.
  - Design the response before the incident writes it for you.
  - Local-first. Nothing leaves this machine.
  - Critical API Incident
  - Checkout API alerts · Is this critical? · Page primary on-call · Approve rollback · Roll back checkout-api · Resolved · Open tracking ticket · Notify #incidents · Mitigated
  - Edge labels: On alert · Critical · Not critical · Paged · Approved · Rolled back · Filed · Posted
  - Payload: Checkout API returning 5xx errors · checkout-api · critical · 42.5 · us-east-1 · 18400 · PagerDuty webhook
  - Nothing has run yet. Press Run to start.
  - Waiting on approval · Approve · Reject
  - Timeline rows: Trigger fired — Checkout API alerts · severity equals critical → true · Action started — Page primary on-call · Approval requested — Approve rollback (Incident commander) · Approval granted — Approve rollback · Action finished — Roll back checkout-api · Resolution reached — Resolved (resolved)
  - Resolved via critical branch in 4.3s.

## Creative Direction
- Tone preset: polished
- Creative direction: a quiet premium product film — an oil painting turned into an instrument
- Interpretation: 4 scenes, long holds, soft 0.6–0.8s crossfades, serif reserved for arrival moments, Inter for the UI. Energy comes from the run lighting up on the canvas, not from cuts.
- Angle: the product's design system is derived from the painting "GOD'S PLAN."; the video opens inside the painting, the sky settles into the canvas, a real incident runs across it in the painting's palette, and the one dramatic beat is the gold pause for a human decision.
- Hook: full-bleed painting under the hero gradient; "Every incident has a shape." then "Draw it before it happens."
- Outro / punchline: OpsFlow wordmark in glowing serif, tagline verbatim, eyebrow "Local-first. Nothing leaves this machine."
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign (use the spec's tokens, not a new palette)
  - Left-edge accent stripes are *in the spec* for node cards (3px type-colour bar) — keep them, they are the product

## Visual Identity
- Background: `#0A0F1F` shell over `#05070F` backdrop; panels `#0E152B`; cards `#131C38`; raised `#1B2850`; borders `rgb(155 180 255 / .18)`
- Text: `#FBF6EC` primary, `#E7D5B8` secondary, `#A9B4D0` muted, `#8A93AE` subtle
- Accent: gold `#E8B75A` / `#F2CE7E`; cobalt `#2B4A9E` / `#3A63C8` / `#5B84E6`; peach `#F0B98E`; verdigris `#79D3A6`; coral `#FF8F82`
- Display font: Cormorant Garamond 600/700 — `assets/fonts/cormorant-garamond-latin-{600,700}-normal.woff2` (from node_modules/@fontsource)
- Body font: Inter Variable — `assets/fonts/inter-latin-wght-normal.woff2` (from node_modules/@fontsource-variable)
- Visual references from the project: `assets/gods-plan.jpg` (low-res 735×484 — treat as a blurred impasto backdrop under the gradient, never sharp full frame); node icons from `src/components/icons/index.tsx` (bolt, diamond-branch, sun/gear, shield-check, circle-check); DESIGN.md §4 impasto sky gradients and dot grid; §5 node card spec (220px wide, navy-800, 10px radius, 3px accent bar, header icon + label + state glyph, 2 meta lines); §6 motion (running pulse 1.6s, awaiting gold breathe 2.4s, edge dash flow, branch pill scale-in, timeline rows slide 8px with 30ms stagger).

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. The painting — 4.39s — hook lines over the painting, title glow breathing
2. The canvas assembles — 4.35s — app shell + nine node cards arriving on beats, edges drawing, payload card visible
3. Run it — 8.73s — cursor clicks Run (8.74), states light up, gold approval pause with punch-in, cursor clicks Approve (13.11), rollback, Resolved (14.73), serif summary (15.29)
4. Outro — 4.53s — OpsFlow wordmark (17.47), tagline, eyebrow, music fade

## Audio
- Audio role: cinematic support, restrained
- Audio arc: one steady bed throughout; sparse UI sounds only where the cursor acts; a single bell on Resolved; fade to silence over the final second
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`
- Music treatment: volume 0.30, fade out 21.0→22.0 via a `data-automation` volume lane
- Music cue guidance: bundled preset at `.claude/skills/brag/assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.{md,json}` (~110 BPM). Beat-lock: Run click 8.74, Approve click 13.11, title 17.47. Beat-grid: node arrivals 4.91, 5.34, 6.00, 6.56, 7.09, 7.64; run states 9.29, 9.83, 10.93, 14.20, 14.73, 15.29.
- Audio-reactive treatment: subtle; bass band drives the serif title glow (hook + outro) and the warmth of the canvas sky gradient. No waveform/equalizer, no text scaling.
- Audio-coupled moments:
  - Scene 2 shell arrival — soft drop
  - Scene 2 first node (4.91) and last node group (7.64) — soft drop
  - Scene 3 Run click (8.74) and Approve click (13.11) — click
  - Scene 3 Resolved (14.73) — one bell
  - Scene 4 title (17.47) — soft impact
- SFX selection guidance: low-HF-risk picks from `sfx-analysis.md`: `interface/drop_001`, `interface/click_003`, `impact/impactSoft_medium_001`, `impact/impactBell_heavy_000`. Volumes 0.45–0.65. Never above one SFX per beat.
- SFX analysis guidance: `.claude/skills/brag/assets/sfx/sfx-analysis.md`
- Exact SFX choice: Hyperframes should choose final filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: copied into `brag-output/composition/assets/`

## Hyperframes Instructions
Domain skills loaded: hyperframes-core, hyperframes-animation, hyperframes-creative (audio-reactive), hyperframes-keyframes (punch-in), hyperframes-cli. This is the /brag workflow — no intent interview, no product-launch route.

Requirements:
- Show at least one real UI, copy, or visual element from the source project (the whole middle is the reconstructed app with verbatim copy).
- Keep all text readable in the final render; smallest UI text ≥ 18px at 1920 wide.
- Keep the video at 22 seconds.
- Include the planned music/SFX layer.
- Treat cue metadata as timing hints; readability first.
- Self-host fonts with in-file `@font-face`; no CDN fonts.
- Local GSAP would be preferred but the scaffold's CDN GSAP is acceptable.
- Pre-extract audio data with the hyperframes-creative `extract-audio-data.py` and sample it per frame for the glow/warmth treatment.
- Run `npx hyperframes check` before render — brag's single gate.
