/**
 * import-export.spec.ts — ARCHITECTURE.md §11 row 8 / §9: download filename +
 * JSON parses + schema version; upload via `setInputFiles` round-trips;
 * paste dialog; invalid JSON shows a readable error.
 */
import { expect, test } from './fixtures'
import { exportAndReadDownload, openImportDialog, uploadWorkflowFile } from './helpers'

test.describe('import-export', () => {
  test('exports a workflow with a parseable filename and schema version', async ({ page }) => {
    const { filename, doc } = await exportAndReadDownload(page)
    expect(filename).toMatch(/^opsflow-.*\.json$/)
    expect(doc.schemaVersion).toBeGreaterThanOrEqual(1)
    expect(Array.isArray(doc.nodes)).toBe(true)
    expect(Array.isArray(doc.edges)).toBe(true)
  })

  test('uploads an exported workflow via the hidden file input and round-trips', async ({
    page,
    opsflow,
  }) => {
    const { doc } = await exportAndReadDownload(page)
    const modified = { ...doc, name: 'Uploaded Copy' }

    await openImportDialog(page)
    await uploadWorkflowFile(page, modified)
    await page.getByTestId('import-submit').click()

    await expect
      .poll(async () => (await opsflow.getDocument()).name)
      .toBe('Uploaded Copy')
  })

  test('imports pasted JSON via the paste tab', async ({ page, opsflow }) => {
    const doc = await opsflow.getDocument()
    const modified = { ...doc, name: 'Pasted Copy' }

    await openImportDialog(page)
    await page.getByRole('tab', { name: 'Paste JSON' }).click()
    await page.getByTestId('import-paste-textarea').fill(JSON.stringify(modified))
    await page.getByTestId('import-submit').click()

    await expect
      .poll(async () => (await opsflow.getDocument()).name)
      .toBe('Pasted Copy')
  })

  test('malformed pasted JSON shows a readable error', async ({ page }) => {
    await openImportDialog(page)
    await page.getByRole('tab', { name: 'Paste JSON' }).click()
    await page.getByTestId('import-paste-textarea').fill('{ not valid json')
    await page.getByTestId('import-submit').click()

    await expect(page.getByRole('dialog')).toContainText(/valid JSON|comma|bracket/i)
  })
})
