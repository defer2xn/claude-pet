#!/bin/bash
set -e
PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"
PET_DIR="$HOME/.claude-pet"
SETTINGS="$HOME/.claude/settings.json"

echo "🐾 安装 Claude Pet..."

# 1. 安装依赖并构建
echo "  [1/5] 构建项目..."
cd "$PLUGIN_DIR" && npm install --silent && npm run build

# 2. 创建数据目录
mkdir -p "$PET_DIR"

# 3. 注册 MCP Server（使用 claude mcp add）
echo "  [2/5] 注册 MCP Server..."
claude mcp add claude-pet -- node "$PLUGIN_DIR/dist/server.js" 2>/dev/null || {
  echo "  ⚠️  claude mcp add 失败，回退到手动注册..."
  [ ! -f "$SETTINGS" ] && echo '{}' > "$SETTINGS"
  jq --arg dir "$PLUGIN_DIR" '
    .mcpServers["claude-pet"] = {
      "command": "node",
      "args": [$dir + "/dist/server.js"]
    }
  ' "$SETTINGS" > "${SETTINGS}.tmp" && mv "${SETTINGS}.tmp" "$SETTINGS"
}

# 4. 复制 skill
echo "  [3/5] 安装 /pet skill..."
SKILL_DIR="$HOME/.claude/skills"
mkdir -p "$SKILL_DIR"
cp -r "$PLUGIN_DIR/skills/pet" "$SKILL_DIR/"

# 5. 合并 hooks（追加，不覆盖已有）
echo "  [4/5] 注册 hooks..."
[ ! -f "$SETTINGS" ] && echo '{}' > "$SETTINGS"
jq --arg dir "$PLUGIN_DIR" '
  # 检查是否已注册过（避免重复追加）
  def has_pet_hook($arr): ($arr // []) | any(.. | strings | test("pet-tick"));

  (if has_pet_hook(.hooks.PostToolUse) then . else
    .hooks.PostToolUse = ((.hooks.PostToolUse // []) + [{
      "matcher": ".*",
      "hooks": [{"type": "command", "command": ("bash " + $dir + "/hooks/pet-tick.sh tool_use"), "timeout": 3}]
    }])
  end) |
  (if has_pet_hook(.hooks.Stop) then . else
    .hooks.Stop = ((.hooks.Stop // []) + [{
      "hooks": [{"type": "command", "command": ("bash " + $dir + "/hooks/pet-tick.sh task_complete"), "timeout": 3}]
    }])
  end) |
  (if has_pet_hook(.hooks.SessionStart) then . else
    .hooks.SessionStart = ((.hooks.SessionStart // []) + [{
      "hooks": [{"type": "command", "command": ("bash " + $dir + "/hooks/pet-tick.sh session_start"), "timeout": 3}]
    }])
  end)
' "$SETTINGS" > "${SETTINGS}.tmp" && mv "${SETTINGS}.tmp" "$SETTINGS"

# 6. Statusline 提示（不覆盖已有配置）
echo "  [5/5] 检查 statusline..."
HAS_STATUSLINE=$(jq 'has("statusLine")' "$SETTINGS" 2>/dev/null || echo "false")
if [ "$HAS_STATUSLINE" = "true" ]; then
  echo "  ℹ️  已有 statusLine 配置，跳过（不覆盖）"
else
  jq --arg dir "$PLUGIN_DIR" '
    .statusLine = {
      "type": "command",
      "command": ($dir + "/statusline.sh"),
      "refreshInterval": 5
    }
  ' "$SETTINGS" > "${SETTINGS}.tmp" && mv "${SETTINGS}.tmp" "$SETTINGS"
  echo "  ✅ statusLine 已配置"
fi

echo ""
echo "✅ 安装完成！重启 CC 后输入 /pet switch cat 领养你的第一只宠物"
echo ""
echo "可用命令："
echo "  /pet             查看宠物"
echo "  /pet feed        喂食"
echo "  /pet status      状态面板"
echo "  /pet switch cat  领养/切换宠物"
echo "  /pet name 小橘   重命名"
