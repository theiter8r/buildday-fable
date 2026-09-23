/**
 * Barrel for the store lane. Other lanes should import from `@/store`
 * rather than reaching into individual files.
 *
 * Importing this module (transitively, e.g. once near the app's entry
 * point) installs three side effects against the live `workflowStore`
 * singleton, mirroring `testHandle.ts`'s existing self-install pattern:
 * boot-time load (`bootWorkflowStore`), autosave (`installAutosave`), and
 * the `window.__opsflow` e2e handle. None of these run against
 * `createWorkflowStore()` test instances — tests that want them call the
 * installers explicitly against their own store.
 */
export * from './types'
export * from './commands'
export * from './history'
export * from './e2e'
export * from './selectors'
export * from './workflowStore'
export * from './boot'
export * from './autosave'
export * from './testHandle'

import { installAutosave } from './autosave'
import { bootWorkflowStore } from './boot'
import { workflowStore } from './workflowStore'

bootWorkflowStore(workflowStore)
installAutosave(workflowStore)
