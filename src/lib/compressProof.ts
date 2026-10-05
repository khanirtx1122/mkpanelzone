"use client";

/**
 * CLIENT-SIDE SCREENSHOT COMPRESSION.
 *
 * Payment proofs don't need 3 MB phone screenshots: what matters is readable
 * transaction details. This runs in the browser before upload — no server
 * round-trip, no extra dependency — and targets roughly 200 KB while keeping
 * text legible (downscale to a sane max dimension, then binary-search the
 * JPEG quality). If anything fails (old browser, canvas taint), the ORIGINAL
 * file is returned so the upload still succeeds — compression must never
 * block a payment.
 */

const TARGET_BYTES = 200 * 1024;
const MAX_DIMENSION = 1600;
const MIN_QUALITY = 0.5;

export async function compressProofImage(file: File): Promise<File> {
  try {
    if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
    if (file.size <= TARGET_BYTES) return file; // already small enough

    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // White backdrop: PNG screenshots with transparency flatten correctly.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    // Binary-search the lowest quality that stays at/under the target.
    let low = MIN_QUALITY;
    let high = 0.92;
    let best: Blob | null = null;

    const render = async (quality: number): Promise<Blob | null> =>
      new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality));

    while (high - low > 0.04) {
      const mid = (low + high) / 2;
      const blob = await render(mid);
      if (!blob) break;
      if (blob.size > TARGET_BYTES) {
        high = mid;
      } else {
        best = blob;
        low = mid;
      }
    }

    if (!best) best = await render(low);
    if (!best || best.size >= file.size) return file; // compression didn't help

    const name = file.name.replace(/\.[^.]+$/, "") + "-optimized.jpg";
    return new File([best], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file; // never block a payment on compression
  }
}
