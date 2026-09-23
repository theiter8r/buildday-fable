/** Minimal typed local fallback for the shared `Toggle` primitive (see docs/lane-notes/panels.md). */
import { CheckIcon } from '@/components/icons'

export interface ToggleProps {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  hideLabel?: boolean
  disabled?: boolean
  'aria-describedby'?: string
}

export function Toggle({
  id,
  checked,
  onChange,
  label,
  hideLabel = false,
  disabled,
  'aria-describedby': describedBy,
}: ToggleProps) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:shadow-[var(--glow-focus)] disabled:cursor-not-allowed disabled:opacity-45 ${
          checked ? 'bg-gold-400' : 'bg-navy-600'
        }`}
      >
        <span
          className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-navy-950 transition-transform duration-[var(--dur-fast)] ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        >
          {checked ? <CheckIcon size={10} className="text-gold-400" /> : null}
        </span>
      </button>
      <span className={hideLabel ? 'sr-only' : 'text-body text-cream-200'}>{label}</span>
    </label>
  )
}
