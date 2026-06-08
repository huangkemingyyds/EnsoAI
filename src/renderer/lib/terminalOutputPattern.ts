const ANSI_ESCAPE_PATTERN =
  // biome-ignore lint/suspicious/noControlCharactersInRegex: terminal escape parsing needs ESC/BEL.
  /\x1b(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1b\\)|[@-Z\\-_])/g;

const INLINE_FLAGS_PATTERN = /^\(\?([a-z]+)\)/;
const SUPPORTED_INLINE_FLAGS = new Set(['i', 'm', 's', 'u']);

interface CompletionOutputRegex {
  regex: RegExp;
  inlineFlags: string;
}

export function normalizeTerminalOutputForPattern(output: string): string {
  return output.replace(ANSI_ESCAPE_PATTERN, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function getLastNonEmptyLine(output: string): string {
  const lines = output.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim().length > 0) {
      return lines[i];
    }
  }
  return output;
}

export function createCompletionOutputRegex(pattern: string): CompletionOutputRegex {
  const inlineFlags = pattern.match(INLINE_FLAGS_PATTERN);
  if (!inlineFlags) {
    return { regex: new RegExp(pattern), inlineFlags: '' };
  }

  const flags = Array.from(
    new Set([...inlineFlags[1]].filter((flag) => SUPPORTED_INLINE_FLAGS.has(flag)))
  ).join('');

  return { regex: new RegExp(pattern.slice(inlineFlags[0].length), flags), inlineFlags: flags };
}

export function matchesCompletionOutputPattern(output: string, pattern: string): boolean {
  const sample = normalizeTerminalOutputForPattern(output).slice(-1000);
  const { regex, inlineFlags } = createCompletionOutputRegex(pattern);
  const target = inlineFlags.includes('m') ? getLastNonEmptyLine(sample) : sample;
  return regex.test(target);
}
