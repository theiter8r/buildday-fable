/**
 * Module-level edge type map. Must be a stable reference — never recreate
 * this inline in a component (ARCHITECTURE.md §7 / the React Flow spike's
 * gotcha #1: an unstable `edgeTypes` object remounts every edge on render).
 */
import type { EdgeTypes } from '@xyflow/react'
import { FlowEdge } from './edges/FlowEdge'

export const edgeTypes = {
  flow: FlowEdge,
} satisfies EdgeTypes
