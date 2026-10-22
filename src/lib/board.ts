import type { DropTarget, TierBoard } from "@/types/tier-list";

export function moveImage(board: TierBoard, imageId: string, target: DropTarget): TierBoard {
  if (!board.images.some((image) => image.id === imageId)) return board;
  if (target.beforeId === imageId) return board;
  if (target.containerId !== "unranked" && !board.tiers.some((tier) => tier.id === target.containerId)) return board;
  const insert = (ids: string[]) => {
    const result = ids.filter((id) => id !== imageId);
    const index = target.beforeId ? result.indexOf(target.beforeId) : -1;
    result.splice(index < 0 ? result.length : index, 0, imageId);
    return result;
  };
  const next = {
    ...board,
    unranked: target.containerId === "unranked" ? insert(board.unranked) : board.unranked.filter((id) => id !== imageId),
    tiers: board.tiers.map((tier) => ({ ...tier, imageIds: tier.id === target.containerId ? insert(tier.imageIds) : tier.imageIds.filter((id) => id !== imageId) })),
  };
  const unchanged = next.unranked.join() === board.unranked.join() && next.tiers.every((tier, index) => tier.imageIds.join() === board.tiers[index].imageIds.join());
  return unchanged ? board : next;
}

export function removeImage(board: TierBoard, imageId: string): TierBoard {
  return {
    ...board,
    images: board.images.filter((image) => image.id !== imageId),
    unranked: board.unranked.filter((id) => id !== imageId),
    tiers: board.tiers.map((tier) => ({ ...tier, imageIds: tier.imageIds.filter((id) => id !== imageId) })),
  };
}

export function labelTextColor(hex: string) {
  const values = hex.slice(1).match(/.{2}/g)?.map((value) => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) ?? [1, 1, 1];
  const luminance = values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  return luminance > 0.179 ? "#171717" : "#ffffff";
}