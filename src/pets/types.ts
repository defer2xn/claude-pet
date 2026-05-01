export type PetType = "cat" | "dog" | "rabbit";

export interface RawPetState {
  type: PetType;
  name: string;
  xp: number;
  level: number;
  hungerAtLastFeed: number;
  moodBase: number;
  lastActivity: number;
  lastFeed: number;
  pendingLevelUp: boolean;
  createdAt: number;
}

export type PetStateKind = "idle" | "happy" | "hungry" | "sleeping";

export interface ResolvedPetState extends RawPetState {
  hunger: number;
  mood: number;
  state: PetStateKind;
}

export type Frame = string[];
export type ColorMap = Record<string, [number, number, number]>;

export interface PetDefinition {
  type: PetType;
  defaultName: string;
  colors: ColorMap;
  frames: Record<string, Frame[]>;
}
