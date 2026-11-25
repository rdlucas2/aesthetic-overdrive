// Platform layer: tells the host page the game booted so the "loading..." / error overlay is hidden.
export function markBootOk(): void {
  try {
    (globalThis as { __bootOk?: () => void }).__bootOk?.();
  } catch { /* ignore */ }
}
