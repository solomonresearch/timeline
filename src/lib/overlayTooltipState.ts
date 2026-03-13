/**
 * Tracks the single currently-open overlay/persona tooltip.
 * When a new tooltip opens it calls closeOthers(), which invokes the
 * previously registered close callback — ensuring only one is ever open.
 */

let currentClose: (() => void) | null = null

/** Register a new open tooltip and immediately close any previously open one. */
export function registerOverlay(closeSelf: () => void) {
  if (currentClose && currentClose !== closeSelf) {
    currentClose()
  }
  currentClose = closeSelf
}

/** Called when a tooltip closes itself (outside click / re-click). */
export function unregisterOverlay(closeSelf: () => void) {
  if (currentClose === closeSelf) {
    currentClose = null
  }
}

export function isAnyOverlayPinned(): boolean {
  return currentClose !== null
}
