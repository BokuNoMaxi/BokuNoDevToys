import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer, SERVER_VERSION } from './server.js';

const PORT = Number(process.env.PORT ?? 3000);
const MAX_BODY_BYTES = 6 * 1024 * 1024;

function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
	res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
	res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<unknown> {
	return new Promise((resolve, reject) => {
		let size = 0;
		const chunks: Buffer[] = [];
		req.on('data', (c: Buffer) => {
			size += c.length;
			if (size > MAX_BODY_BYTES) { reject(Object.assign(new Error('Payload too large'), { status: 413 })); req.destroy(); return; }
			chunks.push(c);
		});
		req.on('end', () => {
			try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
			catch { reject(Object.assign(new Error('Invalid JSON'), { status: 400 })); }
		});
		req.on('error', reject);
	});
}

async function handleMcp(req: IncomingMessage, res: ServerResponse): Promise<void> {
	if (req.method !== 'POST') {
		// Stateless Server: kein Server-Initiated-Stream (GET) und keine Sessions (DELETE)
		send(res, 405, { jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed' }, id: null }, { Allow: 'POST' });
		return;
	}
	let body: unknown;
	try {
		body = await readBody(req);
	} catch (e) {
		const status = (e as { status?: number }).status ?? 400;
		send(res, status, { jsonrpc: '2.0', error: { code: -32700, message: (e as Error).message }, id: null });
		return;
	}

	const server = createServer();
	const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
	res.on('close', () => { void transport.close(); void server.close(); });
	try {
		await server.connect(transport);
		await transport.handleRequest(req, res, body);
	} catch (e) {
		console.error('MCP request failed:', e);
		if (!res.headersSent) send(res, 500, { jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
	}
}

const http = createHttpServer((req, res) => {
	const path = (req.url ?? '/').split('?')[0];
	if (path === '/mcp' || path === '/mcp/') { void handleMcp(req, res); return; }
	if (path === '/healthz') { send(res, 200, { status: 'ok', version: SERVER_VERSION }); return; }
	send(res, 404, { error: 'Not found' });
});

http.requestTimeout = 30_000;
http.headersTimeout = 10_000;
http.listen(PORT, () => console.log(`DevToys MCP server ${SERVER_VERSION} listening on :${PORT} (POST /mcp)`));

for (const sig of ['SIGTERM', 'SIGINT'] as const) {
	process.on(sig, () => http.close(() => process.exit(0)));
}
