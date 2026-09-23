/**
 * Binds a single config field to the store's debounced
 * `updateNodeConfig` command (ARCHITECTURE.md §2, §7). Keeps a local echo of
 * the value so typing feels instant, then commits after `CONFIG_COALESCE_MS`
 * (400ms) of inactivity — or immediately, for controls (toggle/select) where
 * debouncing would just delay a discrete choice.
 */
import { useCallback } from 'react'
import { useOpsflowStore } from '@/store'
import { useDebouncedCommit, type UseDebouncedCommitOptions } from './useDebouncedCommit'

export function useNodeField<V>(
  nodeId: string,
  field: string,
  storedValue: V,
  options: UseDebouncedCommitOptions<V> = {},
) {
  const updateNodeConfig = useOpsflowStore((s) => s.updateNodeConfig)
  const onCommit = useCallback(
    (value: V) => updateNodeConfig(nodeId, field, value),
    [updateNodeConfig, nodeId, field],
  )
  return useDebouncedCommit(`${nodeId}:${field}`, storedValue, onCommit, options)
}
