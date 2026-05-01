#!/bin/bash
set -e

echo "🗑️  卸载 Claude Pet..."

claude mcp remove claude-pet 2>/dev/null || true

echo "✅ MCP Server 已移除"
echo ""
echo "如需清理数据，请手动删除："
echo "  rm -rf ~/.claude-pet"
echo "  rm -rf ~/.claude/skills/pet"
