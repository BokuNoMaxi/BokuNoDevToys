import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import QRCode from 'qrcode';
import { defineTool, text, ok, okJson } from '../util.js';
import { computeHash } from '../../../src/lib/core/hash';
import { buildCharset, calcEntropy, generatePassword } from '../../../src/lib/core/security';
import { randomInts, valueRows, pickRandom, shuffleRows } from '../../../src/lib/core/random';
import { cronNextRuns } from '../../../src/lib/core/cron';
import { buildQrContent } from '../../../src/lib/core/qr';
import { curlToCode } from '../../../src/lib/core/curl';

export function registerGenerateTools(server: McpServer): void {
	defineTool(server, 'hash_text', {
		title: 'Hash text',
		description: 'Hex digest of a UTF-8 text with MD5, SHA-1, SHA-256 or SHA-512. Do not send secrets you want to keep private.',
		input: {
			text: text('Text to hash'),
			algorithm: z.enum(['MD5', 'SHA-1', 'SHA-256', 'SHA-512']).default('SHA-256'),
		},
		run: async ({ text: t, algorithm }) => ok(await computeHash(t, algorithm)),
	});

	defineTool(server, 'password_generate', {
		title: 'Generate passwords',
		description: 'Cryptographically random passwords (rejection sampling, no modulo bias) with entropy estimate. Generated on the server over TLS; nothing is stored or logged.',
		deterministic: false,
		input: {
			length: z.number().int().min(4).max(256).default(20),
			count: z.number().int().min(1).max(50).default(1),
			upper: z.boolean().default(true),
			lower: z.boolean().default(true),
			numbers: z.boolean().default(true),
			symbols: z.boolean().default(false),
			extraChars: z.string().max(100).default('').describe('Additional characters to include'),
		},
		run: ({ length, count, upper, lower, numbers, symbols, extraChars }) => {
			const charset = buildCharset({ upper, lower, numbers, symbols, extraChars });
			if (!charset) throw new Error('Select at least one character set');
			return okJson({
				entropyBits: calcEntropy(charset.length, length),
				passwords: Array.from({ length: count }, () => generatePassword(charset, length)),
			});
		},
	});

	defineTool(server, 'random_int', {
		title: 'Random integers',
		description: 'Uniform random integers in [min, max] (inclusive).',
		deterministic: false,
		input: {
			min: z.number().int().default(1),
			max: z.number().int().default(100),
			count: z.number().int().min(1).max(10000).default(1),
		},
		run: ({ min, max, count }) => okJson(randomInts(min, max, count)),
	});

	defineTool(server, 'random_pick', {
		title: 'Pick or shuffle values',
		description: 'Pick one random line, or shuffle all lines. If lines contain ":" each column is shuffled independently (e.g. pairing names with tasks).',
		deterministic: false,
		input: { values: text('One value per line'), action: z.enum(['pick', 'shuffle']) },
		run: ({ values, action }) => {
			const rows = valueRows(values);
			if (rows.length === 0) throw new Error('No values given');
			return ok(action === 'pick' ? pickRandom(rows) : shuffleRows(rows).join('\n'));
		},
	});

	defineTool(server, 'cron_next_runs', {
		title: 'Next cron run times',
		description: 'Next execution times of a 5-field cron expression (minute hour day month weekday), in UTC, starting after "from" (default: now).',
		deterministic: false,
		input: {
			expression: z.string().max(200).describe('e.g. */15 9-17 * * 1-5'),
			count: z.number().int().min(1).max(50).default(5),
			from: z.string().max(40).optional().describe('ISO date-time to start after, e.g. 2026-01-01T00:00:00Z'),
		},
		run: ({ expression, count, from }) => {
			const start = from ? new Date(from) : new Date();
			if (isNaN(start.getTime())) throw new Error('Invalid "from" date');
			return okJson(cronNextRuns(expression, count, start).map(d => d.toISOString()));
		},
	});

	defineTool(server, 'curl_to_code', {
		title: 'curl to code',
		description: 'Convert a curl command into JavaScript (fetch), PHP (cURL) or Python (requests).',
		input: { curl: text('curl command'), target: z.enum(['js', 'php', 'python']) },
		run: ({ curl, target }) => {
			const code = curlToCode(curl, target);
			if (code === null) throw new Error('Not a valid curl command (must start with "curl" and contain a URL)');
			return ok(code);
		},
	});

	server.registerTool(
		'qr_generate',
		{
			title: 'Generate QR code',
			description: 'QR code as PNG image for a URL, text, e-mail address, phone number or WiFi network.',
			inputSchema: {
				type: z.enum(['url', 'text', 'email', 'phone', 'wifi']).default('url'),
				content: z.string().max(2000).describe('URL / text / address / phone number; for wifi the SSID'),
				wifiPassword: z.string().max(200).default(''),
				wifiEncryption: z.enum(['WPA', 'WEP', 'nopass']).default('WPA'),
				size: z.number().int().min(64).max(1024).default(256),
				errorCorrection: z.enum(['L', 'M', 'Q', 'H']).default('M'),
			},
			annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
		},
		async ({ type, content, wifiPassword, wifiEncryption, size, errorCorrection }): Promise<CallToolResult> => {
			try {
				const data = buildQrContent({
					type, url: content, text: content, email: content, phone: content,
					wifiSsid: content, wifiPass: wifiPassword, wifiEnc: wifiEncryption,
				});
				const url = await QRCode.toDataURL(data, { width: size, errorCorrectionLevel: errorCorrection });
				return {
					content: [
						{ type: 'image', data: url.slice(url.indexOf(',') + 1), mimeType: 'image/png' },
						{ type: 'text', text: `QR code for: ${data}` },
					],
				};
			} catch (e) {
				return { isError: true, content: [{ type: 'text', text: (e as Error).message }] };
			}
		}
	);
}
