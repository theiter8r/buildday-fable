import { useEffect } from 'react'

export interface HotkeyBinding {
  /** e.g. `'mod+enter'`, `'mod+s'`, `'?'`, `'escape'`. `mod` = Cmd on macOS, Ctrl elsewhere. */
  combo: string
  handler: (e: KeyboardEvent) => void
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

function matchesCombo(e: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split('+')
  const key = parts[parts.length - 1]
  const needsMod = parts.includes('mod')
  const needsShift = parts.includes('shift')
  const eventKey = e.key.toLowerCase()
  const keyMatches = eventKey === key || (key === 'enter' && eventKey === 'enter')
  const modOk = needsMod ? e.metaKey || e.ctrlKey : !e.metaKey && !e.ctrlKey
  const shiftOk = needsShift ? e.shiftKey : !e.shiftKey
  return keyMatches && modOk && shiftOk
}

/**
 * App-shell-level keyboard shortcuts (ARCHITECTURE.md §2). Ignored while
 * focus is in an input/textarea/select/contenteditable, unless the combo is
 * exactly `'escape'` — matches `useCanvasShortcuts`' guard rule so the two
 * hooks compose without double-handling the same keypress.
 */
export function useHotkeys(bindings: readonly HotkeyBinding[]): void {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const editable = isEditableTarget(e.target)
      for (const binding of bindings) {
        if (editable && binding.combo.toLowerCase() !== 'escape') continue
        if (matchesCombo(e, binding.combo)) {
          e.preventDefault()
          binding.handler(e)
          return
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [bindings])
}
