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
mkdir -p "$HOME/.claude"
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

# 5. 合并 hooks 到 settings.json
jq --arg dir "$PLUGIN_DIR" '
  .hooks.PostToolUse = ((.hooks.PostToolUse // []) + [{
    "matcher": ".*",
    "hooks": [{"type": "command", "command": ("bash " + $dir + "/hooks/pet-tick.sh tool_use"), "timeout": 3}]
  }]) |
  .hooks.Stop = ((.hooks.Stop // []) + [{
    "hooks": [{"type": "command", "command": ("bash " + $dir + "/hooks/pet-tick.sh task_complete"), "timeout": 3}]
  }]) |
  .hooks.SessionStart = ((.hooks.SessionStart // []) + [{
    "hooks": [{"type": "command", "command": ("bash " + $dir + "/hooks/pet-tick.sh session_start"), "timeout": 3}]
  }])
' "$SETTINGS" > "${SETTINGS}.tmp" && mv "${SETTINGS}.tmp" "$SETTINGS"

# 6. 配置 Statusline
jq --arg dir "$PLUGIN_DIR" '
  .statusLine = {
    "type": "command",
    "command": ($dir + "/statusline.sh"),
    "refreshInterval": 5
  }
' "$SETTINGS" > "${SETTINGS}.tmp" && mv "${SETTINGS}.tmp" "$SETTINGS"

echo ""
echo "✅ 安装完成！重启 CC 后输入 /pet switch cat 领养你的第一只宠物"
