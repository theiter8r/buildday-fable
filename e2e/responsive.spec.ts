/**
 * responsive.spec.ts — ARCHITECTURE.md §11 row 9: mobile FAB -> palette
 * drawer -> tap adds; node tap opens inspector sheet; Run tab strip works;
 * no horizontal overflow. Runs only against the `mobile` project (390x844).
 */
import { expect, test } from './fixtures'

test.describe('responsive', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile-only project')

  test('no horizontal overflow at 390x844', async ({ page }) => {
    const scrollWidth = await page.evaluate(() => document.scrollingElement?.scrollWidth ?? 0)
    expect(scrollWidth).toBeLessThanOrEqual(390)
  })

  test('palette drawer opens from the tab bar and adds a node by tap', async ({ page, opsflow }) => {
    const before = await opsflow.getDocument()

    await page.getByTestId('mobile-tab-palette').click()
    await page.getByTestId('palette-item-action').click()

    await expect
      .poll(async () => (await opsflow.getDocument()).nodes.length)
      .toBe(before.nodes.length + 1)

    // Adding a node selects it and opens the inspector sheet.
    await expect(page.getByTestId('inspector')).toBeVisible()
  })

  test('tapping a node opens the inspector bottom sheet', async ({ page }) => {
    await page.getByTestId('mobile-tab-canvas').click()
    await page.getByTestId('node-demo-page-oncall').click()
    await expect(page.getByTestId('inspector')).toBeVisible()
  })

  test('the Run tab strip is reachable and shows the payload editor', async ({ page }) => {
    await page.getByTestId('mobile-tab-run').click()
    await expect(page.getByTestId('payload-editor')).toBeVisible()
  })
})
