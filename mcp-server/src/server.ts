import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerConvertTools } from './tools/convert.js';
import { registerTextTools } from './tools/text.js';
import { registerGenerateTools } from './tools/generate.js';
import { registerCalcTools } from './tools/calc.js';
import { registerAnalyzeTools } from './tools/analyze.js';

export const SERVER_VERSION = '2.0.0';

export function createServer(): McpServer {
	const server = new McpServer(
		{ name: 'devtoys', title: 'BokuNo DevToys', version: SERVER_VERSION, websiteUrl: 'https://devtoys.bokunocompany.at/' },
		{
			instructions:
				'Stateless developer utilities from https://devtoys.bokunocompany.at/. Use them for deterministic text/data work ' +
				'(formatting, encoding, hashing, parsing, log and SEO analysis, date math) instead of computing it yourself. ' +
				'Tools never fetch URLs or store data; pass the content as arguments. The server clock and timezone are UTC.',
		}
	);
	registerConvertTools(server);
	registerTextTools(server);
	registerGenerateTools(server);
	registerCalcTools(server);
	registerAnalyzeTools(server);
	return server;
}
