import clsx from 'clsx'

export interface LoadingStateProps {
  label: string
  className?: string
}

/**
 * Shimmerless skeleton — three cobalt-tinted blocks pulsing at staggered
 * opacity (DESIGN.md §5: "never a bare spinner on a full screen").
 */
export function LoadingState({ label, className }: LoadingStateProps) {
  return (
    <div
      data-testid="loading-state"
      role="status"
      aria-live="polite"
      className={clsx('flex flex-col items-center gap-4 px-6 py-10', className)}
    >
      <div className="flex flex-col gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-3 w-48 animate-pulse rounded-[var(--radius-xs)] bg-navy-800"
            style={{ animationDelay: `${i * 160}ms`, animationDuration: '1.4s' }}
          />
        ))}
      </div>
      <p className="text-[length:var(--text-meta)] text-text-muted">{label}</p>
    </div>
  )
}
