# DevToys MCP server

Remote [MCP](https://modelcontextprotocol.io) server (Streamable HTTP, stateless) that exposes the DevToys tools to Claude and other MCP clients.

- **Endpoint:** `POST /mcp` (JSON responses, no sessions, no auth) — `GET /healthz` for health checks
- **User docs / connect guide:** <https://devtoys.bokunocompany.at/mcp-connector>
- **Logic:** lives in [`../src/lib/core`](../src/lib/core) and is shared with the Svelte web tools. This package only adds the MCP layer (`src/tools/*.ts`), the HTTP entry (`src/http.ts`) and a Node DOM (`src/node-dom.ts`, linkedom) for the HTML/XML tools.

## Develop

```bash
cd mcp-server
npm ci
npm test            # builds, starts the server on a random port and runs the MCP client tests
npm run typecheck
npm run build && PORT=3000 node dist/server.mjs
```

## Add a tool

1. Put the pure logic in `src/lib/core/<area>.ts` (no DOM, no `$lib/i18n`; take a `ParseDoc` argument if you need a document) and use it from the Svelte component too.
2. Register it in the matching `src/tools/*.ts` with `defineTool(server, name, { title, description, input, run })`. Keep descriptions short — they are sent to the model with every conversation.
3. Add the name and a one-line description to `mcpDocs.tools` in **both** `src/lib/translations/en.ts` and `de.ts` (a test fails if they drift) and a test to `test/server.test.mjs`.

## Safety notes

The endpoint is public. Therefore: no URL fetching (SSRF), body limit 6 MB, 2 MB per text field, `regex_test` runs in a worker with a 2 s timeout (ReDoS), `diff_text` is line-capped, and nginx rate-limits `/mcp`. Do not add tools that read files, call other services or keep state.

## Deploy

Part of `docker-compose.yml` (`mcp` service, `Dockerfile.mcp`); nginx proxies `/mcp` to it. See the deploy section in the repository `CLAUDE.md`.
