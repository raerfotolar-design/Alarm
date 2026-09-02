/**
 * Saved files are served through the app's own `jarvis-media` scheme rather than
 * `file://`, which the page CSP blocks. Mirrors `mediaUrl` in electron/mediaProtocol.ts.
 */
export function mediaUrl(filePath: string): string {
  return `jarvis-media://media/?p=${encodeURIComponent(filePath)}`;
}
