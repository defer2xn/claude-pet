#!/bin/bash
STATE="$HOME/.claude-pet/state.json"
[ ! -f "$STATE" ] && echo "🥚 /pet switch 领养宠物" && exit 0

VISIBLE=$(jq -r '.visible // true' "$STATE")
[ "$VISIBLE" = "false" ] && exit 0

NOW=$(date +%s000)
jq -r --arg now "$NOW" '
  # 懒求值饥饿度
  (($now | tonumber) - .lastFeed) / 60000 | floor as $mins |
  ([0, .hungerAtLastFeed - $mins] | max) as $hunger |

  # 懒求值心情
  (($now | tonumber) - .lastActivity) / 60000 as $idle_mins |
  (if $hunger < 30 then $idle_mins * 0.5 else $idle_mins * 0.1 end) as $decay |
  ([0, [100, .moodBase - $decay] | min] | max | floor) as $mood |

  # 心情表情
  (if $hunger < 30 then "😟" elif $mood < 40 then "😐" elif $mood > 80 then "😊" else "🙂" end) as $face |

  # 宠物 emoji
  (if .type == "cat" then "🐱"
   elif .type == "shiba" then "🐕"
   elif .type == "penguin" then "🐧"
   elif .type == "hamster" then "🐹"
   elif .type == "slime" then "🟢"
   else "❓" end) as $pet |

  # 状态图标
  (if .pendingLevelUp then "⬆️"
   elif $idle_mins > 10 then "💤"
   elif $hunger < 30 then "🍽️"
   else "" end) as $icon |

  # 饥饿度条（♥♡）
  (($hunger / 20) | floor) as $h |
  ([range($h)] | map("♥") | join("")) as $full |
  ([range(5 - $h)] | map("♡") | join("")) as $empty |

  "\($pet) \(.name) Lv.\(.level) \($full)\($empty) \($face) \($icon)"
' "$STATE"
