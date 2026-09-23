/**
 * Generic "local echo + debounced commit" hook shared by `useNodeField`
 * (config fields) and `NodeMetaFields` (label/notes). Extracted so both
 * paths share exactly one debounce/coalescing implementation
 * (ARCHITECTURE.md §7: 400ms, closes on blur/selection-change/other-command).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { CONFIG_COALESCE_MS } from '@/domain/constants'

export interface UseDebouncedCommitOptions<V> {
  immediate?: boolean
  validate?: (value: V) => string | undefined
}

export interface UseDebouncedCommitResult<V> {
  value: V
  error: string | undefined
  setValue: (value: V) => void
  flush: () => void
}

/** `resyncKey` resets the local echo to `storedValue` whenever it changes (e.g. a new selected node). */
export function useDebouncedCommit<V>(
  resyncKey: string,
  storedValue: V,
  onCommit: (value: V) => void,
  options: UseDebouncedCommitOptions<V> = {},
): UseDebouncedCommitResult<V> {
  const { immediate = false, validate } = options
  const [local, setLocal] = useState(storedValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastKeyRef = useRef(resyncKey)

  useEffect(() => {
    if (lastKeyRef.current !== resyncKey) {
      lastKeyRef.current = resyncKey
      setLocal(storedValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resyncKey])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const commit = useCallback((value: V) => onCommit(value), [onCommit])

  const setValue = useCallback(
    (value: V) => {
      setLocal(value)
      if (timerRef.current) clearTimeout(timerRef.current)
      if (immediate) {
        commit(value)
        return
      }
      timerRef.current = setTimeout(() => commit(value), CONFIG_COALESCE_MS)
    },
    [commit, immediate],
  )

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = undefined
    }
    commit(local)
  }, [commit, local])

  const error = validate ? validate(local) : undefined

  return { value: local, error, setValue, flush }
}
