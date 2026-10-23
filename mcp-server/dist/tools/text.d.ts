export declare function urlEncode(text: string): string;
export declare function urlDecode(text: string): string;
export declare function htmlEncode(text: string): string;
export declare function htmlDecode(text: string): string;
export declare function reverseString(text: string): string;
export declare function countChars(text: string): Record<string, number>;
export declare const textTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            text: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
}[];
export declare function handleTextTool(toolName: string, args: Record<string, string>): Promise<string>;
//# sourceMappingURL=text.d.ts.map