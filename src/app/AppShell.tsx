import { useState } from 'react'
import { useIsMobile } from './useMediaQuery'
import { TopBar } from './TopBar'
import { MobileChrome } from './MobileChrome'
import { ImportDialog } from '@/components/ImportDialog'
import { PalettePanel } from '@/panels/PalettePanel'
import { InspectorPanel } from '@/panels/InspectorPanel'
import { RunPanel } from '@/panels/RunPanel'
import { FlowCanvas } from '@/canvas/FlowCanvas'
import { FlowProvider } from '@/canvas/FlowProvider'

/**
 * Responsive 3-pane grid on desktop (≥1024px: palette 280px | canvas |
 * inspector 360px) / full-canvas mobile chrome below it (ARCHITECTURE.md §2,
 * §10). Wrapped in `FlowProvider` so the palette/inspector can also call
 * `useReactFlow()` (e.g. "centre on this node"), not just the canvas itself.
 */
export function AppShell() {
  const isMobile = useIsMobile()
  const [importOpen, setImportOpen] = useState(false)

  if (isMobile) {
    return (
      <FlowProvider>
        <div className="flex h-[100dvh] flex-col overscroll-none bg-navy-900">
          <TopBar onOpenImport={() => setImportOpen(true)} />
          <MobileChrome />
          <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
        </div>
      </FlowProvider>
    )
  }

  return (
    <FlowProvider>
      <div className="grid h-screen min-h-0 grid-rows-[52px_1fr] bg-navy-900">
        <TopBar onOpenImport={() => setImportOpen(true)} />
        <div className="grid min-h-0 grid-cols-[280px_1fr_360px]">
          <aside
            data-testid="palette-panel"
            aria-label="Node palette"
            className="scroll-panel min-h-0 overflow-y-auto border-r border-line-soft bg-navy-850"
          >
            <PalettePanel />
          </aside>
          <div className="grid min-h-0 grid-rows-[1fr_260px]">
            <main className="relative min-h-0">
              <FlowCanvas />
            </main>
            <section
              aria-label="Run"
              className="scroll-panel min-h-0 overflow-y-auto border-t border-line-soft bg-navy-850"
            >
              <RunPanel />
            </section>
          </div>
          <aside
            data-testid="inspector"
            aria-label="Inspector"
            className="scroll-panel min-h-0 overflow-y-auto border-l border-line-soft bg-navy-850"
          >
            <InspectorPanel />
          </aside>
        </div>
        <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
      </div>
    </FlowProvider>
  )
}
