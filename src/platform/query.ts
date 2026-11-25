// Thin platform layer: the only place that touches window/location directly.
export function getQueryParam(name: string): string | null {
  try {
    return new URLSearchParams(globalThis.location?.search ?? '').get(name);
  } catch {
    return null;
  }
}
