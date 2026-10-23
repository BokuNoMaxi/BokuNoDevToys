#!/bin/bash
# Setup DevToys MCP Server

set -e

echo "🚀 Setting up DevToys MCP Server..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed. Please install Node.js 18+"
  exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required, found: $(node --version)"
  exit 1
fi

echo "✓ Node.js $(node --version) found"
echo ""

# Install dependencies
echo "📦 Installing MCP server dependencies..."
cd mcp-server
npm install

# Build
echo "🔨 Building MCP server..."
npm run build

echo ""
echo "✓ Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Verify setup: bash .claude/skills/devtoys-mcp/test-mcp.sh"
echo "  2. Use in Claude: Just ask to encode/format/hash anything!"
echo ""
echo "Example:"
echo "  'Encode \"hello\" to Base64' → Claude uses base64_encode tool"
echo "  'Format this JSON: {\"name\":\"John\"}' → Claude uses json_format tool"
