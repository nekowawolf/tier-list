export type HsvColor = { hue: number; saturation: number; value: number };

export function hexToHsv(hex: string): HsvColor {
  const [red, green, blue] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
  }
  return { hue: (hue * 60 + 360) % 360, saturation: max ? delta / max : 0, value: max };
}

export function hsvToHex({ hue, saturation, value }: HsvColor): string {
  const h = ((hue % 360) + 360) % 360 / 60;
  const s = Math.max(0, Math.min(1, saturation));
  const v = Math.max(0, Math.min(1, value));
  const chroma = v * s;
  const x = chroma * (1 - Math.abs(h % 2 - 1));
  const channels = h < 1 ? [chroma, x, 0] : h < 2 ? [x, chroma, 0] : h < 3 ? [0, chroma, x] : h < 4 ? [0, x, chroma] : h < 5 ? [x, 0, chroma] : [chroma, 0, x];
  return `#${channels.map((channel) => Math.round((channel + v - chroma) * 255).toString(16).padStart(2, "0")).join("")}`;
}

/** Coordinates relative to the wheel center, normalized to its radius. */
export function wheelPositionToColor(x: number, y: number) {
  return { hue: (Math.atan2(y, x) * 180 / Math.PI + 360) % 360, saturation: Math.min(1, Math.hypot(x, y)) };
}