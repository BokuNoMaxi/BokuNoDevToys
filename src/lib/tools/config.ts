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
		]
	},
	{
		key: 'format',
		tools: [
			{ id: 'json-formatter' },
			{ id: 'vardump-formatter' },
		]
	},
	{
		key: 'encoding',
		tools: [
			{ id: 'base64' },
		]
	},
	{
		key: 'randomizer',
		tools: [
			{ id: 'random-int' },
			{ id: 'random-value' },
		]
	},
	{
		key: 'generator',
		tools: [
			{ id: 'htpasswd' },
			{ id: 'mysql-export-import' },
			{ id: 'hash-generator' },
			{ id: 'cron-builder' },
		]
	},
	{
		key: 'analyzer',
		tools: [
			{ id: 'error-log' },
			{ id: 'access-log' },
			{ id: 'ip-info' },
			{ id: 'csv-viewer' },
		]
	},
];

export function findTool(id: string): Tool | undefined {
	for (const cat of categories) {
		const tool = cat.tools.find((t) => t.id === id);
		if (tool) return tool;
	}
}
