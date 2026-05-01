import type { PetDefinition, Frame, ColorMap } from "./types.js";

const colors: ColorMap = {
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
  z: [160, 180, 220],
};

const idle0: Frame = [
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
  "................................",
];

const idle1: Frame = idle0.map((row, i) => {
  if (i === 9) return ".....ss.ksssssssssskh.ss.......";
  if (i === 10) return ".....ss.kssssssssskh.ss........";
  return row;
});

const happy0: Frame = idle0.map((row, i) => {
  if (i === 9) return ".....ssnnsssssssssnnssss.......";
  if (i === 10) return ".....ss..sssssssss..ssss.......";
  if (i === 13) return ".....ssssssssspssssssss.........";
  return row;
});

const happy1: Frame = happy0.map((row, i) => {
  if (i === 11) return ".....sspsssssssssssspss.........";
  return row;
});

const hungry0: Frame = idle0.map((row, i) => {
  if (i === 9) return ".....ssssssssssssssssssss.......";
  if (i === 10) return ".....sshksssssssssskhsss.......";
  if (i === 12) return ".....sssssssssssssssssss........";
  if (i === 13) return ".....sssssssssnssssssss.........";
  return row;
});

const hungry1: Frame = hungry0.map((row, i) => {
  if (i === 10) return ".....ss.ksssssssssk.ssss.......";
  return row;
});

const sleeping0: Frame = idle0.map((row, i) => {
  if (i === 2) return ".........s.....zzz..s...........";
  if (i === 9) return ".....ssnnsssssssssnnssss.......";
  if (i === 10) return ".....ssssssssssssssssssss.......";
  return row;
});

const sleeping1: Frame = idle0.map((row, i) => {
  if (i === 1) return "................zzz.............";
  if (i === 9) return ".....ssnnsssssssssnnssss.......";
  if (i === 10) return ".....ssssssssssssssssssss.......";
  return row;
});

const levelup0: Frame = idle0.map((row, i) => {
  if (i === 0) return "....x..........x................";
  if (i === 5) return "......ssssss..x...ssssss........";
  if (i === 15) return ".x....scccccccccccccs...........";
  if (i === 23) return "......ssssssssssssssssss..x.....";
  return row;
});

const levelup1: Frame = idle0.map((row, i) => {
  if (i === 1) return "..........x...........x.........";
  if (i === 7) return ".....sssssssssssssssssss..x.....";
  if (i === 20) return "..x...ssssssssssssssssss........";
  return row;
});

export const SHIBA_DEFINITION: PetDefinition = {
  type: "shiba",
  defaultName: "小柴",
  colors,
  frames: {
    idle: [idle0, idle1],
    happy: [happy0, happy1],
    hungry: [hungry0, hungry1],
    sleeping: [sleeping0, sleeping1],
    levelup: [levelup0, levelup1],
  },
};
