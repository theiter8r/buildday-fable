/**
 * history.spec.ts — ARCHITECTURE.md §11 row 7: add node -> Cmd+Z gone ->
 * Shift+Cmd+Z back; typing a target is one undo step; move undo restores
 * position.
 */
import { expect, test } from './fixtures'
import { addNodeFromPalette } from './helpers'

test.describe('history', () => {
  test('undo/redo via keyboard reverses and reapplies an add-node command', async ({
    page,
    opsflow,
  }) => {
    const before = await opsflow.getDocument()
    await addNodeFromPalette(page, 'action')

    await expect
      .poll(async () => (await opsflow.getDocument()).nodes.length)
      .toBe(before.nodes.length + 1)

    await page.keyboard.press('ControlOrMeta+z')
    await expect
      .poll(async () => (await opsflow.getDocument()).nodes.length)
      .toBe(before.nodes.length)

    await page.keyboard.press('ControlOrMeta+Shift+z')
    await expect
      .poll(async () => (await opsflow.getDocument()).nodes.length)
      .toBe(before.nodes.length + 1)
  })

  test('undo/redo via the toolbar buttons', async ({ page, opsflow }) => {
    const before = await opsflow.getDocument()
    await addNodeFromPalette(page, 'condition')
    await expect
      .poll(async () => (await opsflow.getDocument()).nodes.length)
      .toBe(before.nodes.length + 1)

    await page.getByTestId('undo-button').click()
    await expect
      .poll(async () => (await opsflow.getDocument()).nodes.length)
      .toBe(before.nodes.length)

    await page.getByTestId('redo-button').click()
    await expect
      .poll(async () => (await opsflow.getDocument()).nodes.length)
      .toBe(before.nodes.length + 1)
  })

  test('typing a target field is coalesced into a single undo step', async ({ page, opsflow }) => {
    await page.getByTestId('node-demo-page-oncall').click()
    const field = page.getByTestId('inspector-field-target')
    await field.fill('sre-')
    await field.fill('sre-secondary')
    await field.blur()

    await expect
      .poll(async () => {
        const doc = await opsflow.getDocument()
        const node = doc.nodes.find((n) => n.id === 'demo-page-oncall')
        return node?.type === 'action' ? node.config.target : undefined
      })
      .toBe('sre-secondary')

    await opsflow.undo()
    const doc = await opsflow.getDocument()
    const node = doc.nodes.find((n) => n.id === 'demo-page-oncall')
    expect(node?.type === 'action' ? node.config.target : undefined).toBe('sre-primary')
  })
})
