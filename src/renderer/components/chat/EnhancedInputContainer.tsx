import { MessageSquare } from 'lucide-react';
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipPopup, TooltipTrigger } from '@/components/ui/tooltip';
import { useI18n } from '@/i18n';
import { resolveAgentCapabilities } from '@/lib/agentCapabilities';
import { useAgentSessionsStore } from '@/stores/agentSessions';
import { useSettingsStore } from '@/stores/settings';
import { EnhancedInput } from './EnhancedInput';

interface EnhancedInputContainerProps {
  sessionId: string;
  onSend: (content: string, imagePaths: string[]) => boolean | Promise<boolean>;
  /** Whether the parent panel is active (used to trigger focus on tab switch) */
  isActive?: boolean;
  /** Whether slash command completion is available for this Agent Session */
  slashCommandCompletionEnabled?: boolean;
}

interface EnhancedInputEntryPointProps {
  sessionId: string;
}

export const EnhancedInputEntryPoint = memo(function EnhancedInputEntryPoint({
  sessionId,
}: EnhancedInputEntryPointProps) {
  const { t } = useI18n();
  const enhancedInputState = useAgentSessionsStore((state) => state.enhancedInputStates[sessionId]);
  const setEnhancedInputOpen = useAgentSessionsStore((state) => state.setEnhancedInputOpen);
  if (enhancedInputState?.open) {
    return null;
  }

  const hasDraft =
    (enhancedInputState?.content.trim().length ?? 0) > 0 ||
    (enhancedInputState?.imagePaths.length ?? 0) > 0;

  return (
    <Tooltip>
      <TooltipTrigger render={<span />}>
        <Button
          aria-label={t('Open Enhanced Input')}
          className="relative"
          onClick={() => setEnhancedInputOpen(sessionId, true)}
          size="icon-xs"
          variant="ghost"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {hasDraft && (
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipPopup side="top">
        {hasDraft ? t('Draft saved') : t('Open Enhanced Input')}
      </TooltipPopup>
    </Tooltip>
  );
});

/**
 * Container component for EnhancedInput that subscribes to its own state.
 * This prevents re-renders of the parent AgentPanel when enhanced input state changes.
 */
export const EnhancedInputContainer = memo(function EnhancedInputContainer({
  sessionId,
  onSend,
  isActive = false,
  slashCommandCompletionEnabled: _slashCommandCompletionEnabled = false,
}: EnhancedInputContainerProps) {
  // Subscribe to only this session's enhanced input state
  const enhancedInputState = useAgentSessionsStore((state) => state.enhancedInputStates[sessionId]);

  const session = useAgentSessionsStore((state) => state.sessions.find((s) => s.id === sessionId));
  const agentCapabilities = session ? resolveAgentCapabilities(session.agentId) : null;
  const supportsSlash = agentCapabilities?.enhancedInput?.slashCommandCompletion ?? false;

  const setEnhancedInputOpen = useAgentSessionsStore((state) => state.setEnhancedInputOpen);
  const suppressEnhancedInputAutoOpen = useAgentSessionsStore(
    (state) => state.suppressEnhancedInputAutoOpen
  );
  const setEnhancedInputContent = useAgentSessionsStore((state) => state.setEnhancedInputContent);
  const setEnhancedInputImages = useAgentSessionsStore((state) => state.setEnhancedInputImages);
  const clearEnhancedInput = useAgentSessionsStore((state) => state.clearEnhancedInput);

  // Get enhanced input mode setting
  const enhancedInputAutoPopup = useSettingsStore((state) => state.agentInput.autoPopupMode);
  const keepOpenAfterSend = enhancedInputAutoPopup === 'always';

  // Get cwd from session for file mention search
  const cwd = useAgentSessionsStore((state) => state.sessions.find((s) => s.id === sessionId)?.cwd);

  // Default state if not found
  const open = enhancedInputState?.open ?? false;
  const content = enhancedInputState?.content ?? '';
  const imagePaths = enhancedInputState?.imagePaths ?? [];

  if (!open) {
    return null;
  }

  return (
    <EnhancedInput
      sessionId={sessionId}
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          suppressEnhancedInputAutoOpen(sessionId);
          setEnhancedInputOpen(sessionId, false);
        }
      }}
      onSend={async (sendContent, sendImagePaths) => {
        console.log('[EnhancedInput] Sending message');
        const sent = await onSend(sendContent, sendImagePaths);
        if (sent) {
          clearEnhancedInput(sessionId, keepOpenAfterSend);
        }
        return sent;
      }}
      content={content}
      imagePaths={imagePaths}
      onContentChange={(newContent) => setEnhancedInputContent(sessionId, newContent)}
      onImagesChange={(newImagePaths) => setEnhancedInputImages(sessionId, newImagePaths)}
      keepOpenAfterSend={keepOpenAfterSend}
      closeOnSend={false}
      isActive={isActive}
      cwd={cwd}
      slashCommandCompletionEnabled={supportsSlash}
    />
  );
});
