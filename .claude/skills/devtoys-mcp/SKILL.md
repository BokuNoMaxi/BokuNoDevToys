---
description: DevToys MCP Server - Use specialized text & data tools via Claude
tags: [mcp, tools, text-processing, data-conversion]
triggers:
  - "use devtoys"
  - "encode base64"
  - "format json"
  - "hash"
  - "convert units"
  - "qr code"
---

# DevToys MCP Connector

Exposes all DevToys tools to Claude via MCP (Model Context Protocol), enabling AI assistants to use pre-optimized functions for text transformations, data encoding, hashing, and unit conversion instead of generating code.

## What It Does

When you ask Claude to:
- Encode/decode text (Base64, URL, HTML)
- Format data (JSON, SQL, Markdown)
- Generate hashes or UUIDs
- Convert between units
- Create QR codes

Instead of Claude writing the logic, it **calls the specialized DevToys tool** via MCP. This saves 30-50% token usage and eliminates hallucinations.

## Available Tools

| Category | Tools |
|----------|-------|
| **Encoding** | base64_encode, base64_decode, url_encode, url_decode, html_encode, html_decode |
| **Text** | reverse_string, count_chars |
| **JSON** | json_format, json_minify, json_validate |
| **Markup** | markdown_to_html, format_sql |
| **Crypto** | hash_md5, hash_sha256, hash_sha512, generate_uuid, generate_random_string |
| **QR Codes** | generate_qrcode |
| **Units** | convert_length, convert_weight, convert_temperature |

## Setup

The MCP server is **pre-configured** in `.claude/settings.json`. Nothing to do — it loads automatically.

```json
{
  "mcpServers": {
    "devtoys": {
      "command": "node",
      "args": ["mcp-server/dist/index.js"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

## Usage Examples

### Ask Claude to use the tools:

```
"Encode this string to Base64: hello world"
→ Claude calls base64_encode tool
→ Returns: aGVsbG8gd29ybGQ=
```

```
"Format this JSON: {"name":"John","age":30}"
→ Claude calls json_format tool with indent: 2
→ Returns formatted JSON
```

```
"Generate SHA256 hash of 'password123'"
→ Claude calls hash_sha256 tool
→ Returns: ef92b778...
```

```
"Convert 100 miles to kilometers"
→ Claude calls convert_length tool
→ Returns: { value: 160.934, from: 'mi', to: 'km' }
```

## Building & Testing

### Build the MCP server:
```bash
cd mcp-server
npm install
npm run build
```

### Test the server directly:
```bash
node mcp-server/dist/index.js
```

Then send JSON-RPC requests via stdin:
```json
{"jsonrpc":"2.0","id":1,"method":"tools/list"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"base64_encode","arguments":{"text":"hello"}}}
```

### Test via Claude Code:
Just ask Claude to use any of the tools. If the MCP server is running, it will call them.

## Adding New Tools

1. Create `mcp-server/src/tools/mytool.ts`:
```typescript
export function myTransform(input: string): string {
  return transformed;
}

export const myToolTools = [
  {
    name: 'my_tool',
    description: 'What it does',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string', description: '...' }
      },
      required: ['input']
    }
  }
];

export async function handleMyToolTool(toolName: string, args: Record<string, string>): Promise<string> {
  if (toolName === 'my_tool') {
    return myTransform(args.input);
  }
  throw new Error(`Unknown tool: ${toolName}`);
}
```

2. Add to `mcp-server/src/tools/index.ts`:
```typescript
import { myToolTools, handleMyToolTool } from './mytool.js';

const toolCategories: ToolHandler[] = [
  // ... existing ...
  { tools: myToolTools, handler: handleMyToolTool }
];
```

3. Rebuild:
```bash
cd mcp-server
npm run build
```

The new tool is automatically registered and available to Claude.

## Benefits

| Benefit | Impact |
|---------|--------|
| **Token Savings** | 30-50% less tokens for text operations |
| **Speed** | Pre-optimized vs LLM inference |
| **Reliability** | No hallucinations on encoding/hashing |
| **Consistency** | Same code across CLI, Web, AI |
| **Extensibility** | New tools in 5 minutes |

## Troubleshooting

### Tools not appearing in Claude Code?
1. Check `.claude/settings.json` exists and has `mcpServers.devtoys`
2. Verify `mcp-server/dist/index.js` exists (run `npm run build`)
3. Restart Claude Code session
4. Check stderr for MCP connection errors

### Tool returns error?
- Check the tool name spelling in the error message
- Verify argument types (e.g., `value` should be `number` for conversion tools)
- Run the server directly to debug JSON-RPC requests

### Server won't start?
- Ensure Node.js 18+ is installed: `node --version`
- Check working directory: should be the project root
- Run `cd mcp-server && npm install && npm run build`

## References

- [MCP Specification](https://modelcontextprotocol.io/)
- [mcp-server/README.md](../../mcp-server/README.md)
- [DevToys Web](https://devtoys.bokunocompany.at/)
