import { expect, test } from '@playwright/test'

test.describe('visual snapshots', () => {
  test('desktop home', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await expect(page.getByText('OpsFlow')).toBeVisible()
    await page.screenshot({ path: 'qa/screenshots/desktop-home.png', fullPage: true })
  })

  test('mobile home', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await expect(page.getByText('OpsFlow')).toBeVisible()
    await page.screenshot({ path: 'qa/screenshots/mobile-home.png', fullPage: true })
  })
})
