#!/bin/bash
STATE="$HOME/.claude-pet/state.json"
[ ! -f "$STATE" ] && exit 0

EVENT="$1"
TMP="${STATE}.tmp"
NOW=$(date +%s000)

case "$EVENT" in
  tool_use)
    jq --arg now "$NOW" '
      .xp += 1 | .totalInteractions += 1 | .lastActivity = ($now | tonumber) |
      .level = (((.xp / 10) | sqrt | floor) + 1)
    ' "$STATE" > "$TMP" && mv "$TMP" "$STATE"
    ;;
  task_complete)
    jq --arg now "$NOW" '
      .previousLevel = .level |
      .xp += 5 | .lastActivity = ($now | tonumber) |
      .level = (((.xp / 10) | sqrt | floor) + 1) |
      if .level > .previousLevel then .pendingLevelUp = true else . end
    ' "$STATE" > "$TMP" && mv "$TMP" "$STATE"

    LEVELED=$(jq -r '.pendingLevelUp' "$STATE")
    if [ "$LEVELED" = "true" ]; then
      NAME=$(jq -r '.name' "$STATE")
      OLD=$(jq -r '.previousLevel' "$STATE")
      NEW=$(jq -r '.level' "$STATE")
      echo "{\"continue\":true,\"systemMessage\":\"🎉 $NAME 升级了！Lv.$OLD → Lv.$NEW！\"}"
      jq '.pendingLevelUp = false' "$STATE" > "$TMP" && mv "$TMP" "$STATE"
    fi
    ;;
  session_start)
    HUNGER=$(jq --arg now "$NOW" -r '
      (($now | tonumber) - .lastFeed) / 60000 | floor as $mins |
      [0, .hungerAtLastFeed - $mins] | max
    ' "$STATE")

    if [ "$HUNGER" -lt 30 ] 2>/dev/null; then
      NAME=$(jq -r '.name' "$STATE")
      echo "{\"continue\":true,\"systemMessage\":\"🍽️ $NAME 饿了！饥饿度: $HUNGER/100。输入 /pet feed 喂食\"}"
    fi

    jq --arg now "$NOW" '.lastActivity = ($now | tonumber)' "$STATE" > "$TMP" && mv "$TMP" "$STATE"
    ;;
esac
