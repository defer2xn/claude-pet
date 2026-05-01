import type { PetType, RawPetState, ResolvedPetState, PetStateKind } from "./pets/types.js";

export function resolveState(raw: RawPetState): ResolvedPetState {
  const now = Date.now();
  const minutesSinceLastFeed = (now - raw.lastFeed) / 60000;
  const minutesSinceLastActivity = (now - raw.lastActivity) / 60000;

  // 饥饿度：从上次喂食时的基准值随时间衰减（每分钟 -1）
  const hunger = Math.min(100, Math.max(0, raw.hungerAtLastFeed - Math.floor(minutesSinceLastFeed)));

  // 心情：饥饿时下降更快
  const moodDecay = hunger < 30 ? minutesSinceLastActivity * 0.5 : minutesSinceLastActivity * 0.1;
  const mood = Math.min(100, Math.max(0, raw.moodBase - moodDecay));

  // 状态推导（优先级：levelup → sleeping → hungry → happy → idle）
  let state: PetStateKind;
  if (raw.pendingLevelUp) state = "levelup";
  else if (minutesSinceLastActivity > 10) state = "sleeping";
  else if (hunger < 30) state = "hungry";
  else if (minutesSinceLastFeed < 3) state = "happy";
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
    hungerAtLastFeed: 100,
    moodBase: 80,
    lastActivity: now,
    lastFeed: now,
    pendingLevelUp: false,
    previousLevel: 1,
    totalInteractions: 0,
    visible: true,
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
    hungerAtLastFeed: Math.min(100, resolved.hunger + 50),
    lastFeed: now,
    lastActivity: now,
    moodBase: Math.min(100, raw.moodBase + 20),
  };
}
