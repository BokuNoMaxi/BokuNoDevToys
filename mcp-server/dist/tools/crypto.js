import crypto from 'crypto';
export function hashMD5(text) {
    return crypto.createHash('md5').update(text).digest('hex');
}
export function hashSHA1(text) {
    return crypto.createHash('sha1').update(text).digest('hex');
}
export function hashSHA256(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}
export function hashSHA512(text) {
    return crypto.createHash('sha512').update(text).digest('hex');
}
export function generateUUID() {
    return crypto.randomUUID();
}
export function generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
}
export const cryptoTools = [
    {
        name: 'hash_md5',
        description: 'Generate MD5 hash',
        inputSchema: {
            type: 'object',
            properties: {
                text: { type: 'string', description: 'Text to hash' }
            },
            required: ['text']
        }
    },
    {
        name: 'hash_sha256',
        description: 'Generate SHA256 hash',
        inputSchema: {
            type: 'object',
            properties: {
                text: { type: 'string', description: 'Text to hash' }
            },
            required: ['text']
        }
    },
    {
        name: 'hash_sha512',
        description: 'Generate SHA512 hash',
        inputSchema: {
            type: 'object',
            properties: {
                text: { type: 'string', description: 'Text to hash' }
            },
            required: ['text']
        }
    },
    {
        name: 'generate_uuid',
        description: 'Generate UUID v4',
        inputSchema: {
            type: 'object',
            properties: {}
        }
    },
    {
        name: 'generate_random_string',
        description: 'Generate random string',
        inputSchema: {
            type: 'object',
            properties: {
                length: { type: 'number', description: 'String length (default: 32)' }
            }
        }
    }
];
export async function handleCryptoTool(toolName, args) {
    try {
        switch (toolName) {
            case 'hash_md5':
                return hashMD5(args.text);
            case 'hash_sha256':
                return hashSHA256(args.text);
            case 'hash_sha512':
                return hashSHA512(args.text);
            case 'generate_uuid':
                return generateUUID();
            case 'generate_random_string':
                return generateRandomString(typeof args.length === 'number' ? args.length : 32);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }
    catch (error) {
        throw new Error(`Crypto error: ${error.message}`);
    }
}
//# sourceMappingURL=crypto.js.map