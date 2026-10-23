export function formatJson(input: string, indent: number = 2): string {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed, null, indent);
  } catch (error) {
    throw new Error(`Invalid JSON: ${(error as Error).message}`);
  }
}

export function minifyJson(input: string): string {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed);
  } catch (error) {
    throw new Error(`Invalid JSON: ${(error as Error).message}`);
  }
}

export function validateJson(input: string): boolean {
  try {
    JSON.parse(input);
    return true;
  } catch {
    return false;
  }
}

export const jsonTools = [
  {
    name: 'json_format',
    description: 'Format and pretty-print JSON',
    inputSchema: {
      type: 'object' as const,
      properties: {
        json: { type: 'string', description: 'JSON string to format' },
        indent: { type: 'number', description: 'Indentation spaces (default: 2)' }
      },
      required: ['json']
    }
  },
  {
    name: 'json_minify',
    description: 'Minify JSON (remove whitespace)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        json: { type: 'string', description: 'JSON string to minify' }
      },
      required: ['json']
    }
  },
  {
    name: 'json_validate',
    description: 'Validate JSON syntax',
    inputSchema: {
      type: 'object' as const,
      properties: {
        json: { type: 'string', description: 'JSON string to validate' }
      },
      required: ['json']
    }
  }
];

export async function handleJsonTool(toolName: string, args: Record<string, string | number>): Promise<string> {
  try {
    if (toolName === 'json_format') {
      const indent = typeof args.indent === 'number' ? args.indent : 2;
      return formatJson(args.json as string, indent);
    } else if (toolName === 'json_minify') {
      return minifyJson(args.json as string);
    } else if (toolName === 'json_validate') {
      const isValid = validateJson(args.json as string);
      return JSON.stringify({ valid: isValid });
    }
    throw new Error(`Unknown tool: ${toolName}`);
  } catch (error) {
    throw new Error(`JSON error: ${(error as Error).message}`);
  }
}
