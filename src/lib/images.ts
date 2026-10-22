import type { TierImage } from "@/types/tier-list";

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = setTimeout(() => reject(new Error("Image loading timed out.")), 15000);
    image.onload = () => { clearTimeout(timer); resolve(image); };
    image.onerror = () => { clearTimeout(timer); reject(new Error("This image could not be opened.")); };
    image.src = src;
  });
}

export async function importImage(file: File): Promise<TierImage> {
  if (!file.type.startsWith("image/") && !/\.(png|jpe?g|webp|gif|avif|bmp|svg)$/i.test(file.name)) throw new Error("Not an image.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Images must be smaller than 20 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 50_000_000) throw new Error("Image dimensions are too large.");
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 384;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is unavailable.");
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    context.imageSmoothingQuality = "high";
    context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 384, 384);
    return { id: crypto.randomUUID(), name: file.name, src: canvas.toDataURL("image/webp", 0.9) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function importImageUrl(value: string): Promise<TierImage> {
  let url: URL;
  try { url = new URL(value.trim()); }
  catch { throw new Error("Enter a valid image URL, starting with https:// or http://."); }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Use a public HTTP or HTTPS image URL without login credentials.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let file: File;
  try {
    const response = await fetch(url.href, { mode: "cors", credentials: "omit", referrerPolicy: "no-referrer", signal: controller.signal });
    if (!response.ok) throw new Error(`The image could not be downloaded (HTTP ${response.status}). Check the link or upload the file instead.`);
    const limit = 20 * 1024 * 1024;
    if (Number(response.headers.get("content-length")) > limit) throw new Error("Images must be smaller than 20 MB.");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("The image response is empty. Try another link.");
    const chunks: ArrayBuffer[] = [];
    let size = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > limit) { controller.abort(); throw new Error("Images must be smaller than 20 MB."); }
      chunks.push(chunk.value.slice().buffer);
    }
    const type = response.headers.get("content-type")?.split(";")[0].trim() ?? "";
    if (type.includes("text/html")) throw new Error("This link opens a web page. Use the image's direct URL instead.");
    const name = url.pathname.split("/").pop() || "Linked image";
    file = new File(chunks, name, { type });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("The image download timed out. Try again or upload the file instead.");
    if (error instanceof TypeError) throw new Error("This link could not be accessed. The host may block browser downloads (CORS). Download the image and upload it instead.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
  return importImage(file);
}