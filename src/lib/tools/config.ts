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
		]
	},
	{
		key: 'webServer',
		tools: [
			{ id: 'htpasswd' },
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
		key: 'database',
		tools: [
			{ id: 'mysql-export-import' },
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
];

export function findTool(id: string): Tool | undefined {
	for (const cat of categories) {
		const tool = cat.tools.find((t) => t.id === id);
		if (tool) return tool;
	}
}
