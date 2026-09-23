/**
 * editing.spec.ts — ARCHITECTURE.md §11 row 1:
 * add all 5 types via palette click, one real palette drag-drop, one real
 * handle drag connect, configure via inspector, duplicate, delete.
 */
import { expect, test } from './fixtures'
import { addNodeFromPalette, connectByHandleDrag, dragNodeFromPalette } from './helpers'

const ALL_TYPES = ['trigger', 'condition', 'action', 'approval', 'resolution'] as const

test.describe('editing', () => {
  test('adds every node type via a palette click', async ({ page, opsflow }) => {
    const before = await opsflow.getDocument()
    const beforeCount = before.nodes.length

    for (const type of ALL_TYPES) {
      await addNodeFromPalette(page, type)
    }

    await expect
      .poll(async () => (await opsflow.getDocument()).nodes.length)
      .toBe(beforeCount + ALL_TYPES.length)

    const doc = await opsflow.getDocument()
    for (const type of ALL_TYPES) {
      expect(doc.nodes.some((n) => n.type === type)).toBe(true)
    }
  })

  test('drags an Action node from the palette onto the canvas', async ({ page, opsflow }) => {
    const before = await opsflow.getDocument()
    const canvasBox = await page.getByTestId('canvas').boundingBox()
    if (!canvasBox) throw new Error('canvas has no bounding box')

    const dropPoint = { x: canvasBox.x + canvasBox.width * 0.7, y: canvasBox.y + canvasBox.height * 0.3 }
    await dragNodeFromPalette(page, 'action', dropPoint)

    await expect
      .poll(async () => (await opsflow.getDocument()).nodes.length)
      .toBe(before.nodes.length + 1)
  })

  test('connects two nodes with a real handle drag', async ({ page, opsflow }) => {
    const doc = await opsflow.getDocument()
    const before = doc.edges.length

    await connectByHandleDrag(page, {
      sourceNodeId: 'demo-condition',
      sourceHandleId: 'true',
      targetNodeId: 'demo-create-ticket',
    })

    await expect
      .poll(async () => (await opsflow.getDocument()).edges.length)
      .toBeGreaterThan(before)
  })

  test('configuring a node via the inspector persists to the node card', async ({
    page,
    opsflow,
  }) => {
    await page.getByTestId('node-demo-page-oncall').click()
    await expect(page.getByTestId('inspector')).toBeVisible()

    const targetField = page.getByTestId('inspector-field-target')
    await targetField.fill('sre-secondary')
    await targetField.blur()

    await expect
      .poll(async () => {
        const doc = await opsflow.getDocument()
        const node = doc.nodes.find((n) => n.id === 'demo-page-oncall')
        return node?.type === 'action' ? node.config.target : undefined
      })
      .toBe('sre-secondary')

    await expect(page.getByTestId('node-card-action').filter({ hasText: 'sre-secondary' })).toBeVisible()
  })

  test('duplicates the selected node', async ({ page, opsflow }) => {
    const before = await opsflow.getDocument()
    await page.getByTestId('node-demo-create-ticket').click()
    await page.keyboard.press('ControlOrMeta+d')

    await expect
      .poll(async () => (await opsflow.getDocument()).nodes.length)
      .toBe(before.nodes.length + 1)
  })

  test('deletes the selected node and its edges', async ({ page, opsflow }) => {
    const before = await opsflow.getDocument()
    await page.getByTestId('node-demo-post-slack').click()
    await page.keyboard.press('Delete')

    await expect
      .poll(async () => (await opsflow.getDocument()).nodes.some((n) => n.id === 'demo-post-slack'))
      .toBe(false)

    const after = await opsflow.getDocument()
    expect(after.nodes.length).toBe(before.nodes.length - 1)
    expect(after.edges.some((e) => e.source === 'demo-post-slack' || e.target === 'demo-post-slack')).toBe(
      false,
    )
  })
})
