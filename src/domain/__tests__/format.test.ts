import { describe, expect, it } from 'vitest'
import { formatClock, formatDuration, formatOffset } from '../format'

describe('formatOffset', () => {
  it('formats sub-minute offsets as +s.s with one decimal', () => {
    expect(formatOffset(0)).toBe('+0.0s')
    expect(formatOffset(1400)).toBe('+1.4s')
    expect(formatOffset(59_900)).toBe('+59.9s')
  })

  it('formats offsets past 60s as +m:ss', () => {
    expect(formatOffset(60_000)).toBe('+1:00')
    expect(formatOffset(125_000)).toBe('+2:05')
  })

  it('handles negative offsets', () => {
    expect(formatOffset(-500)).toBe('-0.5s')
  })
})

describe('formatClock', () => {
  it('renders a base time plus an offset as HH:MM:SS', () => {
    const base = new Date(2026, 0, 1, 19, 42, 0).getTime()
    expect(formatClock(base, 3_000)).toBe('19:42:03')
  })

  it('pads single-digit components', () => {
    const base = new Date(2026, 0, 1, 9, 5, 2).getTime()
    expect(formatClock(base, 0)).toBe('09:05:02')
  })
})

describe('formatDuration', () => {
  it('formats sub-second durations in ms', () => {
    expect(formatDuration(900)).toBe('900ms')
    expect(formatDuration(0)).toBe('0ms')
  })

  it('formats second-scale durations', () => {
    expect(formatDuration(4300)).toBe('4.3s')
    expect(formatDuration(4000)).toBe('4s')
  })

  it('formats minute-scale durations as Nm Ns', () => {
    expect(formatDuration(72_000)).toBe('1m 12s')
  })
})
