import type { ClaudeSlashCompletionItem } from '@shared/types';
import { describe, expect, it, vi } from 'vitest';
import type { RegisteredCommand } from '../commandRegistry';
import { buildSlashCompletionResults } from '../slashCompletions';

function localCommand(id: string, description: string): RegisteredCommand {
  return {
    id,
    handler: vi.fn(),
    metadata: { description },
  };
}

function slashCommand(
  label: string,
  source: ClaudeSlashCompletionItem['source']
): ClaudeSlashCompletionItem {
  return {
    kind: 'command',
    label,
    insertText: `${label} `,
    description: `${source} command`,
    source,
  };
}

describe('buildSlashCompletionResults', () => {
  it('dedupes local and agent slash commands by render key and keeps the local command', () => {
    const results = buildSlashCompletionResults({
      localCommands: [localCommand('help', 'local help')],
      slashItems: [slashCommand('/help', 'builtin')],
      query: 'help',
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      kind: 'command',
      label: '/help',
      source: 'enso',
      description: 'local help',
    });
  });

  it('keeps one item per case-insensitive kind and label key', () => {
    const results = buildSlashCompletionResults({
      localCommands: [],
      slashItems: [slashCommand('/HELP', 'learned'), slashCommand('/help', 'builtin')],
      query: 'help',
    });

    expect(results.map((item) => `${item.kind}:${item.label.toLowerCase()}`)).toEqual([
      'command:/help',
    ]);
    expect(results[0].source).toBe('builtin');
  });
});
