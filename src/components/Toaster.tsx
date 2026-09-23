import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { useOpsflowStore } from '@/store'
import type { ToastMessage } from '@/store/types'
import { CheckIcon, ErrorIcon, InfoIcon, CloseIcon } from './icons'
import { IconButton } from './IconButton'

const TONE_ICON: Record<ToastMessage['variant'], typeof CheckIcon> = {
  success: CheckIcon,
  error: ErrorIcon,
  info: InfoIcon,
}

const TONE_BAR: Record<ToastMessage['variant'], string> = {
  success: 'border-l-[var(--color-state-success)]',
  error: 'border-l-[var(--color-state-error)]',
  info: 'border-l-[var(--color-cobalt-400)]',
}

function ToastRow({ toast }: { toast: ToastMessage }) {
  // Auto-dismiss timing (4s, never for `error`) is owned by the store's
  // `pushToast` action, not this component — one timer per toast, in one
  // place, regardless of how many `<Toaster>` instances happen to mount.
  const dismissToast = useOpsflowStore((s) => s.dismissToast)
  const Icon = TONE_ICON[toast.variant]

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      data-testid="toast"
      className={clsx(
        'flex w-80 max-w-[calc(100vw-2rem)] items-start gap-2 rounded-[var(--radius-sm)] border border-l-4 border-line bg-navy-700 p-3 shadow-[var(--shadow-md)]',
        'animate-[toast-in_var(--dur)_var(--ease-out)]',
        TONE_BAR[toast.variant],
      )}
    >
      <Icon size={18} className="mt-0.5 shrink-0 text-cream-100" />
      <div className="min-w-0 flex-1">
        <p className="text-[length:var(--text-body)] text-cream-50">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-[length:var(--text-meta)] text-text-muted">{toast.description}</p>
        )}
      </div>
      <IconButton
        label="Dismiss notification"
        icon={<CloseIcon size={14} />}
        size={32}
        onClick={() => dismissToast(toast.id)}
      />
    </div>
  )
}

/** Toast host, per DESIGN.md §5: bottom-right desktop / above tab bar mobile, max 3 stacked. */
export function Toaster() {
  const toasts = useOpsflowStore((s) => s.toasts)
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-toast flex flex-col gap-2 max-[639px]:bottom-20 max-[639px]:right-3 max-[639px]:left-3">
      {toasts.slice(-3).map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastRow toast={toast} />
        </div>
      ))}
    </div>,
    document.body,
  )
}
