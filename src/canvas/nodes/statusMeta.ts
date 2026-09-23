/**
 * Per-`NodeRunState` glyph/label/color, shared by every node card so status
 * is never carried by hue alone (DESIGN.md §1.5 / §7): a glyph, a text
 * label, and (in `NodeShell`) a border treatment all agree.
 */
import type { NodeRunState } from '@/domain/types'

export interface StatusMeta {
  glyph: string
  label: string
  color: string
}

export const STATUS_META: Record<NodeRunState, StatusMeta> = {
  idle: { glyph: '•', label: 'idle', color: 'var(--color-state-idle)' },
  pending: { glyph: '•', label: 'pending', color: 'var(--color-state-pending)' },
  running: { glyph: '▷', label: 'running', color: 'var(--color-state-running)' },
  success: { glyph: '✓', label: 'success', color: 'var(--color-state-success)' },
  failed: { glyph: '✕', label: 'failed', color: 'var(--color-state-failed)' },
  skipped: { glyph: '⤼', label: 'skipped', color: 'var(--color-state-skipped)' },
  'awaiting-approval': { glyph: '⏸', label: 'awaiting approval', color: 'var(--color-state-awaiting)' },
}
