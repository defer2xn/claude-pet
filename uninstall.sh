#!/bin/bash
set -e
PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🐾 卸载 Claude Pet..."

# 1. 从 settings.json 移除 MCP Server、hooks、statusline
SETTINGS="$HOME/.claude/settings.json"
if [ -f "$SETTINGS" ]; then
  jq --arg dir "$PLUGIN_DIR" '
    del(.mcpServers["claude-pet"]) |
    del(.statusLine) |
    if .hooks.PostToolUse then
      .hooks.PostToolUse = [.hooks.PostToolUse[] | select(.hooks[0].command | contains("pet-tick.sh") | not)]
    else . end |
    if .hooks.Stop then
      .hooks.Stop = [.hooks.Stop[] | select(.hooks[0].command | contains("pet-tick.sh") | not)]
    else . end |
    if .hooks.SessionStart then
      .hooks.SessionStart = [.hooks.SessionStart[] | select(.hooks[0].command | contains("pet-tick.sh") | not)]
    else . end |
    if .hooks.PostToolUse == [] then del(.hooks.PostToolUse) else . end |
    if .hooks.Stop == [] then del(.hooks.Stop) else . end |
    if .hooks.SessionStart == [] then del(.hooks.SessionStart) else . end |
    if .hooks == {} then del(.hooks) else . end
  ' "$SETTINGS" > "${SETTINGS}.tmp" && mv "${SETTINGS}.tmp" "$SETTINGS"
fi

# 2. 移除 skill
rm -rf "$HOME/.claude/skills/pet"

# 3. 提示用户是否删除宠物数据
echo ""
echo "✅ 插件配置已移除。"
echo ""
read -p "是否删除宠物存档（~/.claude-pet/）？[y/N] " CONFIRM
if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
  rm -rf "$HOME/.claude-pet"
  echo "🗑️  宠物数据已删除。"
else
  echo "📦 宠物数据保留在 ~/.claude-pet/"
fi
