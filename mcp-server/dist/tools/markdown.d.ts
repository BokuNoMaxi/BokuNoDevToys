export declare function markdownToHtml(markdown: string): Promise<string>;
export declare const markdownTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            markdown: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
}[];
export declare function handleMarkdownTool(toolName: string, args: Record<string, string>): Promise<string>;
//# sourceMappingURL=markdown.d.ts.map