// src/server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// src/tools.ts
import { z } from "zod";

// src/state.ts
import fs from "fs/promises";
import path from "path";
import os from "os";
var STATE_DIR = path.join(os.homedir(), ".claude-pet");
var STATE_PATH = path.join(STATE_DIR, "state.json");
async function loadState() {
  try {
    const data = await fs.readFile(STATE_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}
async function saveState(state) {
  await fs.mkdir(STATE_DIR, { recursive: true });
  const tmp = STATE_PATH + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(state, null, 2));
  await fs.rename(tmp, STATE_PATH);
}

// src/engine.ts
function resolveState(raw) {
  const now = Date.now();
  const hunger = Math.min(100, (now - raw.lastFeed) / 36e3);
  const mood = Math.max(0, raw.moodBase - Math.floor((now - raw.lastActivity) / 36e5));
  let state;
  if (hunger > 70) state = "hungry";
  else if (mood < 20) state = "sleeping";
  else if (mood > 80) state = "happy";
  else state = "idle";
  return { ...raw, hunger, mood, state };
}
function createDefaultState(type, name) {
  const now = Date.now();
  return {
    type,
    name,
    xp: 0,
    level: 1,
    hungerAtLastFeed: 0,
    moodBase: 80,
    lastActivity: now,
    lastFeed: now,
    pendingLevelUp: false,
    createdAt: now
  };
}
function addXP(raw, amount) {
  const newXP = raw.xp + amount;
  const newLevel = Math.floor(Math.sqrt(newXP / 10)) + 1;
  const pendingLevelUp = newLevel > raw.level;
  return { ...raw, xp: newXP, level: newLevel, pendingLevelUp: pendingLevelUp || raw.pendingLevelUp };
}
function feed(raw) {
  const now = Date.now();
  const resolved = resolveState(raw);
  return {
    ...raw,
    hungerAtLastFeed: resolved.hunger,
    lastFeed: now,
    moodBase: Math.min(100, raw.moodBase + 10)
  };
}

// src/renderer.ts
function renderToAnsi(frame, colors2) {
  const rows = [...frame];
  while (rows.length < 32) rows.push(".".repeat(32));
  const lines = [];
  for (let y = 0; y < 32; y += 2) {
    const topRow = rows[y];
    const botRow = rows[y + 1] ?? ".".repeat(32);
    const width = Math.max(topRow.length, botRow.length);
    let line = "";
    for (let x = 0; x < width; x++) {
      const topChar = topRow[x] ?? ".";
      const botChar = botRow[x] ?? ".";
      const topColor = colors2[topChar];
      const botColor = colors2[botChar];
      if (!topColor && !botColor) {
        line += "  ";
      } else if (topColor && botColor) {
        line += `\x1B[38;2;${topColor[0]};${topColor[1]};${topColor[2]}m\x1B[48;2;${botColor[0]};${botColor[1]};${botColor[2]}m\u2580`;
      } else if (topColor && !botColor) {
        line += `\x1B[38;2;${topColor[0]};${topColor[1]};${topColor[2]}m\x1B[49m\u2580`;
      } else if (!topColor && botColor) {
        line += `\x1B[38;2;${botColor[0]};${botColor[1]};${botColor[2]}m\x1B[49m\u2584`;
      }
    }
    lines.push(line + "\x1B[0m");
  }
  return lines.join("\n");
}

// src/pets/cat.ts
var colors = {
  "2": [238, 165, 68],
  "3": [218, 140, 52],
  "4": [188, 112, 38],
  "5": [148, 78, 22],
  "w": [252, 248, 242],
  "W": [238, 232, 224],
  "k": [22, 22, 28],
  "e": [82, 185, 58],
  "E": [58, 142, 38],
  "h": [255, 255, 255],
  "n": [55, 40, 38],
  "p": [222, 148, 142],
  "P": [205, 128, 122],
  "M": [195, 118, 42],
  "g": [200, 192, 182]
};
var idle0 = [
  "................................",
  "......3..............3..........",
  ".....33..............33.........",
  "....333..............333........",
  "...3P33..............33P3.......",
  "..33p333............333p33.....",
  "..333333333333333333333333.....",
  "..335533355335533553355333.....",
  "..333333333333333333333333.....",
  "..33heE333333333333Eeh3333.....",
  "..33hkE333333333333Ekh3333.....",
  "..333eE333333333333Ee33333.....",
  "..333333333333333333333333.....",
  "...33333333333333333333333.....",
  "...333333333333333333333.......",
  "....33333333pnp333333333.......",
  "....3333g333p.p333g33333.......",
  ".....333333MwwwM3333333........",
  ".....33333wwwwwww33333.........",
  "....3335wwwwwwwwwww5333........",
  "...33355wwwwwwwwwww55333.......",
  "..333553wwwwwwwwwww355333......",
  "..555333wwwwwwwwwww333555......",
  ".3553333wwwwwwwwwww3333553.....",
  ".35533333wwwwwwwww33333553.....",
  "..5533333333www3333333355......",
  "..553333333333333333333553.....",
  "...553333333333333333355.......",
  "...5533333......3333355........",
  "....3wW33........33Ww3.........",
  ".....ww3..........3ww..........",
  "................................"
];
var idle1 = idle0.map((row, i) => {
  if (i === 9) return row.replace(/heE/g, "3-3").replace(/Eeh/g, "3-3");
  if (i === 10) return row.replace(/hkE/g, "3-3").replace(/Ekh/g, "3-3");
  if (i === 11) return row.replace(/eE/g, "33").replace(/Ee/g, "33");
  return row;
});
var CAT_DEFINITION = {
  type: "cat",
  defaultName: "\u5C0F\u6A58",
  colors,
  frames: {
    idle: [idle0, idle1],
    happy: [idle0, idle1],
    hungry: [idle0, idle1],
    sleeping: [idle0, idle1]
  }
};

// src/pets/index.ts
var PLACEHOLDER_FRAME = Array(32).fill(".".repeat(32));
var DOG_COLORS = { d: [180, 130, 70], w: [252, 248, 242] };
var RABBIT_COLORS = { r: [240, 220, 220], w: [255, 255, 255] };
var DOG_DEFINITION = {
  type: "dog",
  defaultName: "\u5C0F\u67F4",
  colors: DOG_COLORS,
  frames: {
    idle: [PLACEHOLDER_FRAME, PLACEHOLDER_FRAME],
    happy: [PLACEHOLDER_FRAME, PLACEHOLDER_FRAME],
    hungry: [PLACEHOLDER_FRAME, PLACEHOLDER_FRAME],
    sleeping: [PLACEHOLDER_FRAME, PLACEHOLDER_FRAME]
  }
};
var RABBIT_DEFINITION = {
  type: "rabbit",
  defaultName: "\u5C0F\u5154",
  colors: RABBIT_COLORS,
  frames: {
    idle: [PLACEHOLDER_FRAME, PLACEHOLDER_FRAME],
    happy: [PLACEHOLDER_FRAME, PLACEHOLDER_FRAME],
    hungry: [PLACEHOLDER_FRAME, PLACEHOLDER_FRAME],
    sleeping: [PLACEHOLDER_FRAME, PLACEHOLDER_FRAME]
  }
};
var PETS = {
  cat: CAT_DEFINITION,
  dog: DOG_DEFINITION,
  rabbit: RABBIT_DEFINITION
};

// src/tools.ts
var PET_TYPES = ["cat", "dog", "rabbit"];
function notAdopted() {
  return "\u5C1A\u672A\u9886\u517B\u5BA0\u7269\uFF0C\u8BF7\u5148\u4F7F\u7528 /pet switch <type> \u9886\u517B\u3002\u53EF\u9009\uFF1A" + PET_TYPES.join(", ");
}
function registerTools(server2) {
  server2.tool("pet_show", "\u663E\u793A\u5BA0\u7269\u50CF\u7D20\u753B", {}, async () => {
    const raw = await loadState();
    if (!raw) return { content: [{ type: "text", text: notAdopted() }] };
    const resolved = resolveState(raw);
    const pet = PETS[raw.type];
    const frames = pet.frames[resolved.state] ?? pet.frames["idle"];
    const frame = frames[0];
    const ansi = renderToAnsi(frame, pet.colors);
    return { content: [{ type: "text", text: ansi }] };
  });
  server2.tool("pet_feed", "\u5582\u98DF\u5BA0\u7269", {}, async () => {
    const raw = await loadState();
    if (!raw) return { content: [{ type: "text", text: notAdopted() }] };
    let updated = feed(raw);
    updated = addXP(updated, 10);
    await saveState(updated);
    const resolved = resolveState(updated);
    return {
      content: [{
        type: "text",
        text: `\u5DF2\u5582\u98DF ${updated.name}\uFF01\u9965\u997F\u5EA6: ${Math.round(resolved.hunger)}/100, \u5FC3\u60C5: ${Math.round(resolved.mood)}/100, XP +10`
      }]
    };
  });
  server2.tool("pet_status", "\u67E5\u770B\u5BA0\u7269\u72B6\u6001", {}, async () => {
    const raw = await loadState();
    if (!raw) return { content: [{ type: "text", text: notAdopted() }] };
    const resolved = resolveState(raw);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          name: resolved.name,
          type: resolved.type,
          level: resolved.level,
          xp: resolved.xp,
          hunger: Math.round(resolved.hunger),
          mood: Math.round(resolved.mood),
          state: resolved.state,
          pendingLevelUp: resolved.pendingLevelUp,
          createdAt: resolved.createdAt
        }, null, 2)
      }]
    };
  });
  server2.tool(
    "pet_switch",
    "\u5207\u6362/\u9886\u517B\u5BA0\u7269",
    { type: z.enum(["cat", "dog", "rabbit"]).describe("\u5BA0\u7269\u7C7B\u578B"), name: z.string().optional().describe("\u5BA0\u7269\u540D\u5B57") },
    async ({ type, name }) => {
      const pet = PETS[type];
      const petName = name ?? pet.defaultName;
      const state = createDefaultState(type, petName);
      await saveState(state);
      return { content: [{ type: "text", text: `\u6210\u529F\u9886\u517B\u4E86 ${petName}\uFF08${type}\uFF09\uFF01\u8F93\u5165 /pet \u67E5\u770B\u4F60\u7684\u5BA0\u7269\u3002` }] };
    }
  );
  server2.tool(
    "pet_rename",
    "\u91CD\u547D\u540D\u5BA0\u7269",
    { name: z.string().describe("\u65B0\u540D\u5B57") },
    async ({ name }) => {
      const raw = await loadState();
      if (!raw) return { content: [{ type: "text", text: notAdopted() }] };
      const updated = { ...raw, name };
      await saveState(updated);
      return { content: [{ type: "text", text: `\u5BA0\u7269\u5DF2\u66F4\u540D\u4E3A\u300C${name}\u300D\uFF01` }] };
    }
  );
}

// src/server.ts
var server = new McpServer({
  name: "claude-pet",
  version: "1.0.0"
});
registerTools(server);
var transport = new StdioServerTransport();
await server.connect(transport);
