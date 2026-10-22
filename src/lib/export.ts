import { labelTextColor } from "@/lib/board";
import { loadImage } from "@/lib/images";
import type { TierBoard } from "@/types/tier-list";

function wrapText(context: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const character of text) {
    if (context.measureText(line + character).width > width && line) {
      lines.push(line.trim());
      line = "";
    }
    line += character;
  }
  if (line) lines.push(line.trim());
  return lines;
}

export async function exportBoard(board: TierBoard) {
  await document.fonts.ready;
  const tile = Math.round(board.tileSize * 1.5);
  const labelWidth = 144;
  const columns = Math.floor((1200 - labelWidth) / tile);
  const width = labelWidth + columns * tile;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image export is unavailable in this browser.");
  const fontFamily = getComputedStyle(document.body).fontFamily;
  context.font = `600 22px ${fontFamily}`;
  const rows = board.tiers.map((tier) => {
    const lines = wrapText(context, tier.label, labelWidth - 24);
    return { tier, lines, height: Math.max(Math.ceil(tier.imageIds.length / columns) * tile, tile, lines.length * 28 + 24) };
  });
  const height = 110 + rows.reduce((total, row) => total + row.height + 1, 0) + 44;
  if (height > 16000) throw new Error("This board is too tall to export. Try a smaller image size.");
  canvas.width = width;
  canvas.height = height;
  const isLight = document.documentElement.classList.contains("darkmode");
  context.fillStyle = isLight ? "#f3f4f6" : "#111827";
  context.fillRect(0, 0, width, height);
  context.fillStyle = isLight ? "#111827" : "#f3f4f6";
  context.font = `700 30px ${fontFamily}`;
  context.fillText(board.title || "My tier list", 24, 52, width - 48);
  context.fillStyle = isLight ? "#64748b" : "#9ba9bf";
  context.font = `400 14px ${fontFamily}`;
  context.fillText(`${board.tiers.length} tiers · ${board.images.length - board.unranked.length} ranked images`, 24, 80);
  const ranked = new Set(board.tiers.flatMap((tier) => tier.imageIds));
  const images = new Map(await Promise.all(board.images.filter((image) => ranked.has(image.id)).map(async (image) => [image.id, await loadImage(image.src)] as const)));
  let y = 110;
  for (const { tier, lines, height: rowHeight } of rows) {
    context.fillStyle = isLight ? "#e6e9ee" : "#0c0c0c";
    context.fillRect(0, y, width, rowHeight + 1);
    context.fillStyle = isLight ? "#f1f3f5" : "#20201f";
    context.fillRect(labelWidth, y, width - labelWidth, rowHeight);
    context.fillStyle = tier.color;
    context.fillRect(0, y, labelWidth - 1, rowHeight);
    context.fillStyle = labelTextColor(tier.color);
    context.font = `600 22px ${fontFamily}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    lines.forEach((line, index) => context.fillText(line, labelWidth / 2, y + rowHeight / 2 + (index - (lines.length - 1) / 2) * 28));
    tier.imageIds.forEach((id, index) => {
      const image = images.get(id);
      if (image) context.drawImage(image, labelWidth + (index % columns) * tile, y + Math.floor(index / columns) * tile, tile, tile);
    });
    y += rowHeight + 1;
  }
  context.textAlign = "right";
  context.fillStyle = isLight ? "#64748b" : "#9ba9bf";
  context.font = `500 12px ${fontFamily}`;
  context.fillText("Made with Tier List", width - 18, height - 20);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Could not create the PNG.")), "image/png"));
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(board.title || "my-tier-list").replace(/[^a-z0-9 _-]/gi, "").trim() || "tier-list"}.png`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}