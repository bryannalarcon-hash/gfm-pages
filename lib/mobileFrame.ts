/**
 * CB-104: frame-detection helper.
 *
 * isInMobileFrame() returns true ONLY when the current JS context is running inside
 * the CB-96 mobile-preview iframe (window.self !== window.top). It is false on the
 * parent page and during SSR (where `window` is undefined).
 *
 * Usage:
 *   const inFrame = isInMobileFrame();
 *
 * SSR-safe: the check is guarded by typeof window — always returns false on the server.
 */
export function isInMobileFrame(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin access to window.top throws — treat as NOT in our frame.
    return false;
  }
}
