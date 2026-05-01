import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadState, saveState } from "./state.js";
import { resolveState, createDefaultState, addXP, feed } from "./engine.js";
import { renderToAnsi } from "./renderer.js";
import { PETS } from "./pets/index.js";
import type { PetType } from "./pets/types.js";

const PET_TYPES: PetType[] = ["cat", "shiba", "penguin", "hamster", "slime"];

function notAdopted(): string {
  return "尚未领养宠物，请先使用 /pet switch <type> 领养。可选：" + PET_TYPES.join(", ");
}

export function registerTools(server: McpServer): void {
  server.tool("pet_show", "显示宠物像素画", { animation: z.boolean().optional().describe("是否显示两帧动画（默认仅第一帧）") }, async ({ animation }) => {
    const raw = await loadState();
    if (!raw) return { content: [{ type: "text", text: notAdopted() }] };
    const resolved = resolveState(raw);
    const pet = PETS[raw.type];
    const frames = pet.frames[resolved.state];

    const parts: Array<{ type: "text"; text: string }> = [];
    if (animation && frames.length > 1) {
      parts.push({ type: "text", text: renderToAnsi(frames[0], pet.colors) });
      parts.push({ type: "text", text: "\n--- frame 2 ---\n" });
      parts.push({ type: "text", text: renderToAnsi(frames[1], pet.colors) });
    } else {
      parts.push({ type: "text", text: renderToAnsi(frames[0], pet.colors) });
    }

    if (resolved.state === "levelup") {
      await saveState({ ...raw, pendingLevelUp: false });
    }

    return { content: parts };
  });

  server.tool("pet_feed", "喂食宠物", {}, async () => {
    const raw = await loadState();
    if (!raw) return { content: [{ type: "text", text: notAdopted() }] };
    let updated = feed(raw);
    updated = addXP(updated, 2);
    await saveState(updated);
    const resolved = resolveState(updated);
    return {
      content: [{
        type: "text",
        text: `已喂食 ${updated.name}！饥饿度: ${Math.round(resolved.hunger)}/100, 心情: ${Math.round(resolved.mood)}/100, XP +2`,
      }],
    };
  });

  server.tool("pet_status", "查看宠物状态", {}, async () => {
    const raw = await loadState();
    if (!raw) return { content: [{ type: "text", text: notAdopted() }] };
    const resolved = resolveState(raw);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          name: resolved.name,
          type: resolved.type,
          level: resolved.level,
          xp: resolved.xp,
          hunger: Math.round(resolved.hunger),
          mood: Math.round(resolved.mood),
          state: resolved.state,
          totalInteractions: resolved.totalInteractions,
          pendingLevelUp: resolved.pendingLevelUp,
          createdAt: resolved.createdAt,
        }, null, 2),
      }],
    };
  });

  server.tool(
    "pet_switch",
    "切换/领养宠物",
    { type: z.enum(["cat", "shiba", "penguin", "hamster", "slime"]).describe("宠物类型"), name: z.string().optional().describe("宠物名字") },
    async ({ type, name }) => {
      const pet = PETS[type];
      const petName = name ?? pet.defaultName;
      const existing = await loadState();
      if (existing) {
        const updated = { ...existing, type, name: petName };
        await saveState(updated);
        return { content: [{ type: "text", text: `已切换为 ${petName}（${type}），保留了所有进度（Lv.${existing.level}, XP: ${existing.xp}）。` }] };
      }
      const state = createDefaultState(type, petName);
      await saveState(state);
      return { content: [{ type: "text", text: `成功领养了 ${petName}（${type}）！输入 /pet 查看你的宠物。` }] };
    },
  );

  server.tool(
    "pet_rename",
    "重命名宠物",
    { name: z.string().describe("新名字") },
    async ({ name }) => {
      const raw = await loadState();
      if (!raw) return { content: [{ type: "text", text: notAdopted() }] };
      const updated = { ...raw, name };
      await saveState(updated);
      return { content: [{ type: "text", text: `宠物已更名为「${name}」！` }] };
    },
  );
}
