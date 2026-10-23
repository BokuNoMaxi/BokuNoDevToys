export declare function generateQRCode(text: string, size?: number): Promise<string>;
export declare const qrcodeTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            text: {
                type: string;
                description: string;
            };
            size: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
}[];
export declare function handleQRCodeTool(toolName: string, args: Record<string, string | number>): Promise<string>;
//# sourceMappingURL=qrcode.d.ts.map