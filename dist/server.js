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
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      return null;
    }
    throw new Error(`\u5BA0\u7269\u72B6\u6001\u6587\u4EF6\u635F\u574F\u6216\u4E0D\u53EF\u8BFB: ${STATE_PATH}`);
  }
}
async function saveState(state) {
  try {
    await fs.mkdir(STATE_DIR, { recursive: true });
    const tmp = STATE_PATH + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(state, null, 2));
    await fs.rename(tmp, STATE_PATH);
  } catch (err) {
    console.error(`\u4FDD\u5B58\u5BA0\u7269\u72B6\u6001\u5931\u8D25: ${err}`);
  }
}

// src/engine.ts
function resolveState(raw) {
  const now = Date.now();
  const minutesSinceLastFeed = (now - raw.lastFeed) / 6e4;
  const minutesSinceLastActivity = (now - raw.lastActivity) / 6e4;
  const hunger = Math.min(100, Math.max(0, raw.hungerAtLastFeed - Math.floor(minutesSinceLastFeed)));
  const moodDecay = hunger < 30 ? minutesSinceLastActivity * 0.5 : minutesSinceLastActivity * 0.1;
  const mood = Math.min(100, Math.max(0, raw.moodBase - moodDecay));
  let state;
  if (raw.pendingLevelUp) state = "levelup";
  else if (minutesSinceLastActivity > 10) state = "sleeping";
  else if (hunger < 30) state = "hungry";
  else if (minutesSinceLastFeed < 3) state = "happy";
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
    hungerAtLastFeed: 100,
    moodBase: 80,
    lastActivity: now,
    lastFeed: now,
    pendingLevelUp: false,
    previousLevel: 1,
    totalInteractions: 0,
    visible: true,
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
    hungerAtLastFeed: Math.min(100, resolved.hunger + 50),
    lastFeed: now,
    lastActivity: now,
    moodBase: Math.min(100, raw.moodBase + 20)
  };
}

// src/renderer.ts
function renderToAnsi(frame, colors6) {
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
      const topColor = colors6[topChar];
      const botColor = colors6[botChar];
      if (!topColor && !botColor) {
        line += " ";
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
  "g": [200, 192, 182],
  "x": [255, 220, 60],
  "z": [160, 180, 220]
};
var idle0 = [
  "................................",
  "......3..............3..........",
  ".....33..............33.........",
  "....333..............333........",
  "...3P33..............33P3.......",
  "..33p333............333p33......",
  "..333333333333333333333333......",
  "..335533355335533553355333......",
  "..333333333333333333333333......",
  "..33heE333333333333Eeh3333......",
  "..33hkE333333333333Ekh3333......",
  "..333eE333333333333Ee33333......",
  "..333333333333333333333333......",
  "...33333333333333333333333......",
  "...333333333333333333333........",
  "....33333333pnp333333333........",
  "....3333g333p.p333g33333........",
  ".....333333MwwwM3333333.........",
  ".....33333wwwwwww33333..........",
  "....3335wwwwwwwwwww5333.........",
  "...33355wwwwwwwwwww55333........",
  "..333553wwwwwwwwwww355333.......",
  "..555333wwwwwwwwwww333555.......",
  ".3553333wwwwwwwwwww3333553......",
  ".35533333wwwwwwwww33333553......",
  "..5533333333www3333333355.......",
  "..553333333333333333333553......",
  "...553333333333333333355........",
  "...5533333......3333355.........",
  "....3wW33........33Ww3..........",
  ".....ww3..........3ww...........",
  "................................"
];
var idle1 = idle0.map((row, i) => {
  if (i === 9) return row.replace(/heE/g, "3-3").replace(/Eeh/g, "3-3");
  if (i === 10) return row.replace(/hkE/g, "3-3").replace(/Ekh/g, "3-3");
  if (i === 11) return row.replace(/eE/g, "33").replace(/Ee/g, "33");
  return row;
});
var happy0 = idle0.map((row, i) => {
  if (i === 9) return row.replace(/heE/g, "3n3").replace(/Eeh/g, "3n3");
  if (i === 10) return row.replace(/hkE/g, "3.3").replace(/Ekh/g, "3.3");
  if (i === 11) return row.replace(/eE/g, "33").replace(/Ee/g, "33");
  if (i === 12) return "..33p33333333333333333p333......";
  if (i === 15) return "....33333333pnp333333333........";
  return row;
});
var happy1 = happy0.map((row, i) => {
  if (i === 12) return "..333333333333333333333333......";
  return row;
});
var hungry0 = idle0.map((row, i) => {
  if (i === 9) return "..333333333333333333333333......";
  if (i === 10) return row.replace(/hkE/g, "3k3").replace(/Ekh/g, "3k3");
  if (i === 11) return row.replace(/eE/g, "33").replace(/Ee/g, "33");
  if (i === 15) return "....33333333333333333333........";
  if (i === 16) return "....3333g333pnp333g33333........";
  return row;
});
var hungry1 = hungry0.map((row, i) => {
  if (i === 10) return row.replace(/3k3/g, "3.3");
  return row;
});
var sleeping0 = idle0.map((row, i) => {
  if (i === 2) return ".....33.........zzz.33..........";
  if (i === 9) return row.replace(/heE/g, "3n3").replace(/Eeh/g, "3n3");
  if (i === 10) return row.replace(/hkE/g, "333").replace(/Ekh/g, "333");
  if (i === 11) return row.replace(/eE/g, "33").replace(/Ee/g, "33");
  return row;
});
var sleeping1 = idle0.map((row, i) => {
  if (i === 1) return "......3.........zzz.3...........";
  if (i === 9) return row.replace(/heE/g, "3n3").replace(/Eeh/g, "3n3");
  if (i === 10) return row.replace(/hkE/g, "333").replace(/Ekh/g, "333");
  if (i === 11) return row.replace(/eE/g, "33").replace(/Ee/g, "33");
  return row;
});
var levelup0 = idle0.map((row, i) => {
  if (i === 0) return "...x..........x.......x.........";
  if (i === 3) return "....333.....x........333........";
  if (i === 6) return ".x333333333333333333333333......";
  if (i === 13) return "..x33333333333333333333333......";
  if (i === 27) return "...553333333333333333355..x.....";
  return row;
});
var levelup1 = idle0.map((row, i) => {
  if (i === 1) return "......3.....x........3..........";
  if (i === 5) return "..33p333......x.....333p33......";
  if (i === 14) return "...333333333333333333333..x.....";
  if (i === 25) return ".x5533333333www3333333355.......";
  return row;
});
var CAT_DEFINITION = {
  type: "cat",
  defaultName: "\u5C0F\u6A58",
  colors,
  frames: {
    idle: [idle0, idle1],
    happy: [happy0, happy1],
    hungry: [hungry0, hungry1],
    sleeping: [sleeping0, sleeping1],
    levelup: [levelup0, levelup1]
  }
};

// src/pets/shiba.ts
var colors2 = {
  s: [210, 160, 80],
  S: [180, 130, 60],
  c: [245, 230, 200],
  w: [252, 248, 242],
  k: [22, 22, 28],
  n: [40, 35, 35],
  p: [222, 148, 142],
  h: [255, 255, 255],
  t: [170, 110, 50],
  x: [255, 220, 60],
  z: [160, 180, 220]
};
var idle02 = [
  "................................",
  "................................",
  ".........s..........s...........",
  "........sss........sss..........",
  ".......sssss......sssss.........",
  "......ssssss......ssssss........",
  ".....sssssssssssssssssss........",
  ".....sssssssssssssssssss........",
  ".....ssssssssssssssssssss.......",
  ".....sshksssssssssskhsss.......",
  ".....sshksssssssssskhsss.......",
  ".....ssssssssssssssssssss.......",
  ".....sssssssssnsssssssss........",
  ".....ssssssssspssssssss.........",
  "......ssccccccccccccss..........",
  "......scccccccccccccs...........",
  ".......sccccccccccccs...........",
  ".......sscccccccccss............",
  "........ssscccccssss............",
  ".......sssssssssssssss..........",
  "......ssssssssssssssssss........",
  ".....ssssssssssssssssssss.......",
  ".....ssssssssssssssssssss.......",
  "......ssssssssssssssssss........",
  ".......sssssssssssssssssssss....",
  "........sssss....sssssssssss....",
  ".........sws......swssssssss....",
  ".........sws......sws...sss.....",
  "................................",
  "................................",
  "................................",
  "................................"
];
var idle12 = idle02.map((row, i) => {
  if (i === 9) return ".....ss.ksssssssssskh.ss.......";
  if (i === 10) return ".....ss.kssssssssskh.ss........";
  return row;
});
var happy02 = idle02.map((row, i) => {
  if (i === 9) return ".....ssnnsssssssssnnssss.......";
  if (i === 10) return ".....ss..sssssssss..ssss.......";
  if (i === 13) return ".....ssssssssspssssssss.........";
  return row;
});
var happy12 = happy02.map((row, i) => {
  if (i === 11) return ".....sspsssssssssssspss.........";
  return row;
});
var hungry02 = idle02.map((row, i) => {
  if (i === 9) return ".....ssssssssssssssssssss.......";
  if (i === 10) return ".....sshksssssssssskhsss.......";
  if (i === 12) return ".....sssssssssssssssssss........";
  if (i === 13) return ".....sssssssssnssssssss.........";
  return row;
});
var hungry12 = hungry02.map((row, i) => {
  if (i === 10) return ".....ss.ksssssssssk.ssss.......";
  return row;
});
var sleeping02 = idle02.map((row, i) => {
  if (i === 2) return ".........s.....zzz..s...........";
  if (i === 9) return ".....ssnnsssssssssnnssss.......";
  if (i === 10) return ".....ssssssssssssssssssss.......";
  return row;
});
var sleeping12 = idle02.map((row, i) => {
  if (i === 1) return "................zzz.............";
  if (i === 9) return ".....ssnnsssssssssnnssss.......";
  if (i === 10) return ".....ssssssssssssssssssss.......";
  return row;
});
var levelup02 = idle02.map((row, i) => {
  if (i === 0) return "....x..........x................";
  if (i === 5) return "......ssssss..x...ssssss........";
  if (i === 15) return ".x....scccccccccccccs...........";
  if (i === 23) return "......ssssssssssssssssss..x.....";
  return row;
});
var levelup12 = idle02.map((row, i) => {
  if (i === 1) return "..........x...........x.........";
  if (i === 7) return ".....sssssssssssssssssss..x.....";
  if (i === 20) return "..x...ssssssssssssssssss........";
  return row;
});
var SHIBA_DEFINITION = {
  type: "shiba",
  defaultName: "\u5C0F\u67F4",
  colors: colors2,
  frames: {
    idle: [idle02, idle12],
    happy: [happy02, happy12],
    hungry: [hungry02, hungry12],
    sleeping: [sleeping02, sleeping12],
    levelup: [levelup02, levelup12]
  }
};

// src/pets/penguin.ts
var colors3 = {
  b: [30, 30, 40],
  w: [252, 248, 242],
  o: [240, 160, 40],
  k: [22, 22, 28],
  h: [255, 255, 255],
  g: [50, 50, 60],
  x: [255, 220, 60],
  z: [160, 180, 220]
};
var idle03 = [
  "................................",
  "................................",
  "................................",
  "...........bbbbbb...............",
  "..........bbbbbbbb..............",
  ".........bbbbbbbbbb.............",
  ".........bbbbbbbbbb.............",
  "........bbbbbbbbbbbb............",
  "........bbhkbbbbkhhb............",
  "........bbhkbbbbkhbb............",
  "........bbbbbbbbbbbb............",
  ".........bbbboobbbbb............",
  ".........bbbbbbbbbb.............",
  "........bbbwwwwwwbbb............",
  ".......bbbwwwwwwwwbbb...........",
  "......bbbbwwwwwwwwbbbb..........",
  ".....bbbbbwwwwwwwwbbbbb.........",
  "....bbb.bbwwwwwwwwbb.bbb.......",
  "....bb...bwwwwwwwwb...bb.......",
  ".....b...bbwwwwwwbb...b........",
  "..........bbwwwwbb..............",
  "..........bbbbbbbb..............",
  "...........bbbbbb...............",
  "...........bbbbbb...............",
  "...........bb..bb...............",
  "..........ooo..ooo..............",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................"
];
var idle13 = idle03.map((row, i) => {
  if (i === 8) return "........bb.kbbbbk.hb............";
  if (i === 9) return "........bb.kbbbbk.bb............";
  return row;
});
var happy03 = idle03.map((row, i) => {
  if (i === 8) return "........bbgkbbbbkghb............";
  if (i === 9) return "........bb.kbbbb..bb............";
  if (i === 11) return ".........bbbboobbbbb............";
  return row;
});
var happy13 = happy03.map((row, i) => {
  if (i === 17) return "...bbb.bbwwwwwwwwbb.bbb.......";
  if (i === 18) return "....bbb..bwwwwwwwb..bbb.......";
  return row;
});
var hungry03 = idle03.map((row, i) => {
  if (i === 8) return "........bbbbbbbbbbbb............";
  if (i === 9) return "........bbhkbbbbkhbb............";
  if (i === 11) return ".........bbbboobbbb.............";
  return row;
});
var hungry13 = hungry03.map((row, i) => {
  if (i === 9) return "........bb.kbbbbk.bb............";
  return row;
});
var sleeping03 = idle03.map((row, i) => {
  if (i === 3) return "...........bbbbbb...zzz.........";
  if (i === 8) return "........bbggbbbbgghb............";
  if (i === 9) return "........bbbbbbbbbbbb............";
  return row;
});
var sleeping13 = idle03.map((row, i) => {
  if (i === 2) return "....................zzz.........";
  if (i === 8) return "........bbggbbbbgghb............";
  if (i === 9) return "........bbbbbbbbbbbb............";
  return row;
});
var levelup03 = idle03.map((row, i) => {
  if (i === 1) return "....x..........x................";
  if (i === 6) return ".........bbbbbbbbbb.....x.......";
  if (i === 20) return "..x.......bbwwwwbb..............";
  return row;
});
var levelup13 = idle03.map((row, i) => {
  if (i === 2) return "..........x.........x...........";
  if (i === 14) return ".......bbbwwwwwwwwbbb.....x.....";
  if (i === 22) return "..x........bbbbbb...............";
  return row;
});
var PENGUIN_DEFINITION = {
  type: "penguin",
  defaultName: "\u5C0F\u4F01",
  colors: colors3,
  frames: {
    idle: [idle03, idle13],
    happy: [happy03, happy13],
    hungry: [hungry03, hungry13],
    sleeping: [sleeping03, sleeping13],
    levelup: [levelup03, levelup13]
  }
};

// src/pets/hamster.ts
var colors4 = {
  b: [200, 160, 100],
  B: [170, 130, 80],
  c: [245, 230, 200],
  w: [252, 248, 242],
  k: [22, 22, 28],
  p: [240, 180, 170],
  P: [220, 150, 140],
  h: [255, 255, 255],
  n: [55, 40, 38],
  x: [255, 220, 60],
  z: [160, 180, 220]
};
var idle04 = [
  "................................",
  "................................",
  "................................",
  "........pppp......pppp..........",
  ".......pppppp....pppppp.........",
  "......ppbbpp......ppbbpp........",
  "......bbbbb........bbbbb.......",
  ".....bbbbbbbbbbbbbbbbbbb........",
  ".....bbbbbbbbbbbbbbbbbbb........",
  ".....bbhkbbbbbbbbbkhhbb.........",
  ".....bbhkbbbbbbbbbkhbbb.........",
  ".....bbbbbbbbbbbbbbbbbbb........",
  ".....bbbbbbbbnbbbbbbbbbb........",
  "....cccbbbbbbbbbbbbbccc.........",
  "...ccccccbbbbbbbbbcccccc........",
  "...cccccccccccccccccccccc.......",
  "...cccccccccccccccccccccc.......",
  "....ccccccccccccccccccccc.......",
  ".....ccccccccccccccccccc........",
  "......ccccccccccccccccc.........",
  ".......ccccccccccccccc..........",
  "........ccccccccccccc...........",
  ".........ccccc.ccccc............",
  "..........bwb...bwb.............",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................"
];
var idle14 = idle04.map((row, i) => {
  if (i === 9) return ".....bb.kbbbbbbbbbk..bb.........";
  if (i === 10) return ".....bb.kbbbbbbbbbk.bbb.........";
  return row;
});
var happy04 = idle04.map((row, i) => {
  if (i === 9) return ".....bbnbbbbbbbbbnbbbb..........";
  if (i === 10) return ".....bb.bbbbbbbbb..bbb..........";
  if (i === 11) return ".....bbppbbbbbbbbbppbbb.........";
  return row;
});
var happy14 = happy04.map((row, i) => {
  if (i === 11) return ".....bbbbbbbbbbbbbbbbbbb........";
  return row;
});
var hungry04 = idle04.map((row, i) => {
  if (i === 9) return ".....bbbbbbbbbbbbbbbbbbb........";
  if (i === 10) return ".....bbhkbbbbbbbbbkhbbb.........";
  if (i === 12) return ".....bbbbbbbbnbbbbbbbbbb........";
  return row;
});
var hungry14 = hungry04.map((row, i) => {
  if (i === 10) return ".....bb.kbbbbbbbbbk.bbb.........";
  return row;
});
var sleeping04 = idle04.map((row, i) => {
  if (i === 3) return "........pppp..zzz.pppp..........";
  if (i === 9) return ".....bbnbbbbbbbbbnbbbb..........";
  if (i === 10) return ".....bbbbbbbbbbbbbbbbbbb........";
  return row;
});
var sleeping14 = idle04.map((row, i) => {
  if (i === 2) return "..............zzz...............";
  if (i === 9) return ".....bbnbbbbbbbbbnbbbb..........";
  if (i === 10) return ".....bbbbbbbbbbbbbbbbbbb........";
  return row;
});
var levelup04 = idle04.map((row, i) => {
  if (i === 1) return "...x..............x.............";
  if (i === 7) return ".....bbbbbbbbbbbbbbbbbbb..x.....";
  if (i === 19) return "..x...ccccccccccccccccc.........";
  return row;
});
var levelup14 = idle04.map((row, i) => {
  if (i === 2) return "..........x..........x..........";
  if (i === 11) return ".x...bbbbbbbbbbbbbbbbbbb........";
  if (i === 21) return "........ccccccccccccc.....x.....";
  return row;
});
var HAMSTER_DEFINITION = {
  type: "hamster",
  defaultName: "\u5C0F\u4ED3",
  colors: colors4,
  frames: {
    idle: [idle04, idle14],
    happy: [happy04, happy14],
    hungry: [hungry04, hungry14],
    sleeping: [sleeping04, sleeping14],
    levelup: [levelup04, levelup14]
  }
};

// src/pets/slime.ts
var colors5 = {
  g: [100, 220, 100],
  G: [60, 180, 60],
  d: [140, 240, 140],
  w: [252, 248, 242],
  k: [22, 22, 28],
  h: [255, 255, 255],
  x: [255, 220, 60],
  z: [160, 180, 220]
};
var idle05 = [
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "............ddddd...............",
  "..........ddgggggdd.............",
  ".........dgggggggggd............",
  "........dgggggggggggg...........",
  ".......dgggggggggggggg..........",
  "......dgggggggggggggggg.........",
  "......gghkggggggggkhhgg.........",
  "......gghkggggggggkhggg.........",
  "......gggggggggggggggggg........",
  "......gggggggggggggggggg........",
  ".....ggggggggggggggggggg........",
  ".....ggggggggggggggggggg........",
  "....gGggggggggggggggggGgg.......",
  "....GGgggggggggggggggGGgg.......",
  "...GGGGggggggggggggGGGGgg.......",
  "...GGGGGGGGggggggGGGGGGg.......",
  "...GGGGGGGGGGGGGGGGGGGGGG.......",
  "...GGGGGGGGGGGGGGGGGGGGGG.......",
  "....GGGGGGGGGGGGGGGGGGGG........",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................"
];
var idle15 = idle05.map((row, i) => {
  if (i === 12) return "......gg.kggggggggk..gg.........";
  if (i === 13) return "......gg.kggggggggk.ggg.........";
  return row;
});
var happy05 = idle05.map((row, i) => {
  if (i === 12) return "......gggkggggggggkgggg.........";
  if (i === 13) return "......gg..gggggggg..ggg.........";
  if (i === 14) return "......gggggggggggggggggg........";
  return row;
});
var happy15 = idle05.map((row, i) => {
  if (i === 9) return "........dgggggggggggg..........";
  if (i === 12) return "......gggkggggggggkgggg.........";
  if (i === 13) return "......gg..gggggggg..ggg.........";
  return row;
});
var hungry05 = idle05.map((row, i) => {
  if (i === 12) return "......gggggggggggggggggg........";
  if (i === 13) return "......gghkggggggggkhggg.........";
  if (i === 15) return "......ggggggkgggggggggg.........";
  return row;
});
var hungry15 = hungry05.map((row, i) => {
  if (i === 13) return "......gg.kggggggggk.ggg.........";
  return row;
});
var sleeping05 = idle05.map((row, i) => {
  if (i === 6) return "............ddddd...zzz.........";
  if (i === 12) return "......ggkkggggggggkkggg.........";
  if (i === 13) return "......gggggggggggggggggg........";
  return row;
});
var sleeping15 = idle05.map((row, i) => {
  if (i === 5) return "....................zzz.........";
  if (i === 12) return "......ggkkggggggggkkggg.........";
  if (i === 13) return "......gggggggggggggggggg........";
  return row;
});
var levelup05 = idle05.map((row, i) => {
  if (i === 4) return "....x..............x............";
  if (i === 10) return ".......dgggggggggggggg....x.....";
  if (i === 22) return "..x..GGGGGGGGGGGGGGGGGGGG.......";
  return row;
});
var levelup15 = idle05.map((row, i) => {
  if (i === 5) return "..........x..........x..........";
  if (i === 8) return ".........dgggggggggd......x.....";
  if (i === 20) return ".x.GGGGggggggggggggGGGGgg.......";
  return row;
});
var SLIME_DEFINITION = {
  type: "slime",
  defaultName: "\u5C0F\u6ED1",
  colors: colors5,
  frames: {
    idle: [idle05, idle15],
    happy: [happy05, happy15],
    hungry: [hungry05, hungry15],
    sleeping: [sleeping05, sleeping15],
    levelup: [levelup05, levelup15]
  }
};

// src/pets/index.ts
var PETS = {
  cat: CAT_DEFINITION,
  shiba: SHIBA_DEFINITION,
  penguin: PENGUIN_DEFINITION,
  hamster: HAMSTER_DEFINITION,
  slime: SLIME_DEFINITION
};

// src/tools.ts
var PET_TYPES = ["cat", "shiba", "penguin", "hamster", "slime"];
function notAdopted() {
  return "\u5C1A\u672A\u9886\u517B\u5BA0\u7269\uFF0C\u8BF7\u5148\u4F7F\u7528 /pet switch <type> \u9886\u517B\u3002\u53EF\u9009\uFF1A" + PET_TYPES.join(", ");
}
function errResult(msg) {
  return { content: [{ type: "text", text: msg }] };
}
function registerTools(server2) {
  server2.tool("pet_show", "\u663E\u793A\u5BA0\u7269\u50CF\u7D20\u753B", { animation: z.boolean().optional().describe("\u662F\u5426\u663E\u793A\u4E24\u5E27\u52A8\u753B\uFF08\u9ED8\u8BA4\u4EC5\u7B2C\u4E00\u5E27\uFF09") }, async ({ animation }) => {
    try {
      const raw = await loadState();
      if (!raw) return errResult(notAdopted());
      const resolved = resolveState(raw);
      const pet = PETS[raw.type];
      const frames = pet.frames[resolved.state];
      const parts = [];
      if (animation && frames.length > 1) {
        parts.push({ type: "text", text: renderToAnsi(frames[0], pet.colors) });
        parts.push({ type: "text", text: "\n--- frame 2 ---\n" });
        parts.push({ type: "text", text: renderToAnsi(frames[1], pet.colors) });
      } else {
        parts.push({ type: "text", text: renderToAnsi(frames[0], pet.colors) });
      }
      if (resolved.state === "levelup") {
        await saveState({ ...raw, pendingLevelUp: false });
      }
      return { content: parts };
    } catch (err) {
      return errResult(`\u663E\u793A\u5BA0\u7269\u5931\u8D25: ${err}`);
    }
  });
  server2.tool("pet_feed", "\u5582\u98DF\u5BA0\u7269", {}, async () => {
    try {
      const raw = await loadState();
      if (!raw) return errResult(notAdopted());
      let updated = feed(raw);
      updated = addXP(updated, 2);
      await saveState(updated);
      const resolved = resolveState(updated);
      return errResult(`\u5DF2\u5582\u98DF ${updated.name}\uFF01\u9965\u997F\u5EA6: ${Math.round(resolved.hunger)}/100, \u5FC3\u60C5: ${Math.round(resolved.mood)}/100, XP +2`);
    } catch (err) {
      return errResult(`\u5582\u98DF\u5931\u8D25: ${err}`);
    }
  });
  server2.tool("pet_status", "\u67E5\u770B\u5BA0\u7269\u72B6\u6001", {}, async () => {
    try {
      const raw = await loadState();
      if (!raw) return errResult(notAdopted());
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
            totalInteractions: resolved.totalInteractions,
            pendingLevelUp: resolved.pendingLevelUp,
            createdAt: resolved.createdAt
          }, null, 2)
        }]
      };
    } catch (err) {
      return errResult(`\u67E5\u8BE2\u72B6\u6001\u5931\u8D25: ${err}`);
    }
  });
  server2.tool(
    "pet_switch",
    "\u5207\u6362/\u9886\u517B\u5BA0\u7269",
    { type: z.enum(["cat", "shiba", "penguin", "hamster", "slime"]).describe("\u5BA0\u7269\u7C7B\u578B"), name: z.string().optional().describe("\u5BA0\u7269\u540D\u5B57") },
    async ({ type, name }) => {
      try {
        const pet = PETS[type];
        const petName = name ?? pet.defaultName;
        const existing = await loadState();
        if (existing) {
          const updated = { ...existing, type, name: petName };
          await saveState(updated);
          return errResult(`\u5DF2\u5207\u6362\u4E3A ${petName}\uFF08${type}\uFF09\uFF0C\u4FDD\u7559\u4E86\u6240\u6709\u8FDB\u5EA6\uFF08Lv.${existing.level}, XP: ${existing.xp}\uFF09\u3002`);
        }
        const state = createDefaultState(type, petName);
        await saveState(state);
        return errResult(`\u6210\u529F\u9886\u517B\u4E86 ${petName}\uFF08${type}\uFF09\uFF01\u8F93\u5165 /pet \u67E5\u770B\u4F60\u7684\u5BA0\u7269\u3002`);
      } catch (err) {
        return errResult(`\u5207\u6362\u5BA0\u7269\u5931\u8D25: ${err}`);
      }
    }
  );
  server2.tool(
    "pet_rename",
    "\u91CD\u547D\u540D\u5BA0\u7269",
    { name: z.string().describe("\u65B0\u540D\u5B57") },
    async ({ name }) => {
      try {
        const raw = await loadState();
        if (!raw) return errResult(notAdopted());
        const updated = { ...raw, name };
        await saveState(updated);
        return errResult(`\u5BA0\u7269\u5DF2\u66F4\u540D\u4E3A\u300C${name}\u300D\uFF01`);
      } catch (err) {
        return errResult(`\u91CD\u547D\u540D\u5931\u8D25: ${err}`);
      }
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
