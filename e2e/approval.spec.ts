/**
 * approval.spec.ts — ARCHITECTURE.md §11 row 5: manual policy pauses with
 * `awaiting-approval`; Approve continues; Reject ends with status `rejected`.
 */
import { expect, test } from './fixtures'
import { buildPayload, runInstant, updateNodeConfigViaStore, waitForRunStatus } from './helpers'

test.describe('approval', () => {
  test.beforeEach(async ({ page, opsflow }) => {
    await updateNodeConfigViaStore(page, 'demo-approval-rollback', 'policy', 'manual')
    await opsflow.setPayload(buildPayload({ severity: 'critical' }))
  })

  test('a manual approval pauses the run and Approve continues it', async ({ page, opsflow }) => {
    await runInstant(page)
    await waitForRunStatus(opsflow, 'awaiting-approval')

    await expect(page.getByTestId('approve-button')).toBeVisible()
    await expect(page.getByTestId('reject-button')).toBeVisible()

    await page.getByTestId('approve-button').click()
    await waitForRunStatus(opsflow, 'completed')

    const run = await opsflow.getRun()
    expect(
      run.events.some(
        (e) => e.kind === 'approval-resolved' && e.nodeId === 'demo-approval-rollback' && e.decision === 'approved',
      ),
    ).toBe(true)
  })

  test('Reject ends the run as rejected', async ({ page, opsflow }) => {
    await runInstant(page)
    await waitForRunStatus(opsflow, 'awaiting-approval')

    await page.getByTestId('reject-button').click()
    await waitForRunStatus(opsflow, 'rejected')

    const run = await opsflow.getRun()
    expect(
      run.events.some(
        (e) => e.kind === 'approval-resolved' && e.nodeId === 'demo-approval-rollback' && e.decision === 'rejected',
      ),
    ).toBe(true)
  })
})
