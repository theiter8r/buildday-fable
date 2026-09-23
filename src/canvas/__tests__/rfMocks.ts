/**
 * Extra jsdom polyfills React Flow needs beyond what `src/test/setup.ts`
 * already provides (per this lane's brief: "if setup.ts lacks them, add a
 * NEW file ... do not edit setup.ts"). `setup.ts` covers `ResizeObserver`
 * and `DOMMatrixReadOnly`; this file adds a fixed-size
 * `getBoundingClientRect` and a `matchMedia` stub, both required for
 * `<ReactFlow>` to mount and measure nodes in jsdom (spike doc §B.3).
 *
 * Import this once, before rendering, in any canvas test file:
 * `import './rfMocks'`.
 */

if (!HTMLElement.prototype.getBoundingClientRect || isDefaultZeroRect()) {
  HTMLElement.prototype.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 1440,
      bottom: 900,
      width: 1440,
      height: 900,
      toJSON: () => {},
    }) as DOMRect
}

function isDefaultZeroRect(): boolean {
  try {
    const probe = document.createElement('div')
    const rect = probe.getBoundingClientRect()
    return rect.width === 0 && rect.height === 0
  } catch {
    return true
  }
}

if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}
