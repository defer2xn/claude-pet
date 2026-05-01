#!/bin/bash
set -e
PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🐾 安装 Claude Pet..."

cd "$PLUGIN_DIR" && npm run build

mkdir -p "$HOME/.claude-pet"

echo "✅ 构建完成！"
echo ""
echo "请执行以下命令注册 MCP Server："
echo "  claude mcp add claude-pet node $PLUGIN_DIR/dist/server.js"
echo ""
echo "请将 skills/pet 目录复制到 ~/.claude/skills/："
echo "  cp -r $PLUGIN_DIR/skills/pet ~/.claude/skills/"
echo ""
echo "安装完成后输入 /pet switch cat 领养你的第一只宠物"
