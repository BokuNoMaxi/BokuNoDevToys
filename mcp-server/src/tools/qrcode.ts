import QRCode from 'qrcode';

export async function generateQRCode(text: string, size: number = 200): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    return dataUrl;
  } catch (error) {
    throw new Error(`QR Code generation failed: ${(error as Error).message}`);
  }
}

export const qrcodeTools = [
  {
    name: 'generate_qrcode',
    description: 'Generate QR code from text/URL',
    inputSchema: {
      type: 'object' as const,
      properties: {
        text: { type: 'string', description: 'Text or URL to encode' },
        size: { type: 'number', description: 'QR code size in pixels (default: 200)' }
      },
      required: ['text']
    }
  }
];

export async function handleQRCodeTool(toolName: string, args: Record<string, string | number>): Promise<string> {
  try {
    if (toolName === 'generate_qrcode') {
      const size = typeof args.size === 'number' ? args.size : 200;
      return await generateQRCode(args.text as string, size);
    }
    throw new Error(`Unknown tool: ${toolName}`);
  } catch (error) {
    throw new Error(`QR Code error: ${(error as Error).message}`);
  }
}
