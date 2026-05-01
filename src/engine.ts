import type { PetType, RawPetState, ResolvedPetState, PetStateKind } from "./pets/types.js";

export function resolveState(raw: RawPetState): ResolvedPetState {
  const now = Date.now();
  const hunger = Math.min(100, (now - raw.lastFeed) / 36000);
  const mood = Math.max(0, raw.moodBase - Math.floor((now - raw.lastActivity) / 3600000));

  let state: PetStateKind;
  if (hunger > 70) state = "hungry";
  else if (mood < 20) state = "sleeping";
  else if (mood > 80) state = "happy";
  else state = "idle";

  return { ...raw, hunger, mood, state };
}

export function createDefaultState(type: PetType, name: string): RawPetState {
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
    createdAt: now,
  };
}

export function addXP(raw: RawPetState, amount: number): RawPetState {
  const newXP = raw.xp + amount;
  const newLevel = Math.floor(Math.sqrt(newXP / 10)) + 1;
  const pendingLevelUp = newLevel > raw.level;
  return { ...raw, xp: newXP, level: newLevel, pendingLevelUp: pendingLevelUp || raw.pendingLevelUp };
}

export function feed(raw: RawPetState): RawPetState {
  const now = Date.now();
  const resolved = resolveState(raw);
  return {
    ...raw,
    hungerAtLastFeed: resolved.hunger,
    lastFeed: now,
    moodBase: Math.min(100, raw.moodBase + 10),
  };
}
