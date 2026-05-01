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

function errResult(msg: string) {
  return { content: [{ type: "text" as const, text: msg }] };
}

export function registerTools(server: McpServer): void {
  server.tool("pet_show", "显示宠物像素画", { animation: z.boolean().optional().describe("是否显示两帧动画（默认仅第一帧）") }, async ({ animation }) => {
    try {
      const raw = await loadState();
      if (!raw) return errResult(notAdopted());
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
    } catch (err) {
      return errResult(`显示宠物失败: ${err}`);
    }
  });

  server.tool("pet_feed", "喂食宠物", {}, async () => {
    try {
      const raw = await loadState();
      if (!raw) return errResult(notAdopted());
      let updated = feed(raw);
      updated = addXP(updated, 2);
      await saveState(updated);
      const resolved = resolveState(updated);
      return errResult(`已喂食 ${updated.name}！饥饿度: ${Math.round(resolved.hunger)}/100, 心情: ${Math.round(resolved.mood)}/100, XP +2`);
    } catch (err) {
      return errResult(`喂食失败: ${err}`);
    }
  });

  server.tool("pet_status", "查看宠物状态", {}, async () => {
    try {
      const raw = await loadState();
      if (!raw) return errResult(notAdopted());
      const resolved = resolveState(raw);
      return {
        content: [{
          type: "text" as const,
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
    } catch (err) {
      return errResult(`查询状态失败: ${err}`);
    }
  });

  server.tool(
    "pet_switch",
    "切换/领养宠物",
    { type: z.enum(["cat", "shiba", "penguin", "hamster", "slime"]).describe("宠物类型"), name: z.string().optional().describe("宠物名字") },
    async ({ type, name }) => {
      try {
        const pet = PETS[type];
        const petName = name ?? pet.defaultName;
        const existing = await loadState();
        if (existing) {
          const updated = { ...existing, type, name: petName };
          await saveState(updated);
          return errResult(`已切换为 ${petName}（${type}），保留了所有进度（Lv.${existing.level}, XP: ${existing.xp}）。`);
        }
        const state = createDefaultState(type, petName);
        await saveState(state);
        return errResult(`成功领养了 ${petName}（${type}）！输入 /pet 查看你的宠物。`);
      } catch (err) {
        return errResult(`切换宠物失败: ${err}`);
      }
    },
  );

  server.tool(
    "pet_rename",
    "重命名宠物",
    { name: z.string().describe("新名字") },
    async ({ name }) => {
      try {
        const raw = await loadState();
        if (!raw) return errResult(notAdopted());
        const updated = { ...raw, name };
        await saveState(updated);
        return errResult(`宠物已更名为「${name}」！`);
      } catch (err) {
        return errResult(`重命名失败: ${err}`);
      }
    },
  );
}
