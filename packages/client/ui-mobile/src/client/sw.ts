/**
 * Service worker registration for push delivery and old-cache cleanup.
 *
 * Best-effort by design: registration happens after `load` so it never blocks
 * first paint, and any failure (no secure context, unsupported browser, a
 * backend that cannot serve /sw.js) is swallowed — the UI has no dependency on
 * push registration. Page and plugin requests remain under the current Host's
 * revision and cache-control policy.
 */
export function registerServiceWorker(): void {
  if (typeof navigator === 'undefined') return
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration is best-effort: nothing in the UI depends on it.
    })
  })
}
