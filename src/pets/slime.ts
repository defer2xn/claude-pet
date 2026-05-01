import type { PetDefinition, Frame, ColorMap } from "./types.js";

const colors: ColorMap = {
  g: [100, 220, 100],
  G: [60, 180, 60],
  d: [140, 240, 140],
  w: [252, 248, 242],
  k: [22, 22, 28],
  h: [255, 255, 255],
  x: [255, 220, 60],
  z: [160, 180, 220],
};

const idle0: Frame = [
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
  "................................",
];

const idle1: Frame = idle0.map((row, i) => {
  if (i === 12) return "......gg.kggggggggk..gg.........";
  if (i === 13) return "......gg.kggggggggk.ggg.........";
  return row;
});

const happy0: Frame = idle0.map((row, i) => {
  if (i === 12) return "......gggkggggggggkgggg.........";
  if (i === 13) return "......gg..gggggggg..ggg.........";
  if (i === 14) return "......gggggggggggggggggg........";
  return row;
});

const happy1: Frame = idle0.map((row, i) => {
  if (i === 9) return "........dgggggggggggg..........";
  if (i === 12) return "......gggkggggggggkgggg.........";
  if (i === 13) return "......gg..gggggggg..ggg.........";
  return row;
});

const hungry0: Frame = idle0.map((row, i) => {
  if (i === 12) return "......gggggggggggggggggg........";
  if (i === 13) return "......gghkggggggggkhggg.........";
  if (i === 15) return "......ggggggkgggggggggg.........";
  return row;
});

const hungry1: Frame = hungry0.map((row, i) => {
  if (i === 13) return "......gg.kggggggggk.ggg.........";
  return row;
});

const sleeping0: Frame = idle0.map((row, i) => {
  if (i === 6) return "............ddddd...zzz.........";
  if (i === 12) return "......ggkkggggggggkkggg.........";
  if (i === 13) return "......gggggggggggggggggg........";
  return row;
});

const sleeping1: Frame = idle0.map((row, i) => {
  if (i === 5) return "....................zzz.........";
  if (i === 12) return "......ggkkggggggggkkggg.........";
  if (i === 13) return "......gggggggggggggggggg........";
  return row;
});

const levelup0: Frame = idle0.map((row, i) => {
  if (i === 4) return "....x..............x............";
  if (i === 10) return ".......dgggggggggggggg....x.....";
  if (i === 22) return "..x..GGGGGGGGGGGGGGGGGGGG.......";
  return row;
});

const levelup1: Frame = idle0.map((row, i) => {
  if (i === 5) return "..........x..........x..........";
  if (i === 8) return ".........dgggggggggd......x.....";
  if (i === 20) return ".x.GGGGggggggggggggGGGGgg.......";
  return row;
});

export const SLIME_DEFINITION: PetDefinition = {
  type: "slime",
  defaultName: "小滑",
  colors,
  frames: {
    idle: [idle0, idle1],
    happy: [happy0, happy1],
    hungry: [hungry0, hungry1],
    sleeping: [sleeping0, sleeping1],
    levelup: [levelup0, levelup1],
  },
};
