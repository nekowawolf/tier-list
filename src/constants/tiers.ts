import type { TierBoard } from "@/types/tier-list";

export const TIER_COLORS = ["#ff7f7f", "#ffbf7f", "#ffdf7f", "#ffff7f", "#bfff7f", "#7fff7f", "#7fffff", "#7fbfff", "#7f7fff", "#bf7fff", "#ff7fff", "#c4c4c4"];
export const MAX_IMAGES = 300;
export const MAX_TIERS = 50;
export const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif,image/bmp,image/svg+xml";

export function createBoard(): TierBoard {
  return {
    version: 1,
    title: "My tier list",
    tiers: ["S", "A", "B", "C", "D"].map((label, index) => ({ id: `tier-${label}`, label, color: TIER_COLORS[index], imageIds: [] })),
    images: [],
    unranked: [],
    tileSize: 80,
  };
}

export function nextTierLabel(labels: string[]) {
  return "SABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").find((label) => !labels.includes(label)) ?? "New tier";
}