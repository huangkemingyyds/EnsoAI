import { IPC_CHANNELS } from '@shared/types';
import { ipcMain } from 'electron';
import { AgentRegistry } from '../services/agent/AgentRegistry';

const registry = new AgentRegistry();

export function registerAgentHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.AGENT_LIST, async () => {
    return registry.list();
  });
}
