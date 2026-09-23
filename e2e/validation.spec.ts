/**
 * validation.spec.ts — ARCHITECTURE.md §11 row 2:
 * disconnect -> Run disabled + reason text; issue row click selects and
 * centres the node; fix it -> Run enabled.
 */
import { expect, test } from './fixtures'
import { connectViaHandle } from './helpers'

test.describe('validation', () => {
  test('disconnecting the trigger disables Run with a reason and an issue row', async ({
    page,
    opsflow,
  }) => {
    await page.getByTestId('node-demo-trigger').click()
    await page.keyboard.press('Delete')

    await expect
      .poll(async () => (await opsflow.getDocument()).nodes.some((n) => n.id === 'demo-trigger'))
      .toBe(false)

    await expect(page.getByTestId('run-button')).toBeDisabled()
    await expect(page.getByTestId('run-blocked-reason')).toBeVisible()
    await expect(page.getByTestId('validation-issue-NO_TRIGGER')).toBeVisible()
  })

  test('clicking an issue row selects and centres its node', async ({ page, opsflow }) => {
    // Remove the false-branch edge -> CONDITION_MISSING_BRANCH on demo-condition.
    const doc = await opsflow.getDocument()
    const falseEdge = doc.edges.find(
      (e) => e.source === 'demo-condition' && e.sourceHandle === 'false',
    )
    if (!falseEdge) throw new Error('demo workflow has no false-branch edge to remove')
    await page.locator(`.react-flow__edge[data-id="${falseEdge.id}"]`).click()
    await page.keyboard.press('Delete')

    const issueRow = page.getByTestId('validation-issue-CONDITION_MISSING_BRANCH').first()
    await expect(issueRow).toBeVisible()
    await issueRow.click()

    await expect(page.getByTestId('inspector')).toBeVisible()
    await expect(page.getByTestId('node-demo-condition')).toHaveAttribute('aria-selected', 'true')
  })

  test('reconnecting the missing branch re-enables Run', async ({ page, opsflow }) => {
    const doc = await opsflow.getDocument()
    const falseEdge = doc.edges.find(
      (e) => e.source === 'demo-condition' && e.sourceHandle === 'false',
    )
    if (!falseEdge) throw new Error('demo workflow has no false-branch edge to remove')
    await page.locator(`.react-flow__edge[data-id="${falseEdge.id}"]`).click()
    await page.keyboard.press('Delete')
    await expect(page.getByTestId('run-button')).toBeDisabled()

    await connectViaHandle(opsflow, 'demo-condition', 'demo-create-ticket', 'false')

    await expect(page.getByTestId('run-button')).toBeEnabled()
  })
})
