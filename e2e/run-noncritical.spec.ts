/**
 * run-noncritical.spec.ts — a low-severity payload takes the false branch:
 * create-ticket -> post-slack -> Resolution(mitigated), no approval gate.
 */
import { expect, test } from './fixtures'
import { buildPayload, readTimelineRows, runInstant, waitForRunStatus } from './helpers'

test.describe('run-noncritical', () => {
  test('low-severity payload tickets, notifies Slack, and mitigates', async ({ page, opsflow }) => {
    await opsflow.setPayload(buildPayload({ severity: 'low' }))

    await runInstant(page)
    await waitForRunStatus(opsflow, 'completed')

    const run = await opsflow.getRun()
    expect(
      run.events.some((e) => e.kind === 'branch-decided' && e.branch === 'false' && e.result === false),
    ).toBe(true)
    expect(run.events.some((e) => e.kind === 'node-started' && e.nodeId === 'demo-create-ticket')).toBe(
      true,
    )
    expect(run.events.some((e) => e.kind === 'node-started' && e.nodeId === 'demo-post-slack')).toBe(true)

    const finished = run.events.find((e) => e.kind === 'run-finished')
    expect(finished).toBeDefined()
    expect(finished && 'summary' in finished ? finished.summary : undefined).toContain('mitigated')

    const rows = await readTimelineRows(page)
    expect(rows.length).toBeGreaterThan(0)
  })
})
