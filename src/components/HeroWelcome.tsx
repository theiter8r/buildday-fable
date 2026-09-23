import { createEmptyWorkflow } from '@/domain'
import { useOpsflowStore } from '@/store'
import { Button } from './Button'
import { UploadIcon } from './icons'

export interface HeroWelcomeProps {
  onImport: () => void
}

/**
 * The first-run welcome surface (DESIGN.md §5 "Hero / welcome",
 * CONTENT.md §1). Rendered by `BootGate` when no persisted document exists.
 */
export function HeroWelcome({ onImport }: HeroWelcomeProps) {
  const resetToDemo = useOpsflowStore((s) => s.resetToDemo)
  const setDoc = useOpsflowStore((s) => s.setDoc)

  return (
    <div
      data-testid="hero"
      className="relative flex min-h-full flex-col items-center justify-center overflow-hidden px-6 py-16 text-center"
    >
      <img src="/gods-plan.jpg" alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover" />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgb(5 7 15 / 0.45) 0%, rgb(5 7 15 / 0.72) 55%, rgb(10 15 31 / 0.95) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-4 rounded-[var(--radius-lg)] ring-1 ring-inset ring-[rgb(251_246_236_/_0.25)]"
      />

      <div className="relative z-10 flex max-w-xl flex-col items-center gap-6">
        <p className="text-[length:var(--text-micro)] uppercase tracking-[0.08em] text-cream-200">
          Local-first. Nothing leaves this machine.
        </p>
        <h1
          className="font-[family-name:var(--font-display)] text-[length:var(--text-hero)] leading-[1.05] tracking-[0.02em] text-cream-50"
          style={{ textShadow: 'var(--glow-title)' }}
        >
          Every incident has a shape. Draw it before it happens.
        </h1>
        <p className="text-[length:var(--text-body)] text-cream-200">
          Build, simulate, and stress-test your incident-response workflow on a canvas — triggers,
          conditions, actions, approvals, resolutions — then watch it run node by node before it
          ever meets a real page.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="gold"
            size="touch"
            data-testid="hero-load-demo"
            onClick={() => resetToDemo()}
          >
            Load the demo workflow
          </Button>
          <Button
            variant="secondary"
            size="touch"
            data-testid="hero-blank"
            onClick={() => setDoc(createEmptyWorkflow(), 'clear')}
          >
            Start from a blank canvas
          </Button>
          <Button
            variant="ghost"
            size="touch"
            leadingIcon={<UploadIcon size={16} />}
            data-testid="hero-import"
            onClick={onImport}
          >
            Import JSON
          </Button>
        </div>
      </div>
    </div>
  )
}
