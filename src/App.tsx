import { AppErrorBoundary } from './app/AppErrorBoundary'
import { BootGate } from './app/BootGate'
import { AppShell } from './app/AppShell'
import { Toaster } from './components/Toaster'

/**
 * Providers + boot gate + error boundary (ARCHITECTURE.md §2). Lives at
 * `src/App.tsx` (not `src/app/App.tsx`) because `main.tsx` — a shared file
 * this lane does not own — already imports `./App.tsx`; moving the entry
 * point would require touching a file outside this lane's ownership for no
 * behavioural gain. `src/app/**` still holds every other shell module.
 *
 * NOTE: ARCHITECTURE.md §2 also lists a `<ReactFlowProvider>` at this level.
 * It is wrapped one level lower instead — inside `AppShell`, via the canvas
 * lane's `<FlowProvider>` — so it wraps the palette/canvas/inspector grid
 * specifically without also wrapping `BootGate`'s hero/error states, which
 * have no need of `useReactFlow()`.
 */
function App() {
  return (
    <AppErrorBoundary>
      <BootGate>
        <AppShell />
      </BootGate>
      <Toaster />
    </AppErrorBoundary>
  )
}

export default App
