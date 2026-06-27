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
			{ id: 'text-generator', name: 'Text Generator', description: 'Placeholder-Text in verschiedenen Stilen generieren' }
		]
	},
	{
		name: 'Web Server',
		tools: [
			{ id: 'htpasswd', name: 'htpasswd Generator', description: 'Generate htpasswd entries and .htaccess rules' }
		]
	},
	{
		name: 'Format',
		tools: [
			{ id: 'json-formatter', name: 'JSON Formatter', description: 'JSON einfügen, schön formatiert und kollabierbar anzeigen' },
			{ id: 'vardump-formatter', name: 'var_dump Formatter', description: 'PHP var_dump Output einfügen und als Baum lesen' }
		]
	},
	{
		name: 'Datenbank',
		tools: [
			{ id: 'mysql-export-import', name: 'MySQL Export / Import', description: 'mysqldump & mysql Befehle aus Verbindungsparametern oder .env generieren' }
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
