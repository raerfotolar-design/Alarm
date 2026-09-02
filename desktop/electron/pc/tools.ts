import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { shell } from 'electron';
import type { PcToolName } from '../../shared/types';

const execAsync = promisify(exec);

const MAX_READ_BYTES = 200_000;
const MAX_OUTPUT_CHARS = 4_000;
const COMMAND_TIMEOUT_MS = 20_000;

/**
 * Read-only actions run without asking. Anything that writes, deletes or executes
 * needs the user to approve it first — the model can request it, never perform it.
 */
export const SAFE_TOOLS: PcToolName[] = ['list_dir', 'read_file', 'search_files', 'system_info', 'open_path'];
export const CONFIRM_TOOLS: PcToolName[] = ['write_file', 'delete_path', 'move_path', 'run_command'];

export function isKnownTool(name: string): name is PcToolName {
  return [...SAFE_TOOLS, ...CONFIRM_TOOLS].includes(name as PcToolName);
}

export function needsConfirmation(name: PcToolName): boolean {
  return CONFIRM_TOOLS.includes(name);
}

/** `~` is what a model writes; Node will not expand it. */
function resolvePath(input: string): string {
  const trimmed = (input ?? '').trim();
  if (!trimmed) throw new Error('Yol boş olamaz.');
  const expanded = trimmed.startsWith('~') ? path.join(os.homedir(), trimmed.slice(1)) : trimmed;
  return path.resolve(expanded);
}

function clip(text: string): string {
  return text.length > MAX_OUTPUT_CHARS ? `${text.slice(0, MAX_OUTPUT_CHARS)}\n... (kısaltıldı)` : text;
}

function str(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== 'string') throw new Error(`"${key}" alanı eksik.`);
  return value;
}

/** A one-line description shown to the user before they approve a confirm-tier action. */
export function describeAction(name: PcToolName, args: Record<string, unknown>): string {
  switch (name) {
    case 'write_file':
      return `Dosyaya yaz: ${String(args.path ?? '?')}`;
    case 'delete_path':
      return `Sil: ${String(args.path ?? '?')}`;
    case 'move_path':
      return `Taşı: ${String(args.from ?? '?')} → ${String(args.to ?? '?')}`;
    case 'run_command':
      return `Komut çalıştır: ${String(args.command ?? '?')}`;
    case 'open_path':
      return `Aç: ${String(args.path ?? '?')}`;
    case 'list_dir':
      return `Klasörü listele: ${String(args.path ?? '?')}`;
    case 'read_file':
      return `Dosyayı oku: ${String(args.path ?? '?')}`;
    case 'search_files':
      return `Dosya ara: ${String(args.pattern ?? '?')}`;
    case 'system_info':
      return 'Sistem bilgisini oku';
  }
}

export async function runTool(name: PcToolName, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'list_dir': {
      const dir = resolvePath(str(args, 'path'));
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const lines = entries
        .slice(0, 200)
        .map((e) => `${e.isDirectory() ? '[klasör]' : '[dosya] '} ${e.name}`)
        .join('\n');
      return clip(`${dir} içinde ${entries.length} öğe:\n${lines}`);
    }

    case 'read_file': {
      const file = resolvePath(str(args, 'path'));
      const stat = await fs.stat(file);
      if (stat.size > MAX_READ_BYTES) throw new Error(`Dosya çok büyük (${Math.round(stat.size / 1024)} KB).`);
      return clip(await fs.readFile(file, 'utf-8'));
    }

    case 'search_files': {
      const dir = resolvePath(typeof args.path === 'string' && args.path ? args.path : os.homedir());
      const pattern = str(args, 'pattern').toLowerCase();
      const hits: string[] = [];

      // Bounded walk — a deep home directory must not hang the chat.
      const walk = async (current: string, depth: number): Promise<void> => {
        if (depth > 4 || hits.length >= 50) return;
        let entries;
        try {
          entries = await fs.readdir(current, { withFileTypes: true });
        } catch {
          return;
        }
        for (const entry of entries) {
          if (hits.length >= 50) return;
          if (entry.name.startsWith('.')) continue;
          const full = path.join(current, entry.name);
          if (entry.name.toLowerCase().includes(pattern)) hits.push(full);
          if (entry.isDirectory()) await walk(full, depth + 1);
        }
      };
      await walk(dir, 0);
      return clip(hits.length ? hits.join('\n') : 'Eşleşen dosya bulunamadı.');
    }

    case 'system_info': {
      const gb = (bytes: number) => (bytes / 1024 ** 3).toFixed(1);
      return [
        `İşletim sistemi: ${os.type()} ${os.release()} (${os.platform()}/${os.arch()})`,
        `Bilgisayar adı: ${os.hostname()}`,
        `Kullanıcı: ${os.userInfo().username}`,
        `CPU: ${os.cpus()[0]?.model ?? 'bilinmiyor'} × ${os.cpus().length}`,
        `RAM: ${gb(os.totalmem())} GB toplam, ${gb(os.freemem())} GB boş`,
        `Ev dizini: ${os.homedir()}`,
        `Çalışma süresi: ${Math.round(os.uptime() / 3600)} saat`,
      ].join('\n');
    }

    case 'open_path': {
      const target = resolvePath(str(args, 'path'));
      await fs.access(target);
      const error = await shell.openPath(target);
      if (error) throw new Error(error);
      return `${target} açıldı.`;
    }

    case 'write_file': {
      const file = resolvePath(str(args, 'path'));
      const content = str(args, 'content');
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, content, 'utf-8');
      return `${file} yazıldı (${content.length} karakter).`;
    }

    case 'delete_path': {
      const target = resolvePath(str(args, 'path'));
      // The OS trash is recoverable; a hard unlink is not.
      await fs.access(target);
      await shell.trashItem(target);
      return `${target} çöp kutusuna taşındı.`;
    }

    case 'move_path': {
      const from = resolvePath(str(args, 'from'));
      const to = resolvePath(str(args, 'to'));
      await fs.mkdir(path.dirname(to), { recursive: true });
      await fs.rename(from, to);
      return `${from} → ${to} taşındı.`;
    }

    case 'run_command': {
      const command = str(args, 'command');
      const { stdout, stderr } = await execAsync(command, {
        timeout: COMMAND_TIMEOUT_MS,
        maxBuffer: 1024 * 1024,
        cwd: os.homedir(),
      });
      const output = [stdout.trim(), stderr.trim()].filter(Boolean).join('\n');
      return clip(output || 'Komut çalıştı, çıktı yok.');
    }
  }
}
