import type { Frame, ColorMap } from "./pets/types.js";

export function renderToAnsi(frame: Frame, colors: ColorMap): string {
  // 补全到 32 行
  const rows: string[] = [...frame];
  while (rows.length < 32) rows.push(".".repeat(32));

  const lines: string[] = [];

  for (let y = 0; y < 32; y += 2) {
    const topRow = rows[y];
    const botRow = rows[y + 1] ?? ".".repeat(32);
    const width = Math.max(topRow.length, botRow.length);
    let line = "";

    for (let x = 0; x < width; x++) {
      const topChar = topRow[x] ?? ".";
      const botChar = botRow[x] ?? ".";
      const topColor = colors[topChar];
      const botColor = colors[botChar];

      if (!topColor && !botColor) {
        line += " ";
      } else if (topColor && botColor) {
        line += `\x1b[38;2;${topColor[0]};${topColor[1]};${topColor[2]}m\x1b[48;2;${botColor[0]};${botColor[1]};${botColor[2]}m▀`;
      } else if (topColor && !botColor) {
        line += `\x1b[38;2;${topColor[0]};${topColor[1]};${topColor[2]}m\x1b[49m▀`;
      } else if (!topColor && botColor) {
        line += `\x1b[38;2;${botColor[0]};${botColor[1]};${botColor[2]}m\x1b[49m▄`;
      }
    }

    lines.push(line + "\x1b[0m");
  }

  return lines.join("\n");
}
