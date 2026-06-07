import { describe, expect, it } from 'vitest';
import { type CommandResult, SystemMessageFormatter } from '../SystemMessageFormatter';

describe('SystemMessageFormatter', () => {
  it('should format a simple success message', () => {
    const result: CommandResult = {
      type: 'success',
      message: 'Operation completed successfully',
    };

    const output = SystemMessageFormatter.format(result);
    // Success should have green color (32m) or similar
    expect(output).toContain('Operation completed successfully');
    expect(output).toContain('\x1b[');
  });

  it('should format a result with title and sections', () => {
    const result: CommandResult = {
      type: 'info',
      title: 'System Info',
      sections: [
        {
          title: 'Version',
          lines: ['EnsoAI v1.0.0', 'Built with Love'],
        },
      ],
    };

    const output = SystemMessageFormatter.format(result);
    expect(output).toContain('System Info');
    expect(output).toContain('VERSION');
    expect(output).toContain('EnsoAI v1.0.0');
    expect(output).toContain('Built with Love');
  });
});
