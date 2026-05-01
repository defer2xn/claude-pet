#!/bin/bash
set -e
PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"
PET_DIR="$HOME/.claude-pet"

echo "🐾 安装 Claude Pet..."

# 1. 安装依赖并构建
cd "$PLUGIN_DIR" && npm install && npm run build

# 2. 创建数据目录
mkdir -p "$PET_DIR"

# 3. 注册 MCP Server
SETTINGS="$HOME/.claude/settings.json"
[ ! -f "$SETTINGS" ] && echo '{}' > "$SETTINGS"
jq --arg dir "$PLUGIN_DIR" '
  .mcpServers["claude-pet"] = {
    "command": "node",
    "args": [$dir + "/dist/server.js"]
  }
' "$SETTINGS" > "${SETTINGS}.tmp" && mv "${SETTINGS}.tmp" "$SETTINGS"

# 4. 复制 skills
SKILL_DIR="$HOME/.claude/skills"
mkdir -p "$SKILL_DIR"
if [ -d "$PLUGIN_DIR/skills/pet" ]; then
  cp -r "$PLUGIN_DIR/skills/pet" "$SKILL_DIR/"
fi

# 5. 合并 hooks
sed "s|\${CLAUDE_PLUGIN_ROOT}|$PLUGIN_DIR|g" "$PLUGIN_DIR/hooks/hooks.json" > "$PET_DIR/hooks-resolved.json"
echo "⚠️  请手动将 $PET_DIR/hooks-resolved.json 中的 hooks 合并到 ~/.claude/settings.json"

# 6. Statusline 提示
echo "⚠️  状态栏配置（可选，加入 ~/.claude/settings.json）："
echo "  \"statusLine\": {"
echo "    \"type\": \"command\","
echo "    \"command\": \"$PLUGIN_DIR/statusline.sh\","
echo "    \"refreshInterval\": 5"
echo "  }"

echo ""
echo "✅ 安装完成！重启 CC 后输入 /pet switch cat 领养你的第一只宠物"
