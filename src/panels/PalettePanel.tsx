/**
 * The node library: one card per `NodeType`. Click/Enter/Space adds the
 * node at the canvas viewport center; dragging (desktop only) lets the
 * canvas lane's drop handler place it under the pointer via the
 * `application/opsflow-node` dataTransfer type (ARCHITECTURE.md §2, §10).
 */
import type { DragEvent, KeyboardEvent } from 'react'
import { NODE_TYPES } from '@/domain/types'
import type { NodeType } from '@/domain/types'
import { NodeTypeIcon } from '@/components/icons'
import { useIsMobile } from '@/app/useMediaQuery'
import { useAddNodeAtCenter } from './_fallback'
import { A11Y_CONTENT, PALETTE_CONTENT, PALETTE_NODE_CONTENT } from './content'

/** dataTransfer MIME type used to drag a palette card onto the canvas (ARCHITECTURE.md §2). */
export const PALETTE_DND_TYPE = 'application/opsflow-node'

export function PalettePanel() {
  const isMobile = useIsMobile()
  const addNodeAtCenter = useAddNodeAtCenter()

  function onDragStart(event: DragEvent<HTMLButtonElement>, type: NodeType) {
    event.dataTransfer.setData(PALETTE_DND_TYPE, type)
    event.dataTransfer.effectAllowed = 'move'
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, type: NodeType) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      addNodeAtCenter(type)
    }
  }

  return (
    <section
      aria-label="Node palette"
      className="flex h-full flex-col gap-3 overflow-y-auto p-4"
      data-testid="palette-panel"
    >
      <p className="text-meta text-text-muted">
        {isMobile ? PALETTE_CONTENT.instructionMobile : PALETTE_CONTENT.instructionDesktop}
      </p>
      <ul className="flex flex-col gap-2">
        {NODE_TYPES.map((type) => {
          const meta = PALETTE_NODE_CONTENT[type]
          return (
            <li key={type}>
              <button
                type="button"
                draggable={!isMobile}
                onDragStart={(e) => onDragStart(e, type)}
                onClick={() => addNodeAtCenter(type)}
                onKeyDown={(e) => onKeyDown(e, type)}
                data-testid={`palette-item-${type}`}
                aria-label={A11Y_CONTENT.paletteNode(meta.label)}
                title={meta.hints.join(' ')}
                className="flex w-full cursor-grab items-start gap-3 rounded-md border border-line bg-navy-800 p-3 text-left transition-colors duration-[var(--dur-fast)] hover:border-line-strong hover:bg-navy-700 focus-visible:outline-none focus-visible:shadow-[var(--glow-focus)] active:cursor-grabbing"
              >
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-navy-700"
                  style={{ color: `var(--color-node-${type})` }}
                >
                  <NodeTypeIcon type={type} size={18} />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-label font-semibold text-cream-100">{meta.label}</span>
                  <span className="text-meta text-text-muted">{meta.description}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
