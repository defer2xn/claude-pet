import type { PetType, PetDefinition, Frame, ColorMap } from "./types.js";
import { CAT_DEFINITION } from "./cat.js";

const PLACEHOLDER_FRAME: Frame = Array(32).fill(".".repeat(32));

const DOG_COLORS: ColorMap = { d: [180, 130, 70], w: [252, 248, 242] };
const RABBIT_COLORS: ColorMap = { r: [240, 220, 220], w: [255, 255, 255] };

const DOG_DEFINITION: PetDefinition = {
  type: "dog",
  defaultName: "小柴",
  colors: DOG_COLORS,
  frames: {
    idle: [PLACEHOLDER_FRAME, PLACEHOLDER_FRAME],
    happy: [PLACEHOLDER_FRAME, PLACEHOLDER_FRAME],
    hungry: [PLACEHOLDER_FRAME, PLACEHOLDER_FRAME],
    sleeping: [PLACEHOLDER_FRAME, PLACEHOLDER_FRAME],
  },
};

const RABBIT_DEFINITION: PetDefinition = {
  type: "rabbit",
  defaultName: "小兔",
  colors: RABBIT_COLORS,
  frames: {
    idle: [PLACEHOLDER_FRAME, PLACEHOLDER_FRAME],
    happy: [PLACEHOLDER_FRAME, PLACEHOLDER_FRAME],
    hungry: [PLACEHOLDER_FRAME, PLACEHOLDER_FRAME],
    sleeping: [PLACEHOLDER_FRAME, PLACEHOLDER_FRAME],
  },
};

export const PETS: Record<PetType, PetDefinition> = {
  cat: CAT_DEFINITION,
  dog: DOG_DEFINITION,
  rabbit: RABBIT_DEFINITION,
};
