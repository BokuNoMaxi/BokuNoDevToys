import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z, type ZodRawShape } from 'zod';

/** Maximale Länge einzelner Text-Eingaben (Zeichen). */
export const MAX_TEXT = 2_000_000;

export const text = (description: string) => z.string().max(MAX_TEXT).describe(description);

export const ok = (value: string): CallToolResult => ({ content: [{ type: 'text', text: value }] });
export const okJson = (value: unknown): CallToolResult => ok(JSON.stringify(value, null, 2));
export const fail = (message: string): CallToolResult => ({ isError: true, content: [{ type: 'text', text: message }] });

interface ToolDef<S extends ZodRawShape> {
	title: string;
	description: string;
	input: S;
	/** false für Tools mit Zufall oder Zeitbezug */
	deterministic?: boolean;
	run: (args: z.infer<z.ZodObject<S>>) => CallToolResult | Promise<CallToolResult>;
}

/** Registriert ein reines, zustandsloses Tool; Fehler werden als isError-Ergebnis zurückgegeben. */
export function defineTool<S extends ZodRawShape>(server: McpServer, name: string, def: ToolDef<S>): void {
	server.registerTool(
		name,
		{
			title: def.title,
			description: def.description,
			inputSchema: def.input,
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: def.deterministic !== false,
				openWorldHint: false,
			},
		},
		// Die SDK-Typen für ZodRawShape-Generics sind hier zu eng; Argumente sind durch inputSchema bereits validiert.
		(async (args: z.infer<z.ZodObject<S>>) => {
			try {
				return await def.run(args);
			} catch (e) {
				return fail(e instanceof Error ? e.message : String(e));
			}
		}) as never
	);
}
