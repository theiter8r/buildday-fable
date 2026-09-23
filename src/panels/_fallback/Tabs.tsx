/**
 * Minimal typed local fallback for the shared `Tabs` primitive (see
 * docs/lane-notes/panels.md). Roving-tabindex tablist per WAI-ARIA APG.
 */
import { useRef, type KeyboardEvent } from 'react'

export interface TabItem {
  id: string
  label: string
  badge?: number
}

export interface TabsProps {
  label: string
  items: readonly TabItem[]
  activeId: string
  onChange: (id: string) => void
  panelIdFor?: (id: string) => string
}

export function Tabs({ label, items, activeId, onChange, panelIdFor }: TabsProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  function focusAt(index: number) {
    const item = items[index]
    if (!item) return
    onChange(item.id)
    refs.current[item.id]?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusAt((index + 1) % items.length)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusAt((index - 1 + items.length) % items.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusAt(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusAt(items.length - 1)
    }
  }

  return (
    <div role="tablist" aria-label={label} className="flex gap-1 border-b border-line-soft">
      {items.map((item, index) => {
        const selected = item.id === activeId
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[item.id] = el
            }}
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={selected}
            aria-controls={panelIdFor ? panelIdFor(item.id) : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={`relative flex items-center gap-1.5 px-3 py-2 text-label font-medium transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:shadow-[var(--glow-focus)] ${
              selected
                ? 'text-cream-50 border-b-2 border-cobalt-600'
                : 'text-text-muted hover:text-cream-200'
            }`}
          >
            {item.label}
            {typeof item.badge === 'number' && item.badge > 0 ? (
              <span className="rounded-full bg-[var(--color-state-error)] px-1.5 py-0.5 text-micro text-[var(--color-on-gold)]">
                {item.badge}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
