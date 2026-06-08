import type { ClaudeSlashCompletionItem } from '@shared/types';
import type { RegisteredCommand } from './commandRegistry';

const SOURCE_PRIORITY: Record<ClaudeSlashCompletionItem['source'], number> = {
  enso: 4,
  user: 3,
  builtin: 2,
  learned: 1,
};

export interface BuildSlashCompletionResultsOptions {
  localCommands: RegisteredCommand[];
  slashItems: ClaudeSlashCompletionItem[];
  query: string;
  limit?: number;
}

function completionKey(item: ClaudeSlashCompletionItem): string {
  return `${item.kind}:${item.label.toLowerCase()}`;
}

function toLocalItems(localCommands: RegisteredCommand[]): ClaudeSlashCompletionItem[] {
  return localCommands.map((cmd) => ({
    label: `/${cmd.id}`,
    insertText: `/${cmd.id} `,
    kind: 'command',
    description: cmd.metadata.description,
    source: 'enso',
  }));
}

function dedupeCompletionItems(items: ClaudeSlashCompletionItem[]): ClaudeSlashCompletionItem[] {
  const deduped = new Map<string, ClaudeSlashCompletionItem>();

  for (const item of items) {
    const key = completionKey(item);
    const existing = deduped.get(key);
    if (!existing || SOURCE_PRIORITY[item.source] > SOURCE_PRIORITY[existing.source]) {
      deduped.set(key, item);
    }
  }

  return Array.from(deduped.values());
}

export function buildSlashCompletionResults({
  localCommands,
  slashItems,
  query,
  limit = 10,
}: BuildSlashCompletionResultsOptions): ClaudeSlashCompletionItem[] {
  const q = query.toLowerCase();
  const allItems = dedupeCompletionItems([...toLocalItems(localCommands), ...slashItems]);

  return allItems
    .filter(
      (item) => item.label.toLowerCase().includes(`/${q}`) || item.label.toLowerCase().includes(q)
    )
    .sort((a, b) => {
      // Sort by source first: EnsoAI local commands first.
      if (a.source === 'enso' && b.source !== 'enso') return -1;
      if (a.source !== 'enso' && b.source === 'enso') return 1;

      // Sort by kind next: commands before skills.
      const kindRank = (x: ClaudeSlashCompletionItem) => (x.kind === 'command' ? 0 : 1);
      const diffKind = kindRank(a) - kindRank(b);
      if (diffKind !== 0) return diffKind;

      // Then prefer prefix matches.
      const aKey = a.label.startsWith('/') ? a.label.slice(1).toLowerCase() : a.label.toLowerCase();
      const bKey = b.label.startsWith('/') ? b.label.slice(1).toLowerCase() : b.label.toLowerCase();
      const aStarts = Number(aKey.startsWith(q));
      const bStarts = Number(bKey.startsWith(q));
      if (aStarts !== bStarts) return bStarts - aStarts;
      return aKey.localeCompare(bKey);
    })
    .slice(0, limit);
}
