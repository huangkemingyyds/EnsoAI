import { describe, expect, it } from 'vitest';
import { resolveAgentCapabilities } from '../agentCapabilities';
import { formatEnhancedInputForAgent } from '../enhancedInputFormatter';

describe('formatEnhancedInputForAgent', () => {
  it('appends attachment paths to the prompt for Codex', () => {
    const message = formatEnhancedInputForAgent({
      capabilities: resolveAgentCapabilities('codex'),
      content: 'Review this screen',
      imagePaths: ['C:\\screenshots\\main view.png'],
    });

    expect(message).toBe('Review this screen\n\n"C:\\screenshots\\main view.png"');
  });

  it('falls back from cli_arg image mode to appended prompt paths in an active session', () => {
    const capabilities = resolveAgentCapabilities('codex');
    const message = formatEnhancedInputForAgent({
      capabilities: {
        enhancedInput: {
          ...capabilities.enhancedInput,
          imageInput: {
            supported: true,
            mode: 'cli_arg',
          },
        },
      },
      content: 'Use this image',
      imagePaths: ['image.png'],
    });

    expect(message).toBe('Use this image\n\nimage.png');
  });

  it('formats Gemini images using prompt-with-arg mode', () => {
    const message = formatEnhancedInputForAgent({
      capabilities: resolveAgentCapabilities('gemini'),
      content: 'Describe this',
      imagePaths: ['gemini image.png'],
    });

    expect(message).toBe('--image "gemini image.png" "Describe this"');
  });

  it('formats Gemini with multiple images using prompt-with-arg mode', () => {
    const message = formatEnhancedInputForAgent({
      capabilities: resolveAgentCapabilities('gemini'),
      content: 'Compare these',
      imagePaths: ['img1.png', 'img2.png'],
    });

    expect(message).toBe('--image img1.png --image img2.png "Compare these"');
  });

  it('formats Gemini images without text content using prompt-with-arg mode', () => {
    const message = formatEnhancedInputForAgent({
      capabilities: resolveAgentCapabilities('gemini'),
      content: '',
      imagePaths: ['img1.png'],
    });

    expect(message).toBe('--image img1.png');
  });
});
