export type CommandResultType = 'success' | 'info' | 'warning' | 'error';

export interface CommandResultSection {
  title?: string;
  lines: string[];
}

export interface CommandResult {
  type: CommandResultType;
  title?: string;
  message?: string;
  sections?: CommandResultSection[];
}

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  colors: {
    green: '\x1b[32m',
    blue: '\x1b[38;5;33m', // Deep Sky Blue
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    gray: '\x1b[90m',
    white: '\x1b[37m',
  },
};

export class SystemMessageFormatter {
  static format(result: CommandResult): string {
    const lines: string[] = [];
    const color = SystemMessageFormatter.getColorForType(result.type);

    lines.push(''); // Top margin

    // Header: [Title]
    if (result.title) {
      lines.push(`${color}${ANSI.bold} ${result.title} ${ANSI.reset}`);
    }

    // Main Message
    if (result.message) {
      const prefix = !result.title && result.type !== 'info' ? `${color}•${ANSI.reset} ` : ' ';
      lines.push(`${prefix}${result.message}`);
    }

    // Sections
    if (result.sections && result.sections.length > 0) {
      for (const section of result.sections) {
        lines.push(''); // Spacer
        if (section.title) {
          lines.push(` ${ANSI.bold}${ANSI.colors.gray}${section.title.toUpperCase()}${ANSI.reset}`);
        }
        for (const line of section.lines) {
          lines.push(`   ${line}`);
        }
      }
    }

    lines.push(''); // Bottom margin
    return lines.join('\r\n');
  }

  private static getColorForType(type: CommandResultType): string {
    switch (type) {
      case 'success':
        return ANSI.colors.green;
      case 'info':
        return ANSI.colors.blue;
      case 'warning':
        return ANSI.colors.yellow;
      case 'error':
        return ANSI.colors.red;
      default:
        return ANSI.reset;
    }
  }
}
