/**
 * The Run dock: player controls + approval prompt always visible, with a
 * Payload / Issues / Timeline tab strip below (ARCHITECTURE.md §2, §10).
 * Desktop docks this under the canvas; mobile presents it as a full sheet
 * (the sheet chrome itself is owned by the app lane's `MobileChrome`).
 */
import { useState } from 'react'
import { useOpsflowStore } from '@/store'
import { Tabs } from '@/components/Tabs'
import { PlayerControls } from './PlayerControls'
import { ApprovalPrompt } from './ApprovalPrompt'
import { PayloadEditor } from './PayloadEditor'
import { TimelineLog } from './TimelineLog'
import { ValidationPanel } from './ValidationPanel'

type RunTab = 'payload' | 'issues' | 'timeline'

export function RunPanel() {
  const [tab, setTab] = useState<RunTab>('payload')
  const issueCount = useOpsflowStore((s) => s.issues.length)

  return (
    <section aria-label="Run" data-testid="run-panel" className="flex h-full flex-col gap-3 p-3">
      <PlayerControls />
      <ApprovalPrompt />
      <div className="min-h-0 flex-1 overflow-y-auto" data-testid="run-panel-tabs">
        <Tabs
          label="Run panel sections"
          testIdPrefix="run-panel-tab"
          value={tab}
          onChange={(id) => setTab(id as RunTab)}
          items={[
            { id: 'payload', label: 'Payload', panel: <PayloadEditor /> },
            {
              id: 'issues',
              label: issueCount > 0 ? `Issues (${issueCount})` : 'Issues',
              panel: <ValidationPanel />,
            },
            { id: 'timeline', label: 'Timeline', panel: <TimelineLog /> },
          ]}
        />
      </div>
    </section>
  )
}
