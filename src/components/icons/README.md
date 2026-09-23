# Icons

Hand-authored 24x24 stroke icons: `import { PlayIcon, NodeTypeIcon } from "./components/icons"`.
All icons render an inline `<svg>`, `stroke="currentColor"`, `strokeWidth={1.75}`, round caps/joins.
Color follows CSS `color`; wrap in an element with the desired text color.
Props: `size` (px, default 24), `className`, and optional `title`.
Pass `title` for meaningful icons (e.g. lone icon buttons) — it renders `<title>` and `role="img"`.
Omit `title` for decorative/adjacent-to-label icons — they get `aria-hidden` automatically.
`NodeTypeIcon` maps a workflow `NodeType` (`trigger|condition|action|approval|resolution`) to its icon.
`ICON_NAMES` lists every exported icon name, handy for a style-guide gallery or snapshot tests.
Keep new icons on the same 24x24 grid and 1.75 stroke weight so they read as one family.
Size via the `size` prop, not CSS `width`/`height` overrides, to keep the internal viewBox proportional.
