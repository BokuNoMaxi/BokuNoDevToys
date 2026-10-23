export declare function convertLength(value: number, from: string, to: string): number;
export declare function convertWeight(value: number, from: string, to: string): number;
export declare function convertTemperature(value: number, from: string, to: string): number;
export declare const unitTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            value: {
                type: string;
                description: string;
            };
            from: {
                type: string;
                description: string;
            };
            to: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
}[];
export declare function handleUnitTool(toolName: string, args: Record<string, string | number>): Promise<string>;
//# sourceMappingURL=units.d.ts.map