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
		key: 'dateTime',
		tools: [
			{ id: 'datetime' },
			{ id: 'timezone-converter' },
			{ id: 'date-calculator' },
		]
	},
	{
		key: 'text',
		tools: [
			{ id: 'text-generator' },
			{ id: 'text-prettier' },
			{ id: 'diff-viewer' },
			{ id: 'regex-tester' },
			{ id: 'markdown-viewer' },
		]
	},
	{
		key: 'format',
		tools: [
			{ id: 'json-formatter' },
			{ id: 'vardump-formatter' },
			{ id: 'sql-formatter' },
			{ id: 'xml-to-yaml' },
			{ id: 'base64' },
			{ id: 'color-converter' },
		]
	},
	{
		key: 'security',
		tools: [
			{ id: 'htpasswd' },
			{ id: 'hash-generator' },
			{ id: 'password-generator' },
		]
	},
	{
		key: 'generator',
		tools: [
			{ id: 'mysql-export-import' },
			{ id: 'cron-builder' },
			{ id: 'curl-to-code' },
			{ id: 'favicon-generator' },
			{ id: 'qr-code-generator' },
			{ id: 'random-int' },
			{ id: 'random-value' },
		]
	},
	{
		key: 'analyzer',
		tools: [
			{ id: 'error-log' },
			{ id: 'access-log' },
			{ id: 'ip-info' },
			{ id: 'csv-viewer' },
			{ id: 'schema-analyzer' },
			{ id: 'svg-viewer' },
		]
	},
	{
		key: 'frontend',
		tools: [
			{ id: 'aspect-ratio-calculator' },
			{ id: 'border-radius-generator' },
			{ id: 'css-grid-generator' },
			{ id: 'css-flex-generator' },
			{ id: 'color-contrast-checker' },
		]
	},
];

export function findTool(id: string): Tool | undefined {
	for (const cat of categories) {
		const tool = cat.tools.find((t) => t.id === id);
		if (tool) return tool;
	}
}
