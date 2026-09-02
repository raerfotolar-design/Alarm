import type { PcExecuteResponse, PendingPcAction } from '../../shared/types';
import { getAiConfig } from '../settings';
import { isKnownTool, runTool } from './tools';

/**
 * Runs an action the user has just approved in the UI. The approval is the only
 * gate: this refuses anything that arrives while PC control is switched off, or
 * that names a tool the app does not implement.
 */
export async function executeApprovedAction(action: PendingPcAction): Promise<PcExecuteResponse> {
  const config = await getAiConfig();
  if (!config.pcControlEnabled) {
    return { ok: false, error: 'PC kontrolü kapalı. Ayarlar’dan açabilirsin.' };
  }
  if (!isKnownTool(action.tool)) {
    return { ok: false, error: 'Bilinmeyen işlem.' };
  }

  try {
    return { ok: true, output: await runTool(action.tool, action.args ?? {}) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'İşlem başarısız oldu.' };
  }
}
