import clsx from 'clsx'
import { CheckIcon } from './icons'

export interface ToggleProps {
  id?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

/** 44x24 pill switch. Gold when on, navy when off, plus a check glyph so state isn't color-only (DESIGN.md §5). */
export function Toggle({ id, checked, onChange, disabled, ...rest }: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-[var(--dur-fast)]',
        'focus-visible:shadow-[var(--glow-focus)] focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-45',
        checked ? 'border-gold-400 bg-gold-400' : 'border-line bg-navy-600',
      )}
      {...rest}
    >
      <span
        className={clsx(
          'inline-flex size-[18px] items-center justify-center rounded-full bg-navy-950 transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)]',
          checked ? 'translate-x-[22px]' : 'translate-x-[3px]',
        )}
      >
        {checked && <CheckIcon size={11} className="text-gold-400" />}
      </span>
    </button>
  )
}
