import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { defineTool, text, ok, okJson } from '../util.js';
import { nodeParseDoc } from '../node-dom.js';
import { base64Encode, base64Decode } from '../../../src/lib/core/encoding';
import { formatJson, minifyJson, formatSql } from '../../../src/lib/core/format';
import { xmlToYaml } from '../../../src/lib/core/xml';
import { parseVarDump, vdToPlain } from '../../../src/lib/core/vardump';
import { markdownToHtml } from '../../../src/lib/core/markdown';
import { convertColor } from '../../../src/lib/core/color';
import { loadCsv } from '../../../src/lib/core/csv';

export function registerConvertTools(server: McpServer): void {
	defineTool(server, 'base64', {
		title: 'Base64 encode/decode',
		description: 'Encode text to Base64 or decode Base64 to text (UTF-8).',
		input: { mode: z.enum(['encode', 'decode']), input: text('Text to encode, or Base64 to decode') },
		run: ({ mode, input }) => {
			try {
				return ok(mode === 'encode' ? base64Encode(input) : base64Decode(input));
			} catch {
				throw new Error(mode === 'decode' ? 'Invalid Base64 string' : 'Encoding failed');
			}
		},
	});

	defineTool(server, 'json_format', {
		title: 'Format or minify JSON',
		description: 'Validate and pretty-print JSON. indent=0 minifies. Returns the parse error message if the JSON is invalid.',
		input: {
			json: text('JSON text'),
			indent: z.number().int().min(0).max(8).default(2).describe('Spaces per level; 0 = minify'),
		},
		run: ({ json, indent }) => ok(indent === 0 ? minifyJson(json) : formatJson(json, indent)),
	});

	defineTool(server, 'sql_format', {
		title: 'Format SQL',
		description: 'Pretty-print SQL with upper-case keywords.',
		input: {
			sql: text('SQL statements'),
			dialect: z.enum(['mysql', 'postgresql', 'sqlite', 'sql']).default('mysql'),
		},
		run: ({ sql, dialect }) => ok(formatSql(sql, dialect)),
	});

	defineTool(server, 'xml_to_yaml', {
		title: 'XML to YAML',
		description: 'Convert an XML document to YAML (attributes become @name keys).',
		input: { xml: text('XML document') },
		run: ({ xml }) => ok(xmlToYaml(xml, nodeParseDoc)),
	});

	defineTool(server, 'vardump_to_json', {
		title: 'PHP var_dump to JSON',
		description: 'Parse PHP var_dump() output into JSON. Objects get a __class key.',
		input: { vardump: text('Output of PHP var_dump()') },
		run: ({ vardump }) => okJson(vdToPlain(parseVarDump(vardump))),
	});

	defineTool(server, 'markdown_to_html', {
		title: 'Markdown to HTML',
		description: 'Render Markdown to HTML (not sanitized).',
		input: { markdown: text('Markdown source') },
		run: ({ markdown }) => ok(markdownToHtml(markdown)),
	});

	defineTool(server, 'color_convert', {
		title: 'Convert color formats',
		description: 'Convert a color (hex, rgb(), hsl(), hsv(), cmyk(), or CSS name) to HEX, RGB, HSL, HSV and CMYK.',
		input: { color: z.string().max(100).describe('e.g. #8b5cf6, rgb(139, 92, 246), hsl(258, 90%, 66%), violet') },
		run: ({ color }) => {
			const data = convertColor(color);
			if (!data) throw new Error('Unrecognized color format');
			return okJson(data);
		},
	});

	defineTool(server, 'csv_parse', {
		title: 'Parse CSV',
		description: 'Parse CSV (delimiter, quoting and escaping auto-detected) into headers and rows as JSON. Use maxRows to keep output small.',
		input: {
			csv: text('CSV text; first row is the header'),
			delimiter: z.enum(['auto', ',', ';', '\t', '|']).default('auto'),
			maxRows: z.number().int().min(1).max(5000).default(100),
		},
		run: ({ csv, delimiter, maxRows }) => {
			const data = loadCsv(csv, delimiter);
			if (!data) throw new Error('No data found');
			return okJson({
				delimiter: data.delimiter,
				columns: data.headers,
				totalRows: data.rows.length,
				rows: data.rows.slice(0, maxRows),
				truncated: data.rows.length > maxRows,
			});
		},
	});
}
