import type { PetDefinition, Frame, ColorMap } from "./types.js";

const colors: ColorMap = {
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
  z: [160, 180, 220],
};

const idle0: Frame = [
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
  "................................",
];

const idle1: Frame = idle0.map((row, i) => {
  if (i === 9) return ".....bb.kbbbbbbbbbk..bb.........";
  if (i === 10) return ".....bb.kbbbbbbbbbk.bbb.........";
  return row;
});

const happy0: Frame = idle0.map((row, i) => {
  if (i === 9) return ".....bbnbbbbbbbbbnbbbb..........";
  if (i === 10) return ".....bb.bbbbbbbbb..bbb..........";
  if (i === 11) return ".....bbppbbbbbbbbbppbbb.........";
  return row;
});

const happy1: Frame = happy0.map((row, i) => {
  if (i === 11) return ".....bbbbbbbbbbbbbbbbbbb........";
  return row;
});

const hungry0: Frame = idle0.map((row, i) => {
  if (i === 9) return ".....bbbbbbbbbbbbbbbbbbb........";
  if (i === 10) return ".....bbhkbbbbbbbbbkhbbb.........";
  if (i === 12) return ".....bbbbbbbbnbbbbbbbbbb........";
  return row;
});

const hungry1: Frame = hungry0.map((row, i) => {
  if (i === 10) return ".....bb.kbbbbbbbbbk.bbb.........";
  return row;
});

const sleeping0: Frame = idle0.map((row, i) => {
  if (i === 3) return "........pppp..zzz.pppp..........";
  if (i === 9) return ".....bbnbbbbbbbbbnbbbb..........";
  if (i === 10) return ".....bbbbbbbbbbbbbbbbbbb........";
  return row;
});

const sleeping1: Frame = idle0.map((row, i) => {
  if (i === 2) return "..............zzz...............";
  if (i === 9) return ".....bbnbbbbbbbbbnbbbb..........";
  if (i === 10) return ".....bbbbbbbbbbbbbbbbbbb........";
  return row;
});

const levelup0: Frame = idle0.map((row, i) => {
  if (i === 1) return "...x..............x.............";
  if (i === 7) return ".....bbbbbbbbbbbbbbbbbbb..x.....";
  if (i === 19) return "..x...ccccccccccccccccc.........";
  return row;
});

const levelup1: Frame = idle0.map((row, i) => {
  if (i === 2) return "..........x..........x..........";
  if (i === 11) return ".x...bbbbbbbbbbbbbbbbbbb........";
  if (i === 21) return "........ccccccccccccc.....x.....";
  return row;
});

export const HAMSTER_DEFINITION: PetDefinition = {
  type: "hamster",
  defaultName: "小仓",
  colors,
  frames: {
    idle: [idle0, idle1],
    happy: [happy0, happy1],
    hungry: [hungry0, hungry1],
    sleeping: [sleeping0, sleeping1],
    levelup: [levelup0, levelup1],
  },
};
