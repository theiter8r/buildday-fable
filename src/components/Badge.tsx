import clsx from 'clsx'
import type { ReactNode } from 'react'

export type BadgeTone = 'success' | 'warning' | 'error' | 'gold' | 'neutral'

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: 'bg-[rgb(121_211_166_/_0.16)] text-[var(--color-state-success)]',
  warning: 'bg-[rgb(232_183_90_/_0.16)] text-[var(--color-state-warning)]',
  error: 'bg-[rgb(255_143_130_/_0.16)] text-[var(--color-state-error)]',
  gold: 'bg-[rgb(232_183_90_/_0.16)] text-gold-300',
  neutral: 'bg-navy-700 text-text-muted',
}

export interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}

/** Small uppercase status label, e.g. "WILL FAIL", "PM", "RESOLVED" (DESIGN.md node card specs). */
export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-[var(--radius-xs)] px-1.5 py-0.5',
        'text-[length:var(--text-micro)] font-semibold uppercase tracking-[0.08em]',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
