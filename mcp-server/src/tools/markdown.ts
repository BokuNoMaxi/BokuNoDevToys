import { marked } from 'marked';

export async function markdownToHtml(markdown: string): Promise<string> {
  try {
    const html = await marked(markdown);
    return html;
  } catch (error) {
    throw new Error(`Markdown parsing failed: ${(error as Error).message}`);
  }
}

export const markdownTools = [
  {
    name: 'markdown_to_html',
    description: 'Convert Markdown to HTML',
    inputSchema: {
      type: 'object' as const,
      properties: {
        markdown: { type: 'string', description: 'Markdown content' }
      },
      required: ['markdown']
    }
  }
];

export async function handleMarkdownTool(toolName: string, args: Record<string, string>): Promise<string> {
  try {
    if (toolName === 'markdown_to_html') {
      return await markdownToHtml(args.markdown);
    }
    throw new Error(`Unknown tool: ${toolName}`);
  } catch (error) {
    throw new Error(`Markdown error: ${(error as Error).message}`);
  }
}
