import type { Translations } from '$lib/translations/en';

export interface Tool {
	id: string;
}

export interface Category {
	key: keyof Translations['cats'];
	tools: Tool[];
}

export const categories: Category[] = [
	{
		key: 'analyzer',
		tools: [
			{ id: 'access-log' },
			{ id: 'csv-viewer' },
			{ id: 'error-log' },
			{ id: 'ip-info' },
			{ id: 'schema-analyzer' },
			{ id: 'svg-viewer' },
		]
	},
	{
		key: 'dateTime',
		tools: [
			{ id: 'date-calculator' },
			{ id: 'datetime' },
			{ id: 'timezone-converter' },
		]
	},
	{
		key: 'format',
		tools: [
			{ id: 'base64' },
			{ id: 'color-converter' },
			{ id: 'json-formatter' },
			{ id: 'sql-formatter' },
			{ id: 'vardump-formatter' },
			{ id: 'xml-to-yaml' },
		]
	},
	{
		key: 'frontend',
		tools: [
			{ id: 'aspect-ratio-calculator' },
			{ id: 'border-radius-generator' },
			{ id: 'box-shadow-generator' },
			{ id: 'clip-path-generator' },
			{ id: 'color-contrast-checker' },
			{ id: 'color-palette-generator' },
			{ id: 'css-flex-generator' },
			{ id: 'css-grid-generator' },
			{ id: 'glassmorphism-generator' },
			{ id: 'gradient-generator' },
			{ id: 'unit-converter' },
		]
	},
	{
		key: 'generator',
		tools: [
			{ id: 'cron-builder' },
			{ id: 'curl-to-code' },
			{ id: 'favicon-generator' },
			{ id: 'mysql-export-import' },
			{ id: 'qr-code-generator' },
			{ id: 'random-int' },
			{ id: 'random-value' },
		]
	},
	{
		key: 'security',
		tools: [
			{ id: 'hash-generator' },
			{ id: 'htpasswd' },
			{ id: 'password-generator' },
		]
	},
	{
		key: 'text',
		tools: [
			{ id: 'diff-viewer' },
			{ id: 'markdown-viewer' },
			{ id: 'regex-tester' },
			{ id: 'text-generator' },
			{ id: 'text-prettier' },
		]
	},
];

export function findTool(id: string): Tool | undefined {
	for (const cat of categories) {
		const tool = cat.tools.find((t) => t.id === id);
		if (tool) return tool;
	}
}
