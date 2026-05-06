#!/bin/bash
STATE="$HOME/.claude-pet/state.json"
[ ! -f "$STATE" ] && exit 0
command -v jq >/dev/null 2>&1 || exit 0

EVENT="$1"
TMP="${STATE}.tmp"
NOW=$(date +%s000)

case "$EVENT" in
  tool_use)
    jq --arg now "$NOW" '
      (.level) as $old |
      .xp += 1 | .totalInteractions += 1 | .lastActivity = ($now | tonumber) |
      .level = (((.xp / 10) | sqrt | floor) + 1) |
      if .level > $old then .pendingLevelUp = true | .levelUpFrom = $old | .levelUpTo = .level else . end
    ' "$STATE" > "$TMP" && mv "$TMP" "$STATE"
    ;;
  task_complete)
    jq --arg now "$NOW" '
      (.level) as $old |
      .xp += 5 | .lastActivity = ($now | tonumber) |
      .level = (((.xp / 10) | sqrt | floor) + 1) |
      if .level > $old then .pendingLevelUp = true | .levelUpFrom = ($old // .levelUpFrom) | .levelUpTo = .level else . end
    ' "$STATE" > "$TMP" && mv "$TMP" "$STATE"

    jq -c 'if .pendingLevelUp then
      {continue: true, systemMessage: ("🎉 " + .name + " 升级了！Lv." + (.levelUpFrom | tostring) + " → Lv." + (.levelUpTo | tostring) + "！")}
    else empty end' "$STATE"

    if jq -e '.pendingLevelUp' "$STATE" >/dev/null 2>&1; then
      jq '.pendingLevelUp = false' "$STATE" > "$TMP" && mv "$TMP" "$STATE"
    fi
    ;;
  session_start)
    jq -c --arg now "$NOW" '
      (($now | tonumber) - .lastFeed) / 60000 | floor as $mins |
      [0, .hungerAtLastFeed - $mins] | max | . as $hunger |
      if $hunger < 30 then
        {continue: true, systemMessage: ("🍖 " + .name + " 饿了！饥饿度: " + ($hunger | tostring) + "/100。输入 /pet feed 喂食")}
      else empty end
    ' "$STATE"

    jq --arg now "$NOW" '.lastActivity = ($now | tonumber)' "$STATE" > "$TMP" && mv "$TMP" "$STATE"
    ;;
esac
