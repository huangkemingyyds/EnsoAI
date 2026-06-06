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
  if (!capabilities.enhancedInput.imageInput.supported || imagePaths.length === 0) {
    return trimmedContent;
  }

  const formattedPaths = imagePaths.map(quotePathIfNeeded).join(' ');
  if (!trimmedContent) return formattedPaths;

  return `${trimmedContent}\n\n${formattedPaths}`;
}
