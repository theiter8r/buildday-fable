import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
export type ButtonSize = 'default' | 'compact' | 'touch'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Shows a spinner in place of the label and sets `aria-busy`. Width is preserved. */
  loading?: boolean
  /**
   * Human reason the button is disabled. Per DESIGN.md, a disabled button
   * must always be paired with an explanation — this renders it as a
   * `title` attribute and `aria-describedby`'d hint element so the reason is
   * available to pointer, keyboard and screen-reader users alike.
   */
  disabledReason?: string
  leadingIcon?: ReactNode
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-cobalt-600 text-[var(--color-on-cobalt)] hover:bg-cobalt-500',
  secondary: 'bg-navy-700 text-cream-100 border border-line hover:border-line-strong',
  ghost: 'bg-transparent text-cream-200 hover:bg-navy-800',
  danger:
    'bg-transparent text-[var(--color-state-error)] border border-[var(--color-state-error)] hover:bg-[rgb(255_143_130_/_0.12)]',
  gold: 'bg-gold-400 text-[var(--color-on-gold)] hover:bg-gold-300',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: 'h-9 px-4 text-[length:var(--text-body)]',
  compact: 'h-8 px-3 text-[length:var(--text-meta)]',
  touch: 'h-11 px-5 text-[length:var(--text-body)]',
}

export function Button({
  variant = 'secondary',
  size = 'default',
  loading = false,
  disabledReason,
  disabled,
  leadingIcon,
  className,
  children,
  id,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading
  const reasonId = disabledReason && id ? `${id}-disabled-reason` : undefined

  return (
    <span className="relative inline-flex">
      <button
        id={id}
        type="button"
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-describedby={reasonId ?? rest['aria-describedby']}
        title={isDisabled && disabledReason ? disabledReason : rest.title}
        className={clsx(
          'inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-medium',
          'transition-[background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)]',
          'focus-visible:shadow-[var(--glow-focus)] focus-visible:outline-none active:scale-[0.98]',
          'disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...rest}
      >
        {loading ? (
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          leadingIcon
        )}
        <span className={loading ? 'invisible' : undefined}>{children}</span>
        {loading && <span className="sr-only">Loading</span>}
      </button>
      {reasonId && (
        <span id={reasonId} className="sr-only">
          {disabledReason}
        </span>
      )}
    </span>
  )
}
