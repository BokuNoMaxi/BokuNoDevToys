export interface Tool {
	id: string;
	name: string;
	description: string;
}

export interface Category {
	name: string;
	tools: Tool[];
}

export const categories: Category[] = [
	{
		name: 'Date & Time',
		tools: [
			{ id: 'datetime', name: 'DateTime Converter', description: 'Convert between timestamps and human-readable dates' }
		]
	},
	{
		name: 'Text',
		tools: [
			{ id: 'lorem-ipsum', name: 'Lorem Ipsum Generator', description: 'Generate placeholder text' }
		]
	},
	{
		name: 'Web Server',
		tools: [
			{ id: 'htpasswd', name: 'htpasswd Generator', description: 'Generate htpasswd entries and .htaccess rules' }
		]
	},
	{
		name: 'Encoding',
		tools: [
			{ id: 'base64', name: 'Base64 Encoder', description: 'Encode/decode text and images as Base64' }
		]
	}
];

export function findTool(id: string): Tool | undefined {
	for (const cat of categories) {
		const tool = cat.tools.find((t) => t.id === id);
		if (tool) return tool;
	}
}
