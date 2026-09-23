import type { ButtonHTMLAttributes, ReactNode, HTMLAttributes } from 'react'
import clsx from 'clsx'

export type ChipTone = 'neutral' | 'success' | 'warning' | 'error' | 'gold' | 'running'

const TONE_CLASSES: Record<ChipTone, string> = {
  neutral: 'border-line text-text-muted',
  success: 'border-[var(--color-state-success)] text-[var(--color-state-success)]',
  warning: 'border-[var(--color-state-warning)] text-[var(--color-state-warning)]',
  error: 'border-[var(--color-state-error)] text-[var(--color-state-error)]',
  gold: 'border-gold-400 text-gold-300',
  running: 'border-[var(--color-state-running)] text-[var(--color-state-running)]',
}

interface ChipBaseProps {
  tone?: ChipTone
  icon?: ReactNode
  children: ReactNode
}

/** A pill chip, e.g. save status, validation count, branch labels. Not interactive by default. */
export function Chip({
  tone = 'neutral',
  icon,
  children,
  className,
  ...rest
}: ChipBaseProps & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border px-2.5 py-1',
        'text-[length:var(--text-meta)] leading-none',
        TONE_CLASSES[tone],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  )
}

/** An interactive chip variant (e.g. the disabled-Run reason button). */
export function ChipButton({
  tone = 'neutral',
  icon,
  children,
  className,
  ...rest
}: ChipBaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border px-2.5 py-1',
        'text-[length:var(--text-meta)] leading-none transition-colors',
        'hover:bg-navy-800 focus-visible:shadow-[var(--glow-focus)] focus-visible:outline-none',
        TONE_CLASSES[tone],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
