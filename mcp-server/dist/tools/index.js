import { base64Tools, handleBase64Tool } from './base64.js';
import { jsonTools, handleJsonTool } from './json.js';
import { cryptoTools, handleCryptoTool } from './crypto.js';
import { textTools, handleTextTool } from './text.js';
import { qrcodeTools, handleQRCodeTool } from './qrcode.js';
import { markdownTools, handleMarkdownTool } from './markdown.js';
import { sqlTools, handleSQLTool } from './sql.js';
import { unitTools, handleUnitTool } from './units.js';
const toolCategories = [
    { tools: base64Tools, handler: handleBase64Tool },
    { tools: jsonTools, handler: handleJsonTool },
    { tools: cryptoTools, handler: handleCryptoTool },
    { tools: textTools, handler: handleTextTool },
    { tools: qrcodeTools, handler: handleQRCodeTool },
    { tools: markdownTools, handler: handleMarkdownTool },
    { tools: sqlTools, handler: handleSQLTool },
    { tools: unitTools, handler: handleUnitTool }
];
export function getAllTools() {
    return toolCategories.flatMap((cat) => cat.tools);
}
export async function executeTool(toolName, args) {
    for (const category of toolCategories) {
        if (category.tools.some((t) => t.name === toolName)) {
            return category.handler(toolName, args);
        }
    }
    throw new Error(`Tool not found: ${toolName}`);
}
//# sourceMappingURL=index.js.map