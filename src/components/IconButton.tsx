import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import { Tooltip } from './Tooltip'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: every icon-only button must have a real accessible name (DESIGN.md §7). */
  label: string
  icon: ReactNode
  /** Shows a hover/focus tooltip with the same text as `label` (the common case). */
  showTooltip?: boolean
  size?: 32 | 44
  active?: boolean
}

export function IconButton({
  label,
  icon,
  showTooltip = true,
  size = 32,
  active = false,
  className,
  disabled,
  ...rest
}: IconButtonProps) {
  const button = (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active || undefined}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center rounded-[var(--radius-sm)] text-cream-200',
        'transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]',
        'hover:bg-navy-800 focus-visible:shadow-[var(--glow-focus)] focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-45',
        active && 'bg-navy-700 text-cream-50',
        size === 32 ? 'size-8' : 'size-11',
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  )

  if (!showTooltip) return button
  return <Tooltip content={label}>{button}</Tooltip>
}
