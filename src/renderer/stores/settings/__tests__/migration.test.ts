import { describe, expect, it } from 'vitest';
import { migrateSettings } from '../migration';
import type { SettingsState } from '../types';

function createMigrationContext(): SettingsState {
  return {
    agentDetectionStatus: {},
    agentInput: {
      enabled: false,
      autoPopupMode: 'manual',
    },
    agentSettings: {},
    claudeCodeIntegration: {
      stopHookEnabled: true,
      enhancedInputAutoPopup: 'manual',
      statusLineFields: {},
    },
  } as SettingsState;
}

describe('migrateSettings', () => {
  it('preserves hideWhileRunning Agent Input mode when Claude Stop Hook is disabled', () => {
    const migrated = migrateSettings(
      {
        claudeCodeIntegration: {
          stopHookEnabled: false,
          enhancedInputEnabled: true,
          enhancedInputAutoPopup: 'hideWhileRunning',
          statusLineFields: {},
        },
      } as Partial<SettingsState>,
      createMigrationContext()
    );

    expect(migrated.agentInput).toMatchObject({
      enabled: true,
      autoPopupMode: 'hideWhileRunning',
    });
    expect(migrated.claudeCodeIntegration.enhancedInputAutoPopup).toBe('hideWhileRunning');
    expect(migrated.claudeCodeIntegration.stopHookEnabled).toBe(false);
  });
});
