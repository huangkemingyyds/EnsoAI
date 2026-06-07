import type { ResolvedAgentCapabilities } from './agentCapabilities';

export interface FormatEnhancedInputOptions {
  capabilities: Pick<ResolvedAgentCapabilities, 'enhancedInput'>;
  content: string;
  imagePaths: string[];
}

export type EnhancedInputFormatResult =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      reason: 'image_input_unsupported' | 'cli_arg_requires_new_session';
    };

function quotePathIfNeeded(path: string): string {
  return /\s/.test(path) ? `"${path}"` : path;
}

function formatImageArgument(template: string | undefined, path: string): string {
  const quotedPath = quotePathIfNeeded(path);
  return template ? template.replaceAll('%path%', quotedPath) : `--image ${quotedPath}`;
}

export function formatEnhancedInputForAgent({
  capabilities,
  content,
  imagePaths,
}: FormatEnhancedInputOptions): EnhancedInputFormatResult {
  const trimmedContent = content.trim();
  const { supported, mode } = capabilities.enhancedInput.imageInput;

  if (imagePaths.length === 0) {
    return { ok: true, message: trimmedContent };
  }

  if (!supported) {
    return { ok: false, reason: 'image_input_unsupported' };
  }

  // Handle different image input modes
  switch (mode) {
    case 'prompt_with_arg': {
      // Format: --image path1 --image path2 "text"
      const template = capabilities.enhancedInput.imageInput.injectionTemplate;
      const args = imagePaths.map((p) => formatImageArgument(template, p)).join(' ');
      if (!trimmedContent) return { ok: true, message: args };
      return { ok: true, message: `${args} ${JSON.stringify(trimmedContent)}` };
    }

    case 'cli_arg': {
      return { ok: false, reason: 'cli_arg_requires_new_session' };
    }

    default: {
      // Format: text\n\npath1 path2
      const formattedPaths = imagePaths.map(quotePathIfNeeded).join(' ');
      if (!trimmedContent) return { ok: true, message: formattedPaths };
      return { ok: true, message: `${trimmedContent}\n\n${formattedPaths}` };
    }
  }
}
