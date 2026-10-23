import readline from 'readline';
import { getAllTools, executeTool } from './tools/index.js';

interface JSONRPCRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: Record<string, any>;
}

interface JSONRPCResponse {
  jsonrpc: string;
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

class MCPServer {
  private tools = getAllTools();

  constructor() {
    this.setupReadline();
  }

  private setupReadline() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', (line: string) => {
      try {
        const request = JSON.parse(line) as JSONRPCRequest;
        this.handleRequest(request).then((response) => {
          console.log(JSON.stringify(response));
        });
      } catch (error) {
        console.error('Parse error:', error);
      }
    });

    rl.on('close', () => {
      process.exit(0);
    });
  }

  async handleRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    try {
      switch (request.method) {
        case 'initialize':
          return this.handleInitialize(request);
        case 'tools/list':
          return this.handleToolsList(request);
        case 'tools/call':
          return this.handleToolCall(request);
        default:
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`
            }
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: `Internal error: ${(error as Error).message}`
        }
      };
    }
  }

  private handleInitialize(request: JSONRPCRequest): JSONRPCResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            listChanged: false
          }
        },
        serverInfo: {
          name: 'devtoys-mcp-server',
          version: '1.0.0'
        }
      }
    };
  }

  private handleToolsList(request: JSONRPCRequest): JSONRPCResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        tools: this.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      }
    };
  }

  private async handleToolCall(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    const { name, arguments: args } = request.params || {};

    if (!name || !args) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32602,
          message: 'Missing tool name or arguments'
        }
      };
    }

    try {
      const result = await executeTool(name, args);
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: result
            }
          ]
        }
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: `Tool execution failed: ${(error as Error).message}`
        }
      };
    }
  }
}

const server = new MCPServer();
console.error('[DevToys MCP Server] Started');
