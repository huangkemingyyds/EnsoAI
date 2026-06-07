import type { ClaudeSlashCompletionItem } from '@shared/types';
import type { FileSearchResult } from '@shared/types/search';
import { motion } from 'framer-motion';
import { Paperclip, Send, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogPopup } from '@/components/ui/dialog';
import { toastManager } from '@/components/ui/toast';
import { useI18n } from '@/i18n';
import { commandRegistry } from '@/lib/commandRegistry';
import { isFocusLocked, lockFocus, unlockFocus } from '@/lib/focusLock';
import { toLocalFileUrl } from '@/lib/localFileUrl';
import { cn } from '@/lib/utils';
import { useCompletionsStore } from '@/stores/completions';

function getFileName(filePath: string): string {
  const sep = filePath.includes('\\') ? '\\' : '/';
  return filePath.slice(filePath.lastIndexOf(sep) + 1);
}

interface EnhancedInputProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (content: string, imagePaths: string[]) => void;
  sessionId?: string;
  /** Current content for the textarea (store-controlled) */
  content: string;
  /** Current image paths (store-controlled) */
  imagePaths: string[];
  /** Callback when content changes (store-controlled) */
  onContentChange: (content: string) => void;
  /** Callback when image paths change (store-controlled) */
  onImagesChange: (imagePaths: string[]) => void;
  /** Keep panel open after sending (for 'always' mode) */
  keepOpenAfterSend?: boolean;
  /** Whether the parent panel is active (used to trigger focus on tab switch) */
  isActive?: boolean;
  /** Working directory for file mention search */
  cwd?: string;
  /** Whether Claude slash command completion is available for this Agent Session */
  slashCommandCompletionEnabled?: boolean;
  /** Whether the agent is currently running (outputting) */
  isAgentRunning?: boolean;
}

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MIN_H = 32;
const LARGE_TEXT_THRESHOLD = 5000; // 5000 chars

export function EnhancedInput({
  open,
  onOpenChange,
  onSend,
  sessionId,
  content,
  imagePaths,
  onContentChange,
  onImagesChange,
  keepOpenAfterSend = false,
  isActive = false,
  cwd,
  slashCommandCompletionEnabled = false,
  isAgentRunning = false,
}: EnhancedInputProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [manualMinH, setManualMinH] = useState<number | null>(null);
  const [previewPath, setPreviewPath] = useState<string | null>(null);

  // IME composition state
  const composingRef = useRef(false);

  // @ mention file search state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<FileSearchResult[]>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionListRef = useRef<HTMLDivElement>(null);

  // Slash command completions (indexed in main process from ~/.claude/commands and ~/.claude/skills)
  const slashItems = useCompletionsStore((state) => state.items);
  const fetchCompletions = useCompletionsStore((state) => state.fetchCompletions);
  const isCompletionsInitialized = useCompletionsStore((state) => state.isInitialized);

  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [slashResults, setSlashResults] = useState<ClaudeSlashCompletionItem[]>([]);
  const [slashIndex, setSlashIndex] = useState(0);
  const slashListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slashCommandCompletionEnabled && !isCompletionsInitialized) {
      fetchCompletions();
    }
  }, [slashCommandCompletionEnabled, isCompletionsInitialized, fetchCompletions]);

  // Extract mention query from text before cursor
  const extractMentionQuery = useCallback((text: string, cursorPos: number): string | null => {
    for (let i = cursorPos - 1; i >= 0; i--) {
      const ch = text[i];
      if (ch === '@') return text.slice(i + 1, cursorPos);
      if (ch === ' ' || ch === '\n' || ch === '\r') return null;
    }
    return null;
  }, []);

  const findSlashTokenStart = useCallback((text: string, cursorPos: number): number | null => {
    for (let i = cursorPos - 1; i >= 0; i--) {
      const ch = text[i];
      if (ch === '/') {
        const prev = i > 0 ? text[i - 1] : ' ';
        const isTokenStart = i === 0 || prev === ' ' || prev === '\n' || prev === '\r';
        if (!isTokenStart) return null;
        return i;
      }
      if (ch === ' ' || ch === '\n' || ch === '\r') return null;
    }
    return null;
  }, []);

  const extractSlashQuery = useCallback(
    (text: string, cursorPos: number): string | null => {
      const slashPos = findSlashTokenStart(text, cursorPos);
      if (slashPos === null) return null;
      return text.slice(slashPos + 1, cursorPos);
    },
    [findSlashTokenStart]
  );

  // Detect @ mention on content change
  const handleContentChange = useCallback(
    (value: string) => {
      onContentChange(value);
      // Skip detection during IME composition
      if (composingRef.current) return;
      const ta = textareaRef.current;
      if (!ta) return;
      // Use setTimeout to read selectionStart after React updates the value
      setTimeout(() => {
        const cursor = ta.selectionStart;
        const nextMentionQuery = cwd ? extractMentionQuery(value, cursor) : null;
        setMentionQuery(nextMentionQuery);
        setMentionIndex(0);
        const nextSlashQuery = nextMentionQuery === null ? extractSlashQuery(value, cursor) : null;
        setSlashQuery(nextSlashQuery);
        setSlashIndex(0);
      }, 0);
    },
    [cwd, onContentChange, extractMentionQuery, extractSlashQuery]
  );

  // Debounced file search
  useEffect(() => {
    if (mentionQuery === null || !cwd) {
      setMentionResults([]);
      return;
    }
    const timer = setTimeout(() => {
      window.electronAPI.search
        .files({ rootPath: cwd, query: mentionQuery, maxResults: 10 })
        .then(setMentionResults)
        .catch(() => setMentionResults([]));
    }, 150);
    return () => clearTimeout(timer);
  }, [mentionQuery, cwd]);

  useEffect(() => {
    if (slashQuery === null) {
      setSlashResults([]);
      return;
    }

    const q = slashQuery.toLowerCase();

    // Map local commands to completion items
    const localItems: ClaudeSlashCompletionItem[] = commandRegistry.getAllCommands().map((cmd) => ({
      label: `/${cmd.id}`,
      insertText: `/${cmd.id} `,
      kind: 'command',
      description: cmd.metadata.description,
      source: 'enso', // Mark as local
    }));

    const allItems = [...localItems, ...slashItems];

    const results = allItems
      .filter(
        (item) => item.label.toLowerCase().includes(`/${q}`) || item.label.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        // Sort by source first: enso commands first
        if (a.source === 'enso' && b.source !== 'enso') return -1;
        if (a.source !== 'enso' && b.source === 'enso') return 1;

        // Sort by kind next: commands before skills
        const kindRank = (x: ClaudeSlashCompletionItem) => (x.kind === 'command' ? 0 : 1);
        const diffKind = kindRank(a) - kindRank(b);
        if (diffKind !== 0) return diffKind;

        // Then prefer prefix matches
        const aKey = a.label.startsWith('/')
          ? a.label.slice(1).toLowerCase()
          : a.label.toLowerCase();
        const bKey = b.label.startsWith('/')
          ? b.label.slice(1).toLowerCase()
          : b.label.toLowerCase();
        const aStarts = Number(aKey.startsWith(q));
        const bStarts = Number(bKey.startsWith(q));
        if (aStarts !== bStarts) return bStarts - aStarts;
        return aKey.localeCompare(bKey);
      })
      .slice(0, 10);

    setSlashResults(results);
  }, [slashQuery, slashItems]);

  // Insert selected mention into textarea
  const insertMention = useCallback(
    (item: FileSearchResult) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const cursor = ta.selectionStart;
      const text = content;
      // Find the @ position before cursor
      let atPos = -1;
      for (let i = cursor - 1; i >= 0; i--) {
        if (text[i] === '@') {
          atPos = i;
          break;
        }
        if (text[i] === ' ' || text[i] === '\n') break;
      }
      if (atPos === -1) return;
      const replacement = `@${item.relativePath} `;
      const newContent = text.slice(0, atPos) + replacement + text.slice(cursor);
      onContentChange(newContent);
      setMentionQuery(null);
      setMentionResults([]);
      // Restore cursor after React re-render
      const newCursor = atPos + replacement.length;
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(newCursor, newCursor);
      }, 0);
    },
    [content, onContentChange]
  );

  const executeSlash = useCallback(
    (item: ClaudeSlashCompletionItem) => {
      const ta = textareaRef.current;
      const cursor = ta ? ta.selectionStart : content.length;
      const text = content;

      const slashPos = findSlashTokenStart(text, cursor);
      if (slashPos === null) return;
      const replacement = item.label;
      const newContent = (text.slice(0, slashPos) + replacement + text.slice(cursor)).trim();
      if (!newContent) return;

      // Close the popup first to avoid flicker while sending/closing.
      setSlashQuery(null);
      setSlashResults([]);

      // Auto-learn: executing a slash item should be counted in the learned cache.
      const token = newContent.match(/^\/\S+/)?.[0];
      if (
        slashCommandCompletionEnabled &&
        token &&
        !token.slice(1).includes('/') &&
        !token.includes('\\')
      ) {
        window.electronAPI?.claudeCompletions?.learn(token).catch(() => {
          // Ignore learning failures; they should not block sending.
        });
      }

      onSend(newContent, imagePaths);
      if (!keepOpenAfterSend) {
        onOpenChange(false);
      }
    },
    [
      content,
      imagePaths,
      keepOpenAfterSend,
      onOpenChange,
      onSend,
      findSlashTokenStart,
      slashCommandCompletionEnabled,
    ]
  );

  // Scroll highlighted mention into view
  useEffect(() => {
    const list = mentionListRef.current;
    if (!list) return;
    const item = list.children[mentionIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [mentionIndex]);

  useEffect(() => {
    const list = slashListRef.current;
    if (!list) return;
    const item = list.children[slashIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [slashIndex]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const textarea = textareaRef.current;
    if (!textarea) return;
    const startY = e.clientY;
    const startH = textarea.offsetHeight;

    const onMove = (ev: MouseEvent) => {
      const delta = startY - ev.clientY;
      setManualMinH(Math.max(DEFAULT_MIN_H, startH + delta));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  const removeImagePath = useCallback(
    (index: number) => {
      onImagesChange(imagePaths.filter((_, i) => i !== index));
    },
    [imagePaths, onImagesChange]
  );

  // Auto-resize textarea, respecting manual min height from drag
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const minH = manualMinH ?? DEFAULT_MIN_H;
    if (content === '') {
      ta.style.height = `${minH}px`;
      return;
    }
    ta.style.height = 'auto';
    const scrollH = ta.scrollHeight;
    ta.style.height = `${Math.max(scrollH, minH)}px`;
  }, [content, manualMinH]);

  // When the session is active and the enhanced input is open, enable focus lock.
  useEffect(() => {
    if (!sessionId || !open || !isActive) return;

    lockFocus(sessionId);
    return () => unlockFocus(sessionId);
  }, [sessionId, open, isActive]);

  // Focus textarea when opened, session changes, or panel becomes active
  useEffect(() => {
    if (open && isActive && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open, isActive]);

  // Focus trap: only refocus textarea when focus leaves this panel.
  // This avoids breaking keyboard navigation to Upload/Close/Send buttons.
  const handleBlur = useCallback(() => {
    // Wait two frames to allow overlays to mount and focus to settle, avoiding focus steal while opening popups.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!open || !sessionId || !isFocusLocked(sessionId)) return;

        const container = containerRef.current;
        const textarea = textareaRef.current;
        if (!container || !textarea) return;

        const active = document.activeElement;
        if (active && container.contains(active)) {
          return;
        }

        const hasBlockingOverlay = Boolean(
          document.querySelector(
            '[data-slot="dialog-popup"], [data-slot="alert-dialog-popup"], [data-quick-terminal="true"]'
          )
        );
        if (hasBlockingOverlay) {
          return;
        }

        textarea.focus();
      });
    });
  }, [open, sessionId]);

  // Draft is now preserved in store - no reset on close

  const handleSend = useCallback(async () => {
    if (isAgentRunning) {
      toastManager.add({
        type: 'warning',
        title: t('Agent is running'),
        description: t(
          'Please wait for the current task to complete before sending new instructions'
        ),
      });
      return;
    }

    const trimmed = content.trim();
    if (!trimmed && imagePaths.length === 0) return;
    try {
      // Auto-learn: if the message starts with `/xxx`, record it for future completion suggestions.
      if (slashCommandCompletionEnabled && trimmed.startsWith('/')) {
        const token = trimmed.match(/^\/\S+/)?.[0];
        // Avoid learning path-like tokens such as `/usr/local/bin`.
        if (token && !token.slice(1).includes('/') && !token.includes('\\')) {
          window.electronAPI?.claudeCompletions?.learn(token).catch(() => {
            // Ignore learning failures; they should not block sending.
          });
        }
      }

      onSend(trimmed, imagePaths);
      // Only close panel if not in 'always open' mode
      if (!keepOpenAfterSend) {
        onOpenChange(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toastManager.add({
        type: 'error',
        title: t('Failed to send message'),
        description: message,
      });
    }
  }, [
    content,
    imagePaths,
    onSend,
    keepOpenAfterSend,
    onOpenChange,
    t,
    slashCommandCompletionEnabled,
    isAgentRunning,
  ]);
  const getImageExtension = useCallback((file: File): string => {
    const mime = file.type.toLowerCase();
    const mimeMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/bmp': 'bmp',
      'image/svg+xml': 'svg',
    };
    const mapped = mimeMap[mime];
    if (mapped) return mapped;

    const name = file.name;
    const lastDot = name.lastIndexOf('.');
    if (lastDot > 0 && lastDot < name.length - 1) {
      const ext = name.slice(lastDot + 1).toLowerCase();
      if (/^[a-z0-9]{1,10}$/.test(ext)) {
        return ext;
      }
    }

    return 'png';
  }, []);

  const handlePanelKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // If mention popup is open, let handleKeyDown close it first
      if (mentionQuery !== null || slashQuery !== null) return;

      // Keep ESC behavior identical to clicking the close (X) button.
      e.preventDefault();
      e.stopPropagation();
      onOpenChange(false);
    },
    [onOpenChange, mentionQuery, slashQuery]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Ignore key events during IME composition
      if (e.nativeEvent.isComposing || e.key === 'Process') return;
      // When mention popup is active, intercept navigation keys
      if (mentionQuery !== null && mentionResults.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setMentionIndex((prev) => (prev + 1) % mentionResults.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setMentionIndex((prev) => (prev - 1 + mentionResults.length) % mentionResults.length);
          return;
        }
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          insertMention(mentionResults[mentionIndex]);
          return;
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          insertMention(mentionResults[mentionIndex]);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setMentionQuery(null);
          return;
        }
      }
      // When slash popup is active, intercept navigation keys
      if (slashQuery !== null && slashResults.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSlashIndex((prev) => (prev + 1) % slashResults.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSlashIndex((prev) => (prev - 1 + slashResults.length) % slashResults.length);
          return;
        }
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          executeSlash(slashResults[slashIndex]);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setSlashQuery(null);
          return;
        }
      }
      // Send with Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      // Esc close is handled at the panel level so it works for buttons too.
    },
    [
      handleSend,
      mentionQuery,
      mentionResults,
      mentionIndex,
      insertMention,
      slashQuery,
      slashResults,
      slashIndex,
      executeSlash,
    ]
  );

  const saveImageToTemp = useCallback(
    async (file: File): Promise<string | null> => {
      try {
        // Check file size
        if (file.size > MAX_IMAGE_SIZE) {
          toastManager.add({
            type: 'warning',
            title: t('Image too large'),
            description: t('Max image size is {{size}}MB', { size: 10 }),
          });
          return null;
        }

        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Generate unique filename
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = getImageExtension(file);
        const filename = `ensoai-input-${timestamp}-${random}.${extension}`;

        // If we have a workspace directory, save to .ensoai-input within it.
        // This solves permission/access issues for CLI agents like Gemini.
        const targetDir = cwd ? `${cwd}/.ensoai-input` : undefined;

        // Save to target directory via electron API
        const result = await window.electronAPI.file.saveToTemp(filename, buffer, targetDir);

        if (result.success && result.path) {
          return result.path;
        }

        toastManager.add({
          type: 'error',
          title: t('Failed to save image'),
          description: result.error || t('Unknown error'),
        });

        return null;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        toastManager.add({
          type: 'error',
          title: t('Failed to save image'),
          description: message,
        });
        return null;
      }
    },
    [t, getImageExtension, cwd]
  );

  const addImageFiles = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length === 0) return;

      // Check limit
      if (imagePaths.length + imageFiles.length > MAX_IMAGES) {
        toastManager.add({
          type: 'warning',
          title: t('Too many images'),
          description: t('Max images is {{count}}', { count: MAX_IMAGES }),
        });
        return;
      }

      // Save to temp (keep order)
      const nextPaths = [...imagePaths];
      const results = await Promise.all(imageFiles.map((file) => saveImageToTemp(file)));
      for (const path of results) {
        if (path) {
          nextPaths.push(path);
        }
      }

      if (nextPaths.length !== imagePaths.length) {
        onImagesChange(nextPaths);
      }
    },
    [imagePaths, saveImageToTemp, t, onImagesChange]
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      let textContent = '';

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        } else if (item.type === 'text/plain') {
          // We'll get text content via e.clipboardData.getData below
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        await addImageFiles(imageFiles);
        return;
      }

      // Handle large text paste
      textContent = e.clipboardData.getData('text/plain');
      if (textContent.length > LARGE_TEXT_THRESHOLD && cwd) {
        e.preventDefault();

        const timestamp = Date.now();
        const filename = `prompt-${timestamp}.md`;
        const buffer = new TextEncoder().encode(textContent);
        const targetDir = `${cwd}/.ensoai-input`;

        toastManager.add({
          type: 'info',
          title: t('Large text detected'),
          description: t('Pasting {{count}} characters. Saving to file to prevent terminal lag.', {
            count: textContent.length,
          }),
        });

        const result = await window.electronAPI.file.saveToTemp(filename, buffer, targetDir);

        if (result.success && result.path) {
          const relativePath = `.ensoai-input/${filename}`;
          const instruction = `Please read the content of ${relativePath} and then [your instructions here]`;
          onContentChange(content + (content ? '\n' : '') + instruction);

          // Focus and select the placeholder for user to easily replace
          setTimeout(() => {
            const ta = textareaRef.current;
            if (ta) {
              const start = ta.value.indexOf('[your instructions here]');
              if (start !== -1) {
                ta.setSelectionRange(start, start + '[your instructions here]'.length);
                ta.focus();
              }
            }
          }, 0);
        } else {
          toastManager.add({
            type: 'error',
            title: t('Failed to save large text'),
            description: result.error || t('Unknown error'),
          });
        }
      }
    },
    [addImageFiles, cwd, onContentChange, content, t]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);

      await addImageFiles(files);
    },
    [addImageFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      await addImageFiles(Array.from(files));

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addImageFiles]
  );

  const handleSelectFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={cn('relative', !open && 'pointer-events-none')}>
      {/* @ mention file search popup — outside overflow-hidden container */}
      {open && mentionQuery !== null && mentionResults.length > 0 && (
        <div className="absolute bottom-full left-3 mb-1 w-72 rounded-lg border bg-popover shadow-lg z-10 overflow-hidden">
          <div ref={mentionListRef} className="max-h-[240px] overflow-y-auto py-1">
            {mentionResults.map((item, i) => {
              const lastSep = item.relativePath.lastIndexOf('/');
              const dirPart = lastSep > 0 ? item.relativePath.slice(0, lastSep) : '';
              const fileName =
                lastSep > 0 ? item.relativePath.slice(lastSep + 1) : item.relativePath;
              return (
                <button
                  type="button"
                  key={item.path}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(item);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-sm truncate transition-colors',
                    i === mentionIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-accent/50'
                  )}
                >
                  <span>{fileName}</span>
                  {dirPart && (
                    <span className="text-muted-foreground ml-1.5 text-xs">{dirPart}</span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Keyboard shortcut hints */}
          <div className="flex items-center gap-3 border-t px-3 py-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px] leading-none">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px] leading-none">
                Enter
              </kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px] leading-none">
                Esc
              </kbd>
              Close
            </span>
          </div>
        </div>
      )}

      {/* / slash command popup — outside overflow-hidden container */}
      {open && slashQuery !== null && slashResults.length > 0 && (
        <div className="absolute bottom-full left-3 mb-1 w-80 rounded-lg border bg-popover shadow-lg z-10 overflow-hidden">
          <div ref={slashListRef} className="max-h-[240px] overflow-y-auto py-1">
            {slashResults.map((item, i) => (
              <button
                type="button"
                key={`${item.kind}:${item.label}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  executeSlash(item);
                }}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-sm transition-colors',
                  i === slashIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-accent/50'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono truncate">{item.label}</span>
                    {item.source === 'enso' && (
                      <span className="text-[10px] px-1 rounded bg-primary/20 text-primary shrink-0">
                        EnsoAI
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs shrink-0">
                    {item.kind === 'command' ? '命令' : '技能'}
                  </span>
                </div>
                {item.description && (
                  <div className="text-muted-foreground text-xs truncate mt-0.5">
                    {item.description}
                  </div>
                )}
              </button>
            ))}
          </div>
          {/* Keyboard shortcut hints */}
          <div className="flex items-center gap-3 border-t px-3 py-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px] leading-none">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px] leading-none">
                Enter
              </kbd>
              Execute
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px] leading-none">
                Esc
              </kbd>
              Close
            </span>
          </div>
        </div>
      )}

      <motion.div
        ref={containerRef}
        initial={false}
        animate={{
          height: open ? 'auto' : 0,
          opacity: open ? 1 : 0,
        }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="pointer-events-auto bg-background overflow-hidden border-t"
        onKeyDown={handlePanelKeyDown}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="relative mx-3 my-2 rounded-lg border border-border bg-muted/30">
          {/* Close button (top-right) */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors z-10"
            aria-label={t('Close')}
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Resize handle */}
          <div
            className="h-2 cursor-ns-resize group flex items-center justify-center"
            onMouseDown={handleResizeStart}
          >
            <div className="w-8 h-0.5 rounded-full bg-border group-hover:bg-muted-foreground transition-colors" />
          </div>

          {/* Image preview list - shown above textarea when images exist */}
          {imagePaths.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 pb-2 pt-1 border-b border-border/50">
              {imagePaths.map((path, index) => (
                <div
                  key={path}
                  className="group relative h-16 w-16 rounded-md border border-border bg-muted/30 overflow-hidden shadow-sm"
                >
                  {/* biome-ignore lint/a11y/useKeyWithClickEvents: zoom is secondary interaction */}
                  <img
                    src={toLocalFileUrl(path)}
                    alt={getFileName(path)}
                    onClick={() => setPreviewPath(path)}
                    className="h-full w-full object-cover cursor-zoom-in transition-transform group-hover:scale-105"
                  />
                  <button
                    type="button"
                    onClick={() => removeImagePath(index)}
                    className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-background/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 bg-black/40 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="truncate text-[8px] text-white text-center">
                      {getFileName(path)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Textarea */}
          <div onDrop={handleDrop} onDragOver={handleDragOver} className="flex">
            <textarea
              ref={textareaRef}
              data-enhanced-input-session-id={sessionId}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => {
                composingRef.current = true;
              }}
              onCompositionEnd={() => {
                composingRef.current = false;
              }}
              onPaste={handlePaste}
              onBlur={handleBlur}
              placeholder={t('Type your message... (Shift+Enter for newline)')}
              className="w-full min-h-[32px] px-3 resize-none bg-transparent text-sm leading-normal focus:outline-none placeholder:text-muted-foreground/60"
              rows={1}
            />
          </div>

          {/* Bottom bar: action buttons */}
          <div className="flex items-center gap-1 px-2 pb-1.5 justify-end">
            {/* Action buttons - always right-aligned */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handleSelectFiles}
                disabled={imagePaths.length >= MAX_IMAGES}
                className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:pointer-events-none disabled:opacity-40"
                aria-label={t('Select Image')}
              >
                <Paperclip className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleSend();
                }}
                disabled={(!content.trim() && imagePaths.length === 0) || isAgentRunning}
                className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:pointer-events-none disabled:opacity-40"
                aria-label={t('Send')}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Image preview modal */}
        <Dialog open={previewPath != null} onOpenChange={(o) => !o && setPreviewPath(null)}>
          <DialogPopup className="max-w-[80vw] max-h-[80vh] p-2">
            {previewPath && (
              <img
                src={toLocalFileUrl(previewPath)}
                alt={getFileName(previewPath)}
                className="max-w-full max-h-[75vh] object-contain rounded"
              />
            )}
          </DialogPopup>
        </Dialog>
      </motion.div>
    </div>
  );
}
