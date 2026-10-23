export declare function encodeBase64(text: string): string;
export declare function decodeBase64(base64: string): string;
export declare const base64Tools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            text: {
                type: string;
                description: string;
            };
            base64?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            base64: {
                type: string;
                description: string;
            };
            text?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleBase64Tool(toolName: string, args: Record<string, string>): Promise<string>;
//# sourceMappingURL=base64.d.ts.map