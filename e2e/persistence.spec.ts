/**
 * persistence.spec.ts — ARCHITECTURE.md §11 row 6: rename + move + configure,
 * `page.reload()`, everything survives; Reset to demo restores.
 */
import { expect, test } from './fixtures'
import { updateNodeConfigViaStore } from './helpers'

test.describe('persistence', () => {
  test('edits survive a reload', async ({ page, opsflow }) => {
    const nameInput = page.getByTestId('workflow-name-input')
    await nameInput.fill('Renamed Incident Flow')
    await nameInput.blur()

    await updateNodeConfigViaStore(page, 'demo-page-oncall', 'target', 'sre-secondary')

    await expect
      .poll(async () => (await opsflow.getDocument()).name)
      .toBe('Renamed Incident Flow')
    // Autosave debounces at 600ms (ARCHITECTURE.md §8) — wait for the saved chip.
    await expect(page.getByTestId('save-status')).toHaveText(/Saved/i, { timeout: 5_000 })

    await page.reload()
    await expect(page.getByTestId('canvas')).toBeAttached()

    await expect
      .poll(async () => (await opsflow.getDocument()).name)
      .toBe('Renamed Incident Flow')
    const doc = await opsflow.getDocument()
    const node = doc.nodes.find((n) => n.id === 'demo-page-oncall')
    expect(node?.type === 'action' ? node.config.target : undefined).toBe('sre-secondary')
  })

  test('Reset to demo restores the original workflow', async ({ page, opsflow }) => {
    const nameInput = page.getByTestId('workflow-name-input')
    await nameInput.fill('Something Else Entirely')
    await nameInput.blur()

    await page.getByTestId('reset-button').click()
    await page.getByTestId('confirm-dialog-confirm').click()

    await expect
      .poll(async () => (await opsflow.getDocument()).name)
      .toBe('Critical API Incident')
  })
})
