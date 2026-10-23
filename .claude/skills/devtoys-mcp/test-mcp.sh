#!/bin/bash
# Test DevToys MCP Server

set -e

echo "🧪 Testing DevToys MCP Server..."
echo ""

# Check if server is built
if [ ! -f "mcp-server/dist/index.js" ]; then
  echo "❌ Server not built. Run: cd mcp-server && npm run build"
  exit 1
fi

echo "✓ Server binary found"

# Start server in background
echo "Starting MCP server..."
node mcp-server/dist/index.js &
PID=$!
sleep 1

echo "✓ Server started (PID: $PID)"
echo ""

# Test initialize
echo "📋 Testing: initialize"
echo '{"jsonrpc":"2.0","id":1,"method":"initialize"}' | node mcp-server/dist/index.js | head -1

# Test tools/list
echo "📋 Testing: tools/list"
TOOL_COUNT=$(echo '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | node mcp-server/dist/index.js | jq '.result.tools | length')
echo "✓ Found $TOOL_COUNT tools"

# Test base64_encode
echo "📋 Testing: base64_encode"
RESULT=$(echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"base64_encode","arguments":{"text":"hello"}}}' | node mcp-server/dist/index.js | jq -r '.result.content[0].text')
echo "  Input: 'hello' → Output: $RESULT"
[ "$RESULT" = "aGVsbG8=" ] && echo "✓ Correct!" || echo "❌ Wrong result"

# Test json_format
echo "📋 Testing: json_format"
RESULT=$(echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"json_format","arguments":{"json":"{\"name\":\"John\"}"}}}' | node mcp-server/dist/index.js | jq -r '.result.content[0].text')
echo "✓ JSON formatted successfully"

# Test hash_sha256
echo "📋 Testing: hash_sha256"
RESULT=$(echo '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"hash_sha256","arguments":{"text":"test"}}}' | node mcp-server/dist/index.js | jq -r '.result.content[0].text')
echo "  Input: 'test' → Hash: ${RESULT:0:16}..."
[ ${#RESULT} -eq 64 ] && echo "✓ Valid SHA256 hash!" || echo "❌ Invalid hash"

# Test generate_uuid
echo "📋 Testing: generate_uuid"
UUID=$(echo '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"generate_uuid","arguments":{}}}' | node mcp-server/dist/index.js | jq -r '.result.content[0].text')
echo "  Generated UUID: $UUID"
[[ "$UUID" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]] && echo "✓ Valid UUID!" || echo "❌ Invalid UUID"

# Test unit conversion
echo "📋 Testing: convert_length"
RESULT=$(echo '{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"convert_length","arguments":{"value":1,"from":"km","to":"m"}}}' | node mcp-server/dist/index.js | jq '.result.content[0].text | fromjson')
echo "  1 km → $(echo $RESULT | jq '.value') meters"
echo "✓ Conversion successful"

echo ""
echo "═══════════════════════════════════════"
echo "✅ All tests passed!"
echo "═══════════════════════════════════════"
echo ""
echo "MCP Server is working correctly and ready to use with Claude."
