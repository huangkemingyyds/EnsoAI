import type { ResolvedAgentCapabilities } from './agentCapabilities';

export type AgentLaunchPlatform = 'win32' | 'posix';

export type AgentLaunchPayloadPlan =
  | {
      ok: true;
      promptArg: string | undefined;
      imageArgs: string[];
    }
  | {
      ok: false;
      reason: 'image_input_unsupported' | 'cli_arg_required';
    };

export interface PlanAgentLaunchPayloadOptions {
  capabilities: Pick<ResolvedAgentCapabilities, 'enhancedInput'>;
  prompt?: string | undefined;
  imagePaths: string[];
  platform: AgentLaunchPlatform;
}

export function shouldPlanAgentLaunchPayload({
  prompt,
  imagePaths,
}: Pick<PlanAgentLaunchPayloadOptions, 'prompt' | 'imagePaths'>): boolean {
  return Boolean(prompt?.trim()) || imagePaths.length > 0;
}

function quoteCliArg(value: string, platform: AgentLaunchPlatform): string {
  if (platform === 'win32') {
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/`/g, '``')
      .replace(/%/g, '%%')
      .replace(/\$/g, '`$');
    return `"${escaped}"`;
  }

  return `'${value.replace(/'/g, "'\\''")}'`;
}

function formatCliImageArg(
  template: string | undefined,
  path: string,
  platform: AgentLaunchPlatform
): string {
  const quotedPath = quoteCliArg(path, platform);
  return template ? template.replaceAll('%path%', quotedPath) : `--image ${quotedPath}`;
}

function formatPromptArg(
  prompt: string | undefined,
  platform: AgentLaunchPlatform
): string | undefined {
  if (!prompt) return undefined;

  if (platform === 'win32') {
    const escaped = prompt
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/`/g, '``')
      .replace(/%/g, '%%')
      .replace(/\$/g, '`$')
      .replace(/\n/g, ' ');
    return `"${escaped}"`;
  }

  const escaped = prompt.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
  return `$'${escaped}'`;
}

export function planAgentLaunchPayload({
  capabilities,
  prompt,
  imagePaths,
  platform,
}: PlanAgentLaunchPayloadOptions): AgentLaunchPayloadPlan {
  const promptArg = formatPromptArg(prompt, platform);

  if (imagePaths.length === 0) {
    return { ok: true, promptArg, imageArgs: [] };
  }

  const { imageInput } = capabilities.enhancedInput;
  if (!imageInput.supported) {
    return { ok: false, reason: 'image_input_unsupported' };
  }

  if (imageInput.mode !== 'cli_arg') {
    return { ok: false, reason: 'cli_arg_required' };
  }

  return {
    ok: true,
    promptArg,
    imageArgs: imagePaths.map((path) =>
      formatCliImageArg(imageInput.injectionTemplate, path, platform)
    ),
  };
}
