import type { ResolvedAgentCapabilities } from './agentCapabilities';

export interface FormatEnhancedInputOptions {
  capabilities: Pick<ResolvedAgentCapabilities, 'enhancedInput'>;
  content: string;
  imagePaths: string[];
}

function quotePathIfNeeded(path: string): string {
  return /\s/.test(path) ? `"${path}"` : path;
}

export function formatEnhancedInputForAgent({
  capabilities,
  content,
  imagePaths,
}: FormatEnhancedInputOptions): string {
  const trimmedContent = content.trim();
  const { supported, mode } = capabilities.enhancedInput.imageInput;

  if (!supported || imagePaths.length === 0) {
    return trimmedContent;
  }

  // Handle different image input modes
  switch (mode) {
    case 'prompt_with_arg': {
      // Format: --image path1 --image path2 "text"
      const args = imagePaths.map((p) => `--image ${quotePathIfNeeded(p)}`).join(' ');
      if (!trimmedContent) return args;
      return `${args} ${JSON.stringify(trimmedContent)}`;
    }

    default: {
      // Format: text\n\npath1 path2
      // Note: cli_arg is not supported in already running sessions, fall back to append_to_prompt
      const formattedPaths = imagePaths.map(quotePathIfNeeded).join(' ');
      if (!trimmedContent) return formattedPaths;
      return `${trimmedContent}\n\n${formattedPaths}`;
    }
  }
}
