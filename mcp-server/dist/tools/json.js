export function formatJson(input, indent = 2) {
    try {
        const parsed = JSON.parse(input);
        return JSON.stringify(parsed, null, indent);
    }
    catch (error) {
        throw new Error(`Invalid JSON: ${error.message}`);
    }
}
export function minifyJson(input) {
    try {
        const parsed = JSON.parse(input);
        return JSON.stringify(parsed);
    }
    catch (error) {
        throw new Error(`Invalid JSON: ${error.message}`);
    }
}
export function validateJson(input) {
    try {
        JSON.parse(input);
        return true;
    }
    catch {
        return false;
    }
}
export const jsonTools = [
    {
        name: 'json_format',
        description: 'Format and pretty-print JSON',
        inputSchema: {
            type: 'object',
            properties: {
                json: { type: 'string', description: 'JSON string to format' },
                indent: { type: 'number', description: 'Indentation spaces (default: 2)' }
            },
            required: ['json']
        }
    },
    {
        name: 'json_minify',
        description: 'Minify JSON (remove whitespace)',
        inputSchema: {
            type: 'object',
            properties: {
                json: { type: 'string', description: 'JSON string to minify' }
            },
            required: ['json']
        }
    },
    {
        name: 'json_validate',
        description: 'Validate JSON syntax',
        inputSchema: {
            type: 'object',
            properties: {
                json: { type: 'string', description: 'JSON string to validate' }
            },
            required: ['json']
        }
    }
];
export async function handleJsonTool(toolName, args) {
    try {
        if (toolName === 'json_format') {
            const indent = typeof args.indent === 'number' ? args.indent : 2;
            return formatJson(args.json, indent);
        }
        else if (toolName === 'json_minify') {
            return minifyJson(args.json);
        }
        else if (toolName === 'json_validate') {
            const isValid = validateJson(args.json);
            return JSON.stringify({ valid: isValid });
        }
        throw new Error(`Unknown tool: ${toolName}`);
    }
    catch (error) {
        throw new Error(`JSON error: ${error.message}`);
    }
}
//# sourceMappingURL=json.js.map