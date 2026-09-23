import type { InputHTMLAttributes } from 'react'
import clsx from 'clsx'

export interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value'> {
  value: number
  onChange: (value: number) => void
  /** Rendered as a suffix inside the field, e.g. "ms" (DESIGN.md §5). */
  unit?: string
}

export function NumberInput({ value, onChange, unit, className, ...rest }: NumberInputProps) {
  return (
    <div className="relative flex items-center">
      <input
        type="number"
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => {
          const next = e.target.valueAsNumber
          onChange(Number.isNaN(next) ? 0 : next)
        }}
        className={clsx(
          'h-9 w-full rounded-[var(--radius-sm)] border border-line bg-navy-800 px-3 text-[length:var(--text-body)] text-cream-50',
          'font-[family-name:var(--font-mono)] [font-variant-numeric:tabular-nums]',
          'placeholder:text-text-subtle transition-colors duration-[var(--dur-fast)]',
          'hover:border-line-strong focus-visible:border-cobalt-400 focus-visible:shadow-[var(--glow-focus)] focus-visible:outline-none',
          'aria-invalid:border-[var(--color-state-error)]',
          'disabled:cursor-not-allowed disabled:opacity-45',
          unit && 'pr-10',
          className,
        )}
        {...rest}
      />
      {unit && (
        <span className="pointer-events-none absolute right-3 text-[length:var(--text-meta)] text-text-muted">
          {unit}
        </span>
      )}
    </div>
  )
}
