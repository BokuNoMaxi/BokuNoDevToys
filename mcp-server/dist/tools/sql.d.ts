export declare function formatSQL(sql: string, dialect?: string): string;
export declare const sqlTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            sql: {
                type: string;
                description: string;
            };
            dialect: {
                type: string;
                description: string;
                default: string;
            };
        };
        required: string[];
    };
}[];
export declare function handleSQLTool(toolName: string, args: Record<string, string>): Promise<string>;
//# sourceMappingURL=sql.d.ts.map