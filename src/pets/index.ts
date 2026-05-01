import type { PetType, PetDefinition } from "./types.js";
import { CAT_DEFINITION } from "./cat.js";
import { SHIBA_DEFINITION } from "./shiba.js";
import { PENGUIN_DEFINITION } from "./penguin.js";
import { HAMSTER_DEFINITION } from "./hamster.js";
import { SLIME_DEFINITION } from "./slime.js";

export const PETS: Record<PetType, PetDefinition> = {
  cat: CAT_DEFINITION,
  shiba: SHIBA_DEFINITION,
  penguin: PENGUIN_DEFINITION,
  hamster: HAMSTER_DEFINITION,
  slime: SLIME_DEFINITION,
};
