import { workflowStore } from '@/store'
import type { ToastMessage } from '@/store/types'

/**
 * Imperative `toast()` helper. `store.pushToast` is the single owner of the
 * queue (and its id generation); this is a thin convenience wrapper so call
 * sites don't need `useOpsflowStore` for a one-off notification. Kept in its
 * own module (rather than alongside `<Toaster>`) so `react-refresh` doesn't
 * warn about a non-component export sharing a file with a component.
 */
function push(variant: ToastMessage['variant'], title: string, description?: string) {
  workflowStore.getState().pushToast({ variant, title, description })
}

export const toast = {
  success: (title: string, description?: string) => push('success', title, description),
  error: (title: string, description?: string) => push('error', title, description),
  info: (title: string, description?: string) => push('info', title, description),
}
