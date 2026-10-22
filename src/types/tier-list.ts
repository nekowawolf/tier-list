export interface TierImage {
  id: string;
  name: string;
  src: string;
}

export interface Tier {
  id: string;
  label: string;
  color: string;
  imageIds: string[];
}

export interface TierBoard {
  version: 1;
  title: string;
  tiers: Tier[];
  images: TierImage[];
  unranked: string[];
  tileSize: number;
}

export interface DropTarget {
  containerId: string;
  beforeId?: string;
}

export type SaveStatus = "loading" | "saving" | "saved" | "error";