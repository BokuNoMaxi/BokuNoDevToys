import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { defineTool, text, ok, okJson } from '../util.js';
import { diffText, diffStats, diffToText } from '../../../src/lib/core/diff';
import { prettifyText } from '../../../src/lib/core/text';
import { MODELS, generateText } from '../../../src/lib/core/textgen';
import { runRegexSafely } from '../regex-worker.js';

const MAX_DIFF_LINES = 3000;

export function registerTextTools(server: McpServer): void {
	defineTool(server, 'diff_text', {
		title: 'Line diff of two texts',
		description: `Line-based diff (Myers). Returns a unified-style listing with +/-/space prefixes and counts. Limited to ${MAX_DIFF_LINES} lines combined.`,
		input: { original: text('Original text'), changed: text('Changed text') },
		run: ({ original, changed }) => {
			const lines = original.split('\n').length + changed.split('\n').length;
			if (lines > MAX_DIFF_LINES) throw new Error(`Inputs too large (${lines} lines combined, max ${MAX_DIFF_LINES})`);
			const diff = diffText(original, changed);
			return ok(`${JSON.stringify(diffStats(diff))}\n${diffToText(diff)}`);
		},
	});

	defineTool(server, 'text_prettify', {
		title: 'Clean up text',
		description: 'Normalize whitespace and line breaks, optionally strip HTML, URL-encode/decode, or convert case (camel/pascal/snake/kebab).',
		input: {
			text: text('Text to clean'),
			mode: z.enum(['auto', 'single', 'paragraph', 'compact']).default('auto').describe('single = one line, paragraph = keep paragraphs, compact = drop empty lines'),
			stripHtml: z.boolean().default(false),
			url: z.enum(['none', 'encode', 'decode']).default('none'),
			caseTransform: z.enum(['none', 'camel', 'pascal', 'snake', 'kebab']).default('none'),
		},
		run: ({ text: t, mode, stripHtml, url, caseTransform }) => ok(prettifyText(t, { mode, stripHtml, url, caseTransform })),
	});

	defineTool(server, 'text_generate', {
		title: 'Generate placeholder text',
		description: `Placeholder text from a source: ${MODELS.map(m => m.id).join(', ')}.`,
		deterministic: false,
		input: {
			model: z.enum(MODELS.map(m => m.id) as [string, ...string[]]).default('lorem-ipsum'),
			paragraphs: z.number().int().min(1).max(50).default(3),
			maxChars: z.number().int().min(0).max(100000).default(0).describe('0 = unlimited'),
		},
		run: ({ model, paragraphs, maxChars }) => ok(generateText(MODELS.find(m => m.id === model)!, paragraphs, maxChars)),
	});

	defineTool(server, 'regex_test', {
		title: 'Test a regular expression',
		description: 'Run a JavaScript regex against a text and return all matches with index and capture groups. Aborts after 2 seconds (catastrophic backtracking).',
		input: {
			pattern: z.string().max(2000),
			text: text('Text to search'),
			flags: z.string().regex(/^[gimsuy]*$/).max(6).default('g').describe('JS regex flags, e.g. gi'),
			maxMatches: z.number().int().min(1).max(1000).default(100),
		},
		run: async ({ pattern, text: t, flags, maxMatches }) => {
			const flagSet = { g: flags.includes('g'), i: flags.includes('i'), m: flags.includes('m'), s: flags.includes('s') };
			const matches = await runRegexSafely({ pattern, text: t, flags: flagSet });
			return okJson({ count: matches.length, truncated: matches.length > maxMatches, matches: matches.slice(0, maxMatches) });
		},
	});
}
