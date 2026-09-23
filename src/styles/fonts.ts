/**
 * Self-hosted font imports (ARCHITECTURE.md §2, DESIGN.md §2). Kept as a
 * side-effecting module so `main.tsx` can import it once, next to the CSS
 * import, without duplicating `@fontsource` imports inside `index.css`.
 *
 * Only the weights actually used (500/600/700 display, variable UI) are
 * imported to keep the FOUT window short.
 */
import '@fontsource-variable/inter'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/700.css'
