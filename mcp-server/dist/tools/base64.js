export function encodeBase64(text) {
    return Buffer.from(text, 'utf-8').toString('base64');
}
export function decodeBase64(base64) {
    return Buffer.from(base64, 'base64').toString('utf-8');
}
export const base64Tools = [
    {
        name: 'base64_encode',
        description: 'Encode text to Base64',
        inputSchema: {
            type: 'object',
            properties: {
                text: { type: 'string', description: 'Text to encode' }
            },
            required: ['text']
        }
    },
    {
        name: 'base64_decode',
        description: 'Decode Base64 to text',
        inputSchema: {
            type: 'object',
            properties: {
                base64: { type: 'string', description: 'Base64 string to decode' }
            },
            required: ['base64']
        }
    }
];
export async function handleBase64Tool(toolName, args) {
    try {
        if (toolName === 'base64_encode') {
            return encodeBase64(args.text);
        }
        else if (toolName === 'base64_decode') {
            return decodeBase64(args.base64);
        }
        throw new Error(`Unknown tool: ${toolName}`);
    }
    catch (error) {
        throw new Error(`Base64 error: ${error.message}`);
    }
}
//# sourceMappingURL=base64.js.map