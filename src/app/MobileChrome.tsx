import { useOpsflowStore } from '@/store'
import type { MobilePanel } from '@/store/types'
import { PaletteIcon, InspectorIcon, TimelineIcon } from '@/components/icons'
import { NodeTypeIcon } from '@/components/icons'
import { Drawer } from '@/components/Drawer'
import { BottomSheet } from '@/components/BottomSheet'
import { PalettePanel } from '@/panels/PalettePanel'
import { InspectorPanel } from '@/panels/InspectorPanel'
import { RunPanel } from '@/panels/RunPanel'
import { FlowCanvas } from '@/canvas/FlowCanvas'

const TABS: { id: MobilePanel; label: string; icon: (size: number) => React.ReactNode }[] = [
  { id: 'canvas', label: 'Canvas', icon: (size) => <NodeTypeIcon type="action" size={size} /> },
  { id: 'palette', label: 'Palette', icon: (size) => <PaletteIcon size={size} /> },
  { id: 'inspector', label: 'Inspector', icon: (size) => <InspectorIcon size={size} /> },
  { id: 'run', label: 'Run', icon: (size) => <TimelineIcon size={size} /> },
]

/** Bottom tab bar (Canvas/Palette/Inspector/Run) + drawer/sheet hosts (ARCHITECTURE.md §2, §10). */
export function MobileChrome() {
  const active = useOpsflowStore((s) => s.activeMobilePanel)
  const setActive = useOpsflowStore((s) => s.setActiveMobilePanel)
  const selectedNodeId = useOpsflowStore((s) => s.selectedNodeId)

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1">
        <FlowCanvas />
      </div>

      <Drawer open={active === 'palette'} onClose={() => setActive('canvas')} title="Add node">
        <PalettePanel />
      </Drawer>

      <BottomSheet
        open={active === 'inspector' && Boolean(selectedNodeId)}
        onClose={() => setActive('canvas')}
        title="Inspector"
        heightFraction={0.6}
        testId="inspector-sheet"
      >
        <InspectorPanel />
      </BottomSheet>

      <BottomSheet
        open={active === 'run'}
        onClose={() => setActive('canvas')}
        title="Run"
        heightFraction={0.92}
        testId="run-sheet"
      >
        <RunPanel />
      </BottomSheet>

      <nav
        aria-label="Mobile sections"
        className="flex border-t border-line-soft bg-navy-850 pb-[env(safe-area-inset-bottom)]"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-testid={`mobile-tab-${tab.id}`}
            aria-label={tab.label}
            aria-current={active === tab.id ? 'page' : undefined}
            onClick={() => setActive(tab.id)}
            className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[length:var(--text-micro)] uppercase tracking-[0.04em] focus-visible:shadow-[var(--glow-focus)] focus-visible:outline-none ${
              active === tab.id ? 'text-cream-50' : 'text-text-muted'
            }`}
          >
            {tab.icon(20)}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
