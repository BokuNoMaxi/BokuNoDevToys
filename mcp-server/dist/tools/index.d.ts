export interface Tool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object' | string;
        properties: Record<string, any>;
        required?: string[];
    };
}
export interface ToolHandler {
    tools: Tool[];
    handler: (toolName: string, args: Record<string, any>) => Promise<string>;
}
export declare function getAllTools(): Tool[];
export declare function executeTool(toolName: string, args: Record<string, any>): Promise<string>;
//# sourceMappingURL=index.d.ts.map