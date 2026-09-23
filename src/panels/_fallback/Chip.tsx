/** Minimal typed local fallback for the shared `Chip` primitive (see docs/lane-notes/panels.md). */
import type { ReactNode } from 'react'

export interface ChipProps {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'error' | 'gold'
  className?: string
}

const TONE_CLASSES: Record<NonNullable<ChipProps['tone']>, string> = {
  neutral: 'bg-navy-800 text-text-muted border-line',
  success: 'bg-navy-800 text-[var(--color-state-success)] border-[var(--color-state-success)]',
  warning: 'bg-navy-800 text-[var(--color-state-warning)] border-[var(--color-state-warning)]',
  error: 'bg-navy-800 text-[var(--color-state-error)] border-[var(--color-state-error)]',
  gold: 'bg-navy-800 text-gold-300 border-gold-400',
}

export function Chip({ children, tone = 'neutral', className = '' }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5 text-micro uppercase tracking-[0.08em] ${TONE_CLASSES[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  )
}
