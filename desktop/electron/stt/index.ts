import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type { TranscribeResponse } from '../../shared/types';
import { getSttConfig } from '../settings';

const execFileAsync = promisify(execFile);
const TRANSCRIBE_TIMEOUT_MS = 120_000;

/**
 * Transcribes with a local whisper.cpp build — nothing leaves the machine, which is
 * the point of a mode that listens all day. Without a configured binary the feature
 * reports that plainly instead of silently doing nothing.
 */
export async function transcribe(wav: Uint8Array): Promise<TranscribeResponse> {
  const config = await getSttConfig();
  if (!config.whisperPath || !config.whisperModelPath) {
    return {
      ok: false,
      error:
        'Dinleme Modu için yerel Whisper gerekiyor. Ayarlar’dan whisper.cpp çalıştırılabilirinin ve model dosyasının yolunu gir.',
    };
  }

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jarvis-stt-'));
  const wavPath = path.join(dir, 'segment.wav');

  try {
    await fs.writeFile(wavPath, wav);
    const { stdout } = await execFileAsync(
      config.whisperPath,
      ['-m', config.whisperModelPath, '-f', wavPath, '-l', 'tr', '-nt', '-np'],
      { timeout: TRANSCRIBE_TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024 },
    );

    // -nt drops timestamps, but whisper.cpp still prints blank lines and [BLANK_AUDIO].
    const text = stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !/^\[.*\]$/.test(line))
      .join(' ')
      .trim();

    return { ok: true, text };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ses yazıya çevrilemedi.';
    return { ok: false, error: message };
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}
