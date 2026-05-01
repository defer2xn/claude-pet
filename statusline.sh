#!/bin/bash
STATE="$HOME/.claude-pet/state.json"
[ ! -f "$STATE" ] && exit 0

jq -r '
  "\(if .type == "cat" then "🐱"
    elif .type == "dog" then "🐕"
    elif .type == "rabbit" then "🐰"
    else "❓" end) \(.name) Lv.\(.level) ❤\(.moodBase)% ✨\(.xp)XP"
' "$STATE"
