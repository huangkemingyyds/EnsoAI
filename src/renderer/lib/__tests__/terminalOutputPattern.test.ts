import { describe, expect, it } from 'vitest';
import {
  matchesCompletionOutputPattern,
  normalizeTerminalOutputForPattern,
} from '../terminalOutputPattern';

describe('terminalOutputPattern', () => {
  it('supports existing inline multiline completion patterns', () => {
    expect(matchesCompletionOutputPattern('done\n> ', '(?m)^>\\s*$')).toBe(true);
  });

  it('matches the Codex unicode prompt even after input has been typed', () => {
    const output = '\x1b[36m\u203a\x1b[0m Run /review on my current changes\r\n';

    expect(matchesCompletionOutputPattern(output, '(?m)^(?:>\\s*$|\\u203a(?:\\s.*)?$)')).toBe(true);
  });

  it('does not match a stale prompt when later output is still active', () => {
    const output = '\u203a previous prompt\nWorking on the request';

    expect(matchesCompletionOutputPattern(output, '(?m)^(?:>\\s*$|\\u203a(?:\\s.*)?$)')).toBe(
      false
    );
  });

  it('normalizes ANSI escapes and carriage returns before matching', () => {
    expect(normalizeTerminalOutputForPattern('\x1b[31mtext\x1b[0m\rnext')).toBe('text\nnext');
  });
});
