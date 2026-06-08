import { describe, expect, it } from 'vitest';
import { defaultAgentInputSettings, defaultClaudeCodeIntegrationSettings } from '../defaults';

describe('settings defaults', () => {
  it('defaults new installs to manual Agent Input visibility', () => {
    expect(defaultAgentInputSettings.autoPopupMode).toBe('manual');
    expect(defaultClaudeCodeIntegrationSettings.enhancedInputAutoPopup).toBe('manual');
  });
});
