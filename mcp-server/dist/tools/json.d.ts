export declare function formatJson(input: string, indent?: number): string;
export declare function minifyJson(input: string): string;
export declare function validateJson(input: string): boolean;
export declare const jsonTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            json: {
                type: string;
                description: string;
            };
            indent: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            json: {
                type: string;
                description: string;
            };
            indent?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleJsonTool(toolName: string, args: Record<string, string | number>): Promise<string>;
//# sourceMappingURL=json.d.ts.map