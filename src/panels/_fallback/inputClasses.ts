/** Shared Tailwind classes for text-like inputs/selects/textareas (DESIGN.md §5 "Inspector forms"). */
export const INPUT_CLASSES =
  'h-9 w-full rounded-sm border border-line bg-navy-800 px-2.5 text-body text-cream-50 ' +
  'placeholder:text-text-subtle hover:border-line-strong focus-visible:outline-none ' +
  'focus-visible:border-cobalt-400 focus-visible:shadow-[var(--glow-focus)] ' +
  'disabled:cursor-not-allowed disabled:opacity-45 aria-[invalid=true]:border-[var(--color-state-error)]'

export const TEXTAREA_CLASSES =
  'w-full min-h-20 rounded-sm border border-line bg-navy-800 px-2.5 py-2 text-body text-cream-50 ' +
  'placeholder:text-text-subtle hover:border-line-strong focus-visible:outline-none ' +
  'focus-visible:border-cobalt-400 focus-visible:shadow-[var(--glow-focus)] ' +
  'disabled:cursor-not-allowed disabled:opacity-45 aria-[invalid=true]:border-[var(--color-state-error)]'
