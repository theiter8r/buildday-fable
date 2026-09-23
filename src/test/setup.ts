import '@testing-library/jest-dom/vitest'

// React Flow relies on browser APIs that jsdom does not implement.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!('ResizeObserver' in globalThis)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).ResizeObserver = ResizeObserverMock
}

if (!('DOMMatrixReadOnly' in globalThis)) {
  class DOMMatrixReadOnlyMock {
    m22 = 1
    constructor(transform?: string) {
      const scale = transform?.match(/scale\(([1-9.]+)\)/)?.[1]
      if (scale) {
        this.m22 = Number(scale)
      }
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).DOMMatrixReadOnly = DOMMatrixReadOnlyMock
}
