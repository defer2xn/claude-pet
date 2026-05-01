import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import type { RawPetState } from "./pets/types.js";

const STATE_DIR = path.join(os.homedir(), ".claude-pet");
const STATE_PATH = path.join(STATE_DIR, "state.json");

export async function loadState(): Promise<RawPetState | null> {
  try {
    const data = await fs.readFile(STATE_PATH, "utf-8");
    return JSON.parse(data) as RawPetState;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      return null;
    }
    throw new Error(`宠物状态文件损坏或不可读: ${STATE_PATH}`);
  }
}

export async function saveState(state: RawPetState): Promise<void> {
  await fs.mkdir(STATE_DIR, { recursive: true });
  const tmp = STATE_PATH + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(state, null, 2));
  await fs.rename(tmp, STATE_PATH);
}
