/**
 * run-critical.spec.ts — critical payload takes the true branch: node order
 * page-oncall -> awaiting approval -> approve -> Resolution(resolved), with
 * timeline rows carrying timestamps. The demo Approval node's default
 * policy is `auto-approve`, so this spec forces it to `manual` first
 * (via the same `updateNodeConfig` store action the inspector will call)
 * to exercise the pause/approve path explicitly.
 */
import { expect, test } from './fixtures'
import { buildPayload, readTimelineRows, runInstant, updateNodeConfigViaStore, waitForRunStatus } from './helpers'

test.describe('run-critical', () => {
  test('critical payload pages, pauses for approval, then resolves', async ({ page, opsflow }) => {
    await updateNodeConfigViaStore(page, 'demo-approval-rollback', 'policy', 'manual')
    await opsflow.setPayload(buildPayload({ severity: 'critical' }))

    await runInstant(page)

    await waitForRunStatus(opsflow, 'awaiting-approval')
    await expect(page.getByTestId('approve-button')).toBeVisible()

    const run = await opsflow.getRun()
    expect(run.events.some((e) => e.kind === 'branch-decided' && e.branch === 'true' && e.result)).toBe(
      true,
    )
    expect(
      run.events.some(
        (e) => e.kind === 'node-started' && e.nodeId === 'demo-page-oncall',
      ),
    ).toBe(true)

    await page.getByTestId('approve-button').click()
    await waitForRunStatus(opsflow, 'completed')

    const finalRun = await opsflow.getRun()
    const finished = finalRun.events.find((e) => e.kind === 'run-finished')
    expect(finished).toBeDefined()
    expect(finished && 'summary' in finished ? finished.summary : undefined).toContain('resolved')

    const rows = await readTimelineRows(page)
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(row.text).toMatch(/\+\d+(\.\d+)?s/)
    }
  })
})
