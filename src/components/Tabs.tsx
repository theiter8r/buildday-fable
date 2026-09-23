import { useId, useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'

export interface TabItem {
  id: string
  label: string
  panel: ReactNode
}

export interface TabsProps {
  label: string
  items: readonly TabItem[]
  value?: string
  onChange?: (id: string) => void
  testIdPrefix?: string
}

/** A roving-tabindex tablist (ARCHITECTURE.md §2/§12): arrow keys move focus+selection, Home/End jump to ends. */
export function Tabs({ label, items, value, onChange, testIdPrefix }: TabsProps) {
  const groupId = useId()
  const [internal, setInternal] = useState(items[0]?.id)
  const active = value ?? internal
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  function select(id: string) {
    setInternal(id)
    onChange?.(id)
  }

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    let nextIndex: number | null = null
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % items.length
    else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + items.length) % items.length
    else if (e.key === 'Home') nextIndex = 0
    else if (e.key === 'End') nextIndex = items.length - 1
    if (nextIndex === null) return
    e.preventDefault()
    const next = items[nextIndex]
    if (!next) return
    select(next.id)
    refs.current[next.id]?.focus()
  }

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex gap-1 border-b border-line-soft">
        {items.map((item, index) => {
          const selected = item.id === active
          return (
            <button
              key={item.id}
              ref={(el) => {
                refs.current[item.id] = el
              }}
              role="tab"
              id={`${groupId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${groupId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              data-testid={testIdPrefix ? `${testIdPrefix}-${item.id}` : undefined}
              onClick={() => select(item.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={clsx(
                'relative px-3 py-2 text-[length:var(--text-label)] transition-colors',
                'focus-visible:shadow-[var(--glow-focus)] focus-visible:outline-none',
                selected ? 'text-cream-50' : 'text-text-muted hover:text-cream-200',
              )}
            >
              {item.label}
              {selected && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 bg-cobalt-600" aria-hidden="true" />
              )}
            </button>
          )
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${groupId}-panel-${item.id}`}
          aria-labelledby={`${groupId}-tab-${item.id}`}
          hidden={item.id !== active}
          className="pt-3"
        >
          {item.id === active ? item.panel : null}
        </div>
      ))}
    </div>
  )
}
