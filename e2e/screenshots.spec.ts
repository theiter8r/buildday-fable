/**
 * screenshots.spec.ts — QA evidence capture, run via `npm run screenshots`
 * (see `scripts/screenshots.ts`). Writes:
 *   qa/screenshots/desktop-{home,editing,validation,running,complete}.png
 *   qa/screenshots/mobile-{home,palette,inspector,run}.png
 *
 * These are plain evidence captures (`page.screenshot({ path })`), not
 * `toHaveScreenshot` visual-regression baselines — per
 * docs/spikes/react-flow-playwright.md §C.12, pixel-diffing an
 * animation-bearing canvas is flaky by design; the goal here is a reviewable
 * artifact, not a pass/fail diff. Reduced motion is emulated so captures
 * never land mid-transition.
 */
import { expect, test } from './fixtures'
import { buildPayload, runInstant, waitForRunStatus } from './helpers'

test.describe('screenshots', () => {
  test.skip(({ isMobile }) => isMobile === true, 'desktop captures run only on the desktop project')

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('desktop: home', async ({ page }) => {
    await page.screenshot({ path: 'qa/screenshots/desktop-home.png' })
  })

  test('desktop: editing', async ({ page }) => {
    await page.getByTestId('node-demo-page-oncall').click()
    await expect(page.getByTestId('inspector')).toBeVisible()
    await page.screenshot({ path: 'qa/screenshots/desktop-editing.png' })
  })

  test('desktop: validation', async ({ page, opsflow }) => {
    await page.getByTestId('node-demo-trigger').click()
    await page.keyboard.press('Delete')
    await expect
      .poll(async () => (await opsflow.getDocument()).nodes.some((n) => n.id === 'demo-trigger'))
      .toBe(false)
    await expect(page.getByTestId('run-blocked-reason')).toBeVisible()
    await page.screenshot({ path: 'qa/screenshots/desktop-validation.png' })
  })

  test('desktop: running', async ({ page, opsflow }) => {
    await opsflow.setPayload(buildPayload({ severity: 'critical' }))
    await page.getByTestId('speed-select').getByRole('radio', { name: '2x' }).check()
    await page.getByTestId('run-button').click()
    await expect
      .poll(async () => (await opsflow.getRun()).status)
      .not.toBe('idle')
    await page.screenshot({ path: 'qa/screenshots/desktop-running.png' })
  })

  test('desktop: complete', async ({ page, opsflow }) => {
    await opsflow.setPayload(buildPayload({ severity: 'low' }))
    await runInstant(page)
    await waitForRunStatus(opsflow, 'completed')
    await page.screenshot({ path: 'qa/screenshots/desktop-complete.png' })
  })
})

test.describe('screenshots (mobile)', () => {
  test.skip(({ isMobile }) => isMobile !== true, 'mobile captures run only on the mobile project')

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('mobile: home', async ({ page }) => {
    await page.screenshot({ path: 'qa/screenshots/mobile-home.png' })
  })

  test('mobile: palette', async ({ page }) => {
    await page.getByTestId('mobile-tab-palette').click()
    await page.screenshot({ path: 'qa/screenshots/mobile-palette.png' })
  })

  test('mobile: inspector', async ({ page }) => {
    await page.getByTestId('node-demo-page-oncall').click()
    await expect(page.getByTestId('inspector')).toBeVisible()
    await page.screenshot({ path: 'qa/screenshots/mobile-inspector.png' })
  })

  test('mobile: run', async ({ page }) => {
    await page.getByTestId('mobile-tab-run').click()
    await expect(page.getByTestId('payload-editor')).toBeVisible()
    await page.screenshot({ path: 'qa/screenshots/mobile-run.png' })
  })
})
