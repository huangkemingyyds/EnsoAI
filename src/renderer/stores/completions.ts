import type { ClaudeSlashCompletionItem, ClaudeSlashCompletionsSnapshot } from '@shared/types';
import { create } from 'zustand';

interface CompletionsState {
  items: ClaudeSlashCompletionItem[];
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCompletions: () => Promise<void>;
  setItems: (items: ClaudeSlashCompletionItem[]) => void;
}

/**
 * Store for managing slash command completions.
 * Caches items globally to prevent repeated fetching on component mount.
 */
export const useCompletionsStore = create<CompletionsState>((set, get) => ({
  items: [],
  isInitialized: false,
  isLoading: false,
  error: null,

  fetchCompletions: async () => {
    if (get().isLoading) return;

    set({ isLoading: true });
    try {
      const api = window.electronAPI?.claudeCompletions;
      if (!api) {
        set({ isLoading: false, isInitialized: true });
        return;
      }

      const data: ClaudeSlashCompletionsSnapshot = await api.get();
      set({
        items: data.items ?? [],
        isInitialized: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('[CompletionsStore] Failed to fetch completions:', err);
      set({
        isLoading: false,
        isInitialized: true,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  setItems: (items) => set({ items }),
}));

// Initialize listener for updates from main process
if (typeof window !== 'undefined' && window.electronAPI?.claudeCompletions) {
  window.electronAPI.claudeCompletions.onUpdated((data: ClaudeSlashCompletionsSnapshot) => {
    useCompletionsStore.getState().setItems(data.items ?? []);
  });
}
