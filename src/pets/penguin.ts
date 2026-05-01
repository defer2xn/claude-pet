import type { PetDefinition, Frame, ColorMap } from "./types.js";

const colors: ColorMap = {
  b: [30, 30, 40],
  w: [252, 248, 242],
  o: [240, 160, 40],
  k: [22, 22, 28],
  h: [255, 255, 255],
  g: [50, 50, 60],
  x: [255, 220, 60],
  z: [160, 180, 220],
};

const idle0: Frame = [
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
  "................................",
];

const idle1: Frame = idle0.map((row, i) => {
  if (i === 8) return "........bb.kbbbbk.hb............";
  if (i === 9) return "........bb.kbbbbk.bb............";
  return row;
});

const happy0: Frame = idle0.map((row, i) => {
  if (i === 8) return "........bbgkbbbbkghb............";
  if (i === 9) return "........bb.kbbbb..bb............";
  if (i === 11) return ".........bbbboobbbbb............";
  return row;
});

const happy1: Frame = happy0.map((row, i) => {
  if (i === 17) return "...bbb.bbwwwwwwwwbb.bbb.......";
  if (i === 18) return "....bbb..bwwwwwwwb..bbb.......";
  return row;
});

const hungry0: Frame = idle0.map((row, i) => {
  if (i === 8) return "........bbbbbbbbbbbb............";
  if (i === 9) return "........bbhkbbbbkhbb............";
  if (i === 11) return ".........bbbboobbbb.............";
  return row;
});

const hungry1: Frame = hungry0.map((row, i) => {
  if (i === 9) return "........bb.kbbbbk.bb............";
  return row;
});

const sleeping0: Frame = idle0.map((row, i) => {
  if (i === 3) return "...........bbbbbb...zzz.........";
  if (i === 8) return "........bbggbbbbgghb............";
  if (i === 9) return "........bbbbbbbbbbbb............";
  return row;
});

const sleeping1: Frame = idle0.map((row, i) => {
  if (i === 2) return "....................zzz.........";
  if (i === 8) return "........bbggbbbbgghb............";
  if (i === 9) return "........bbbbbbbbbbbb............";
  return row;
});

const levelup0: Frame = idle0.map((row, i) => {
  if (i === 1) return "....x..........x................";
  if (i === 6) return ".........bbbbbbbbbb.....x.......";
  if (i === 20) return "..x.......bbwwwwbb..............";
  return row;
});

const levelup1: Frame = idle0.map((row, i) => {
  if (i === 2) return "..........x.........x...........";
  if (i === 14) return ".......bbbwwwwwwwwbbb.....x.....";
  if (i === 22) return "..x........bbbbbb...............";
  return row;
});

export const PENGUIN_DEFINITION: PetDefinition = {
  type: "penguin",
  defaultName: "小企",
  colors,
  frames: {
    idle: [idle0, idle1],
    happy: [happy0, happy1],
    hungry: [hungry0, hungry1],
    sleeping: [sleeping0, sleeping1],
    levelup: [levelup0, levelup1],
  },
};
