export function urlEncode(text: string): string {
  return encodeURIComponent(text);
}

export function urlDecode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch (error) {
    throw new Error(`Invalid URL encoding: ${(error as Error).message}`);
  }
}

export function htmlEncode(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export function htmlDecode(text: string): string {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'"
  };
  let result = text;
  Object.entries(map).forEach(([encoded, decoded]) => {
    result = result.replace(new RegExp(encoded, 'g'), decoded);
  });
  return result;
}

export function reverseString(text: string): string {
  return text.split('').reverse().join('');
}

export function countChars(text: string): Record<string, number> {
  return {
    chars: text.length,
    charsNoSpaces: text.replace(/\s/g, '').length,
    words: text.trim().split(/\s+/).filter(Boolean).length,
    lines: text.split('\n').length,
    bytes: Buffer.byteLength(text, 'utf8')
  };
}

export const textTools = [
  {
    name: 'url_encode',
    description: 'URL encode text',
    inputSchema: {
      type: 'object' as const,
      properties: {
        text: { type: 'string', description: 'Text to encode' }
      },
      required: ['text']
    }
  },
  {
    name: 'url_decode',
    description: 'URL decode text',
    inputSchema: {
      type: 'object' as const,
      properties: {
        text: { type: 'string', description: 'Text to decode' }
      },
      required: ['text']
    }
  },
  {
    name: 'html_encode',
    description: 'HTML encode text',
    inputSchema: {
      type: 'object' as const,
      properties: {
        text: { type: 'string', description: 'Text to encode' }
      },
      required: ['text']
    }
  },
  {
    name: 'html_decode',
    description: 'HTML decode text',
    inputSchema: {
      type: 'object' as const,
      properties: {
        text: { type: 'string', description: 'Text to decode' }
      },
      required: ['text']
    }
  },
  {
    name: 'reverse_string',
    description: 'Reverse a string',
    inputSchema: {
      type: 'object' as const,
      properties: {
        text: { type: 'string', description: 'Text to reverse' }
      },
      required: ['text']
    }
  },
  {
    name: 'count_chars',
    description: 'Count characters, words, lines',
    inputSchema: {
      type: 'object' as const,
      properties: {
        text: { type: 'string', description: 'Text to analyze' }
      },
      required: ['text']
    }
  }
];

export async function handleTextTool(toolName: string, args: Record<string, string>): Promise<string> {
  try {
    switch (toolName) {
      case 'url_encode':
        return urlEncode(args.text);
      case 'url_decode':
        return urlDecode(args.text);
      case 'html_encode':
        return htmlEncode(args.text);
      case 'html_decode':
        return htmlDecode(args.text);
      case 'reverse_string':
        return reverseString(args.text);
      case 'count_chars':
        return JSON.stringify(countChars(args.text), null, 2);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    throw new Error(`Text error: ${(error as Error).message}`);
  }
}
