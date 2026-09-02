import { app, net, protocol } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getResearchConfig } from './settings';
import { defaultSaveFolder } from './research';

export const MEDIA_SCHEME = 'jarvis-media';

/** Must run before app ready, or the scheme is treated as opaque and images will not load. */
export function registerMediaScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: MEDIA_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
    },
  ]);
}

/**
 * Serves saved media to the renderer without opening up `file://`. Only files inside
 * the save folder (or userData) are ever served — anything else is refused, so a bad
 * path in stored state cannot turn into an arbitrary file read.
 */
export function handleMediaProtocol(): void {
  protocol.handle(MEDIA_SCHEME, async (request) => {
    const requested = new URL(request.url).searchParams.get('p');
    if (!requested) return new Response('missing path', { status: 400 });

    const target = path.resolve(requested);
    const config = await getResearchConfig();
    const allowedRoots = [config.saveFolder || defaultSaveFolder(), app.getPath('userData')].map((r) =>
      path.resolve(r),
    );

    const allowed = allowedRoots.some((root) => target === root || target.startsWith(root + path.sep));
    if (!allowed) return new Response('forbidden', { status: 403 });

    return net.fetch(pathToFileURL(target).toString());
  });
}

export function mediaUrl(filePath: string): string {
  return `${MEDIA_SCHEME}://media/?p=${encodeURIComponent(filePath)}`;
}
