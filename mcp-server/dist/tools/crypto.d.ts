export declare function hashMD5(text: string): string;
export declare function hashSHA1(text: string): string;
export declare function hashSHA256(text: string): string;
export declare function hashSHA512(text: string): string;
export declare function generateUUID(): string;
export declare function generateRandomString(length?: number): string;
export declare const cryptoTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            text: {
                type: string;
                description: string;
            };
            length?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            text?: undefined;
            length?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            length: {
                type: string;
                description: string;
            };
            text?: undefined;
        };
        required?: undefined;
    };
})[];
export declare function handleCryptoTool(toolName: string, args: Record<string, string | number>): Promise<string>;
//# sourceMappingURL=crypto.d.ts.map