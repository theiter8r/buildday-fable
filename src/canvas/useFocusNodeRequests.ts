/**
 * Reacts to "select and centre this node" requests from elsewhere in the
 * app (e.g. clicking a `ValidationPanel`/`TimelineLog` row) by calling
 * `fitView` on it.
 *
 * ADAPTER (see docs/lane-notes/canvas.md): ARCHITECTURE.md §6 describes
 * this as driven by a store field, but `WorkflowSlice`/`RunSlice`
 * (`store/types.ts`) have no such field today. Until the store lane adds
 * one, other lanes should dispatch
 * `window.dispatchEvent(new CustomEvent('opsflow:focus-node', { detail: { nodeId } }))`
 * and this hook will pick it up — it is a drop-in replacement, not a
 * parallel code path, so swapping to a store field later is a one-file change.
 */
import { useEffect } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useReducedMotion } from '@/app/useReducedMotion'

export const FOCUS_NODE_EVENT = 'opsflow:focus-node'

export interface FocusNodeEventDetail {
  nodeId: string
}

export function useFocusNodeRequests(): void {
  const { fitView } = useReactFlow()
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    function onFocusNode(event: Event): void {
      const detail = (event as CustomEvent<FocusNodeEventDetail>).detail
      if (!detail?.nodeId) return
      void fitView({
        nodes: [{ id: detail.nodeId }],
        duration: reducedMotion ? 0 : 300,
        maxZoom: 1.2,
      })
    }

    window.addEventListener(FOCUS_NODE_EVENT, onFocusNode)
    return () => window.removeEventListener(FOCUS_NODE_EVENT, onFocusNode)
  }, [fitView, reducedMotion])
}
