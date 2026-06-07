import type { Session } from '@/components/chat/SessionBar';

export interface CreateAgentLaunchSessionOptions {
  id: string;
  repoPath: string;
  cwd: string;
  agentId: string;
  agentCommand: string;
  name: string;
  prompt: string;
  imagePaths: string[];
  customPath?: string;
  customArgs?: string;
  environment?: 'native' | 'hapi' | 'happy';
}

export function createAgentLaunchSession({
  id,
  repoPath,
  cwd,
  agentId,
  agentCommand,
  name,
  prompt,
  imagePaths,
  customPath,
  customArgs,
  environment,
}: CreateAgentLaunchSessionOptions): Session {
  return {
    id,
    sessionId: id,
    name,
    agentId,
    agentCommand,
    customPath,
    customArgs,
    initialized: false,
    repoPath,
    cwd,
    environment,
    pendingCommand: prompt,
    pendingImagePaths: imagePaths,
  };
}

export function createInitializedSessionUpdates(): Pick<
  Session,
  'initialized' | 'pendingCommand' | 'pendingImagePaths'
> {
  return {
    initialized: true,
    pendingCommand: undefined,
    pendingImagePaths: undefined,
  };
}

export function hasPendingLaunchPayload({
  pendingCommand,
  pendingImagePaths,
}: Pick<Session, 'pendingCommand' | 'pendingImagePaths'>): boolean {
  return Boolean(pendingCommand?.trim()) || Boolean(pendingImagePaths?.length);
}
