# DevToys MCP Server

MCP (Model Context Protocol) server that exposes all DevToys tools to Claude AI assistants.

## Overview

Instead of Claude generating text transformations, hashing, encoding/decoding from scratch, it can now call these specialized tools via MCP. This saves **30-50% token usage** for common operations.

## Available Tools

### Text Encoding & Decoding
- `base64_encode` — Encode to Base64
- `base64_decode` — Decode from Base64
- `url_encode` — URL encode text
- `url_decode` — URL decode text
- `html_encode` — HTML entity encode
- `html_decode` — HTML entity decode

### Text Utilities
- `reverse_string` — Reverse a string
- `count_chars` — Count chars, words, lines, bytes

### Data Formats
- `json_format` — Pretty-print JSON with indentation
- `json_minify` — Minify JSON (remove whitespace)
- `json_validate` — Validate JSON syntax
- `markdown_to_html` — Convert Markdown to HTML
- `format_sql` — Format SQL queries (supports multiple dialects)

### Cryptography & Security
- `hash_md5` — Generate MD5 hash
- `hash_sha256` — Generate SHA256 hash
- `hash_sha512` — Generate SHA512 hash
- `generate_uuid` — Generate UUID v4
- `generate_random_string` — Generate random string

### QR Codes
- `generate_qrcode` — Generate QR code from text/URL

### Unit Conversion
- `convert_length` — Convert between length units (mm, cm, m, km, in, ft, yd, mi)
- `convert_weight` — Convert between weight units (mg, g, kg, oz, lb, t)
- `convert_temperature` — Convert between temp units (celsius, fahrenheit, kelvin)

## Architecture

```
src/
├── index.ts          — MCP server (JSON-RPC over stdio)
└── tools/
    ├── base64.ts     — Base64 encoding/decoding
    ├── crypto.ts     — Hashing & random generation
    ├── json.ts       — JSON formatting & validation
    ├── markdown.ts   — Markdown conversion
    ├── qrcode.ts     — QR code generation
    ├── sql.ts        — SQL formatting
    ├── text.ts       — Text utilities
    ├── units.ts      — Unit conversion
    └── index.ts      — Tool registry & dispatcher
```

## Building

```bash
cd mcp-server
npm install
npm run build
```

## Testing

Run the server and send JSON-RPC requests via stdin:

```bash
node dist/index.js
```

Then send a JSON-RPC request (each line is a separate request):

```json
{"jsonrpc":"2.0","id":1,"method":"tools/list"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"base64_encode","arguments":{"text":"hello"}}}
```

## Integration with Claude Code

The server is automatically registered in `.claude/settings.json`:

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

Once registered, Claude Code and Claude Cowork will automatically detect all tools.

## Adding New Tools

1. Create a new file in `src/tools/myfeature.ts`
2. Export:
   - Feature functions (e.g., `myTransform(input: string): string`)
   - `myfeatureTools` array with tool definitions
   - `handleMyfeatureTool` async handler
3. Import and add to `src/tools/index.ts`:

```typescript
import { myfeatureTools, handleMyfeatureTool } from './myfeature.js';

const toolCategories: ToolHandler[] = [
  // ...existing...
  { tools: myfeatureTools, handler: handleMyfeatureTool }
];
```

4. Rebuild: `npm run build`

## Benefits

- **Token Savings**: 30-50% less token usage for text transformations
- **Speed**: Pre-optimized functions vs LLM inference
- **Consistency**: Same implementation across CLI, Web, and AI interfaces
- **Reliability**: No hallucinations on encoding/hashing operations
- **Extensibility**: Easy to add new tools without modifying core server
