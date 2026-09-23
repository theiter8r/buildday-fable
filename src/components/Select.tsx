import type { SelectHTMLAttributes } from 'react'
import clsx from 'clsx'
import { ChevronDownIcon } from './icons'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: readonly SelectOption[]
}

/** Native `<select>` styled to match the design system — real keyboard behaviour beats a custom listbox (DESIGN.md §5). */
export function Select({ options, className, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={clsx(
          'h-9 w-full appearance-none rounded-[var(--radius-sm)] border border-line bg-navy-800 pl-3 pr-9 text-[length:var(--text-body)] text-cream-50',
          'transition-colors duration-[var(--dur-fast)]',
          'hover:border-line-strong focus-visible:border-cobalt-400 focus-visible:shadow-[var(--glow-focus)] focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-45',
          className,
        )}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
      />
    </div>
  )
}
