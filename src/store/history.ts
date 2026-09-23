/**
 * `HistoryStack` — the undo/redo mechanics behind `HistorySlice`
 * (ARCHITECTURE.md §7). Pure and framework-free: no React, no Zustand,
 * unit-testable in isolation (`__tests__/history.test.ts`).
 *
 * The stack does not know how to apply/invert a `Command` — that is the
 * caller's job (`commands.ts` + `workflowStore.ts`). `push` just decides
 * whether a new item should coalesce with the top of `past` (same
 * `coalesceKey`, within `CONFIG_COALESCE_MS` of the previous push) or
 * become a new entry, and `undo`/`redo` hand the caller back the exact item
 * to apply/re-apply.
 *
 * DECISION: the task brief describes `HistoryStack` as holding
 * "past/future Command arrays". `commands.ts` documents a different but
 * behaviourally-equivalent choice — no `invertCommand`, undo restores a
 * captured `before` document snapshot instead. To honour both without
 * contradiction, `HistoryStack<T>` is generic over the stored item and
 * defaults to `T = Command` (so it *is* a plain Command stack when used
 * that way, exactly as specified, and is tested that way below).
 * `workflowStore.ts` instantiates it with a richer
 * `{ command, before, after }` item so undo/redo can restore whole-document
 * snapshots per `commands.ts`'s documented decision, while still reporting
 * `command` for `affectedNodeIds`/selection purposes.
 */
import { CONFIG_COALESCE_MS, HISTORY_CAP } from '@/domain/constants'
import type { Command } from './types'

/** A function that derives the coalescing key for an item, or `null` if it never coalesces. */
export type CoalesceKeyFn<T> = (item: T) => string | null

interface Entry<T> {
  item: T
  /** Wall-clock ms this entry was last pushed/coalesced at, for the coalescing window. */
  at: number
  /** The coalescing key this entry was pushed with, or `null`. */
  key: string | null
}

/**
 * Past/future stacks with a capped depth and time-windowed coalescing.
 * `now` is injectable for deterministic tests. `T` defaults to `Command`.
 */
export class HistoryStack<T = Command> {
  private past: Entry<T>[] = []
  private future: Entry<T>[] = []
  private readonly cap: number
  private readonly coalesceMs: number
  private readonly now: () => number

  constructor(options?: { cap?: number; coalesceMs?: number; now?: () => number }) {
    this.cap = options?.cap ?? HISTORY_CAP
    this.coalesceMs = options?.coalesceMs ?? CONFIG_COALESCE_MS
    this.now = options?.now ?? (() => Date.now())
  }

  get canUndo(): boolean {
    return this.past.length > 0
  }

  get canRedo(): boolean {
    return this.future.length > 0
  }

  /** Number of entries currently on the undo stack. Exposed for tests/inspection only. */
  get pastLength(): number {
    return this.past.length
  }

  /** Number of entries currently on the redo stack. Exposed for tests/inspection only. */
  get futureLength(): number {
    return this.future.length
  }

  /**
   * Pushes `item`, clearing the redo stack. When `key` is non-null and
   * matches the key of the top-of-stack entry AND that entry was pushed
   * within the coalescing window, the top entry is REPLACED instead of a
   * new one being added (so a burst of typing becomes one undo step).
   *
   * `merge(previousItem, item)`, when given, computes the replacement item
   * on a coalescing hit (e.g. so `workflowStore` can keep the *original*
   * `before` snapshot while adopting the newest `after`). Without `merge`,
   * `item` itself replaces the previous one outright.
   */
  push(item: T, key: string | null = null, merge?: (previous: T, next: T) => T): void {
    this.future = []
    const now = this.now()
    const top = this.past.at(-1)
    if (key !== null && top !== undefined && top.key === key && now - top.at <= this.coalesceMs) {
      // Slide the window forward, so a continuous burst of same-key pushes
      // (e.g. typing into one field) stays one undo step for as long as
      // consecutive pushes stay within `coalesceMs` of each other — it only
      // closes on a gap, a different key, or an unrelated command
      // (ARCHITECTURE.md §7).
      const merged = merge ? merge(top.item, item) : item
      this.past[this.past.length - 1] = { item: merged, at: now, key }
      return
    }
    this.past.push({ item, at: now, key })
    if (this.past.length > this.cap) {
      this.past.shift()
    }
  }

  /** Returns the item to undo and moves it to the redo stack, or `undefined` if empty. */
  undo(): T | undefined {
    const entry = this.past.pop()
    if (!entry) return undefined
    this.future.push(entry)
    return entry.item
  }

  /** Returns the item to redo and moves it back to the undo stack, or `undefined` if empty. */
  redo(): T | undefined {
    const entry = this.future.pop()
    if (!entry) return undefined
    this.past.push(entry)
    return entry.item
  }

  /** Empties both stacks. */
  clear(): void {
    this.past = []
    this.future = []
  }
}
