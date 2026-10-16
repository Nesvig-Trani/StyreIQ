/**
 * jsdom lacks several browser APIs that Radix UI relies on. Import this file
 * for its side effects at the top of any test that renders Radix primitives.
 */
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub
}

if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

Element.prototype.scrollIntoView = function scrollIntoView(): void {}
Element.prototype.hasPointerCapture = function hasPointerCapture(): boolean {
  return false
}
Element.prototype.setPointerCapture = function setPointerCapture(): void {}
Element.prototype.releasePointerCapture = function releasePointerCapture(): void {}

export {}
