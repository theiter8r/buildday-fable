/**
 * Run/Pause/Resume/Step/Reset transport plus the 1x/2x/Instant speed
 * control and progress rail (ARCHITECTURE.md §2, §4; DESIGN.md "Run panel
 * and timeline"; CONTENT.md §6).
 *
 * Only `pause-button` / `step-button` / `speed-select` are in the canonical
 * testid table (docs/testing-conventions.md); Run/Resume/Reset rely on their
 * accessible name (`getByRole('button', { name: … })`) per that table's own
 * "prefer role/label" rule. See docs/lane-notes/panels.md for a request to
 * add `run-button`'s panel counterpart if e2e ever needs it directly.
 */
import { PauseIcon, PlayIcon, ResetIcon, StepForwardIcon } from '@/components/icons'
import type { ExecutionEvent } from '@/domain/types'
import { useOpsflowStore } from '@/store'
import { Button } from '@/components/Button'
import { Tooltip } from '@/components/Tooltip'
import { A11Y_CONTENT, RUN_CONTENT } from './content'

const SPEEDS = [
  { value: 1, label: RUN_CONTENT.controls.speed1x },
  { value: 2, label: RUN_CONTENT.controls.speed2x },
  { value: 'instant', label: RUN_CONTENT.controls.speedInstant },
] as const

export function PlayerControls() {
  const status = useOpsflowStore((s) => s.status)
  const speed = useOpsflowStore((s) => s.speed)
  const events = useOpsflowStore((s) => s.events)
  const currentIndex = useOpsflowStore((s) => s.currentIndex)
  const runDisabledReason = useOpsflowStore((s) => s.runDisabledReason)
  const start = useOpsflowStore((s) => s.start)
  const pause = useOpsflowStore((s) => s.pause)
  const resume = useOpsflowStore((s) => s.resume)
  const step = useOpsflowStore((s) => s.step)
  const reset = useOpsflowStore((s) => s.reset)
  const setSpeed = useOpsflowStore((s) => s.setSpeed)

  const isIdle = status === 'idle'
  const isRunning = status === 'running'
  const isPaused = status === 'paused'
  const isTerminal =
    status === 'completed' || status === 'failed' || status === 'rejected' || status === 'cancelled'
  const canRun = runDisabledReason === null

  const progress = events.length > 0 ? Math.max(0, currentIndex + 1) / events.length : 0
  const statusText = isIdle
    ? RUN_CONTENT.idle
    : isRunning
      ? RUN_CONTENT.running(currentEventLabel(events, currentIndex))
      : isPaused
        ? 'Paused.'
        : isTerminal
          ? RUN_CONTENT.timeline.runFinished(status)
          : ''

  return (
    <div className="flex flex-col gap-2" data-testid="player-controls">
      <div className="flex items-center gap-2">
        {isIdle || isTerminal ? (
          <Tooltip content={RUN_CONTENT.controls.runTooltip}>
            <Button
              variant="primary"
              disabled={!canRun}
              aria-label={A11Y_CONTENT.runControls.run}
              onClick={start}
            >
              <PlayIcon size={16} />
              {RUN_CONTENT.controls.run}
            </Button>
          </Tooltip>
        ) : isPaused ? (
          <Tooltip content={RUN_CONTENT.controls.resumeTooltip}>
            <Button variant="primary" aria-label={A11Y_CONTENT.runControls.resume} onClick={resume}>
              <PlayIcon size={16} />
              {RUN_CONTENT.controls.resume}
            </Button>
          </Tooltip>
        ) : (
          <Tooltip content={RUN_CONTENT.controls.pauseTooltip}>
            <Button
              variant="secondary"
              data-testid="pause-button"
              aria-label={A11Y_CONTENT.runControls.pause}
              onClick={pause}
            >
              <PauseIcon size={16} />
              {RUN_CONTENT.controls.pause}
            </Button>
          </Tooltip>
        )}

        <Tooltip content={RUN_CONTENT.controls.stepTooltip}>
          <Button
            variant="ghost"
            size="compact"
            data-testid="step-button"
            aria-label={A11Y_CONTENT.runControls.step}
            disabled={isIdle && !canRun}
            onClick={step}
          >
            <StepForwardIcon size={16} />
          </Button>
        </Tooltip>

        <Tooltip content={RUN_CONTENT.controls.resetTooltip}>
          <Button
            variant="ghost"
            size="compact"
            aria-label={A11Y_CONTENT.runControls.reset}
            disabled={isIdle}
            onClick={reset}
          >
            <ResetIcon size={16} />
          </Button>
        </Tooltip>

        <div
          role="radiogroup"
          aria-label={RUN_CONTENT.controls.speedTooltip}
          data-testid="speed-select"
          className="ml-auto flex overflow-hidden rounded-sm border border-line"
        >
          {SPEEDS.map((s) => (
            <button
              key={String(s.value)}
              type="button"
              role="radio"
              aria-checked={speed === s.value}
              onClick={() => setSpeed(s.value)}
              className={`px-2.5 py-1 text-meta font-medium transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:shadow-[var(--glow-focus)] ${
                speed === s.value
                  ? 'bg-navy-700 text-gold-300 border-b-2 border-gold-400'
                  : 'bg-navy-800 text-text-muted hover:text-cream-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-navy-700" aria-hidden="true">
        <div
          className="h-full bg-cobalt-500 transition-[width] duration-[var(--dur-fast)]"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <p aria-live="polite" className="text-meta text-text-muted" data-testid="run-status-text">
        {statusText}
      </p>
      {!canRun && (isIdle || isTerminal) ? (
        <p data-testid="run-blocked-reason" className="text-meta text-[var(--color-state-error)]">
          {runDisabledReason}
        </p>
      ) : null}
    </div>
  )
}

function currentEventLabel(events: ExecutionEvent[], index: number): string {
  const event = events[index]
  if (!event) return ''
  if ('label' in event && typeof event.label === 'string') return event.label
  if ('nodeId' in event && typeof event.nodeId === 'string') return event.nodeId
  return ''
}
