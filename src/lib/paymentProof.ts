import { cache } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * PAYMENT PROOF PIPELINE — single source of truth.
 *
 * Root cause this module fixes: order proofs were never uploaded. The old code
 * stored a fabricated `/uploads/<random>-<filename>` string and returned
 * success, so Admin always saw a broken image. Agent proofs *were* uploaded but
 * the absolute public URL was persisted, which breaks the moment the storage
 * host, bucket or policy changes.
 *
 * The rules enforced here:
 *   • A proof is only recorded after Supabase Storage confirms the upload.
 *   • What is stored in the database is a STORAGE OBJECT PATH
 *     (`payment-proofs/…`), never a temporary/absolute URL.
 *   • Display URLs are derived on demand, so old rows keep working.
 *   • Legacy `/uploads/…` values (files that were never really uploaded) are
 *     detected as missing instead of rendering a broken image icon.
 */

export const MEDIA_BUCKET = "media";
export const PROOF_FOLDER = "payment-proofs";
/** Legacy folder used by the agent flow before this module existed. */
export const LEGACY_UPLOAD_FOLDER = "uploads";

export const MAX_PROOF_BYTES = 8 * 1024 * 1024; // 8 MB — phone screenshots are far smaller.

/**
 * Accepted proof types. HEIC/HEIF are accepted because iPhones can hand them
 * over; they are flagged as `inlineVisible: false` so the Admin UI offers a
 * download instead of a broken <img>.
 */
const ACCEPTED: Record<string, { ext: string; inlineVisible: boolean; label: string }> = {
  "image/jpeg": { ext: "jpg", inlineVisible: true, label: "JPEG image" },
  "image/jpg": { ext: "jpg", inlineVisible: true, label: "JPEG image" },
  "image/png": { ext: "png", inlineVisible: true, label: "PNG image" },
  "image/webp": { ext: "webp", inlineVisible: true, label: "WebP image" },
  "image/gif": { ext: "gif", inlineVisible: true, label: "GIF image" },
  "image/heic": { ext: "heic", inlineVisible: false, label: "HEIC image" },
  "image/heif": { ext: "heif", inlineVisible: false, label: "HEIF image" },
  "application/pdf": { ext: "pdf", inlineVisible: false, label: "PDF document" },
};

const EXT_FALLBACK: Record<string, keyof typeof ACCEPTED> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
};

export type ProofUpload =
  | { ok: true; path: string; inlineVisible: boolean; label: string }
  | { ok: false; error: string };

function storageBase(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uvqsbebblbgjpktdoplk.supabase.co";
  return url.replace(/\/+$/, "");
}

/** Human-safe, collision-free object name derived from the upload. */
function buildObjectName(originalName: string, ext: string, scope: string): string {
  const safeScope = scope.replace(/[^a-z0-9-]/gi, "").slice(0, 24) || "proof";
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  // The original name is kept only as a readable slug — never trusted verbatim.
  const base = (originalName.split(/[\\/]/).pop() || "proof")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .toLowerCase() || "proof";
  return `${PROOF_FOLDER}/${safeScope}-${stamp}-${rand}-${base}.${ext}`;
}

/**
 * Uploads a payment proof and returns the STORAGE OBJECT PATH.
 * Never returns success unless storage confirmed the object.
 */
export async function uploadPaymentProof(
  file: File,
  scope: string
): Promise<ProofUpload> {
  if (!file || file.size === 0) {
    return { ok: false, error: "Please choose a payment screenshot." };
  }
  if (file.size > MAX_PROOF_BYTES) {
    return {
      ok: false,
      error: `That file is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Please use a screenshot under 8 MB.`,
    };
  }

  const rawExt = (file.name.split(".").pop() || "").toLowerCase();
  const declared = (file.type || "").toLowerCase();
  const mime = ACCEPTED[declared] ? declared : EXT_FALLBACK[rawExt];

  if (!mime) {
    return {
      ok: false,
      error:
        "Unsupported file type. Please upload a JPEG, PNG, WebP or PDF. (Newer iPhones: Settings → Camera → Formats → Most Compatible.)",
    };
  }

  const meta = ACCEPTED[mime];
  const objectPath = buildObjectName(file.name, meta.ext, scope);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(objectPath, buffer, {
        contentType: mime === "image/jpg" ? "image/jpeg" : mime,
        upsert: false,
        cacheControl: "31536000",
      });

    if (error) {
      console.error("[uploadPaymentProof] storage error:", error.message);
      return { ok: false, error: "Upload failed. Please check your connection and try again." };
    }

    /* Confirm the object really exists before the caller may report success.
       IMPORTANT: this must NOT use storage.list() — the storage list API
       requires a SELECT policy that the public key does not have, so it always
       returns an empty array here and would reject every legitimate upload.
       A ranged GET on the object's own URL is authoritative; see
       objectExistsAt — Supabase reports a missing object as HTTP 400 with a
       404-shaped body, so only that response counts as "not stored". */
    const stored = await objectExistsAt(
      `${storageBase()}/storage/v1/object/public/${MEDIA_BUCKET}/${encodeURI(objectPath)}`
    );
    if (stored === false) {
      console.error("[uploadPaymentProof] stored object not reachable:", objectPath);
      return { ok: false, error: "Upload could not be verified. Please try again." };
    }

    return { ok: true, path: objectPath, inlineVisible: meta.inlineVisible, label: meta.label };
  } catch (error) {
    console.error("[uploadPaymentProof] unexpected:", error);
    return { ok: false, error: "Upload failed. Please try again." };
  }
}

/* ------------------------------------------------------------------ *
 * Reference handling — old rows hold absolute URLs or "/uploads/x".
 * ------------------------------------------------------------------ */

export type ProofRef = {
  /** Raw value as stored in the database. */
  raw: string;
  /** Storage object path when we could derive one ("" for foreign URLs). */
  objectPath: string;
  /** Folder the object lives in, used for existence checks. */
  folder: string;
  /** Original filename inside the folder. */
  fileName: string;
  /** A usable absolute URL for a browser. */
  url: string;
  /** False for formats a browser cannot render inline (HEIC/PDF). */
  inlineVisible: boolean;
};

const INLINE_BY_EXT: Record<string, boolean> = {
  jpg: true, jpeg: true, png: true, webp: true, gif: true,
  heic: false, heif: false, pdf: false,
};

/** Splits an absolute Supabase object URL back into its bucket object path. */
function objectPathFromUrl(value: string): string | null {
  const marker = "/storage/v1/object/";
  const idx = value.indexOf(marker);
  if (idx === -1) return null;
  const rest = value.slice(idx + marker.length); // public/media/<path> | sign/media/<path>
  const slash = rest.indexOf("/");
  if (slash === -1) return null;
  const afterVisibility = rest.slice(slash + 1); // media/<path>
  const bucketSlash = afterVisibility.indexOf("/");
  if (bucketSlash === -1) return null;
  const bucket = afterVisibility.slice(0, bucketSlash);
  if (bucket !== MEDIA_BUCKET) return null;
  return decodeURIComponent(afterVisibility.slice(bucketSlash + 1).split("?")[0]);
}

/** Turns any stored proof value into everything the UI needs. Returns null for empty. */
export function resolveProof(raw: string | null | undefined): ProofRef | null {
  const value = (raw || "").trim();
  if (!value) return null;

  let objectPath = "";
  let url = "";

  if (/^https?:\/\//i.test(value)) {
    const derived = objectPathFromUrl(value);
    if (derived) {
      objectPath = derived;
      url = `${storageBase()}/storage/v1/object/public/${MEDIA_BUCKET}/${encodeURI(objectPath)}`;
    } else {
      // Foreign host (old CDN, Google Drive, …) — display it as-is.
      return {
        raw: value,
        objectPath: "",
        folder: "",
        fileName: "",
        url: value,
        inlineVisible: true,
      };
    }
  } else {
    objectPath = value.replace(/^\/+/, "");
    url = `${storageBase()}/storage/v1/object/public/${MEDIA_BUCKET}/${encodeURI(objectPath)}`;
  }

  const parts = objectPath.split("/");
  const fileName = parts.pop() || "";
  const folder = parts.join("/");
  const ext = (fileName.split(".").pop() || "").toLowerCase();

  return {
    raw: value,
    objectPath,
    folder,
    fileName,
    url,
    inlineVisible: INLINE_BY_EXT[ext] ?? true,
  };
}

/**
 * Authoritative existence probe for a stored object.
 *
 * A one-byte ranged GET is used instead of HEAD because Supabase Storage does
 * NOT answer a missing object with 404: it answers **HTTP 400** with the body
 * `{"statusCode":"404","code":"NoSuchKey"}`. A HEAD-only check therefore read
 * every missing proof as present and rendered a broken image for the Owner.
 * A ranged GET costs one byte when the object exists (206) and returns that
 * JSON body when it does not (400), so the two cases are unambiguous.
 *
 * `false` is returned ONLY for a definitive not-found. Timeouts, permission
 * responses and other transient failures return `true`, because wrongly
 * telling the Owner that a customer's proof is missing is far worse than
 * showing a link that turns out to be unavailable.
 *
 * Cached per request so the same proof is never probed twice.
 */
export const objectExistsAt = cache(async (url: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) return true; // 200 / 206 — object is there
    if (res.status === 404) return false; // standard not-found
    if (res.status === 400) {
      // Supabase's "not found" arrives as 400 + a 404-shaped JSON body.
      try {
        const body = await res.text();
        if (/"statusCode"\s*:\s*"?404"?|NoSuchKey|"error"\s*:\s*"not_found"/i.test(body)) {
          return false;
        }
      } catch {
        /* unreadable body — treat as unknown, i.e. present */
      }
    }
    return true;
  } catch {
    return true;
  }
});

export type ResolvedProof = ProofRef & { exists: boolean };

/**
 * Resolves a stored proof reference and whether its object still exists.
 * Foreign URLs are assumed valid (we cannot verify another host cheaply).
 */
export async function resolveProofWithExistence(
  raw: string | null | undefined
): Promise<ResolvedProof | null> {
  const ref = resolveProof(raw);
  if (!ref) return null;
  if (!ref.objectPath) return { ...ref, exists: true };

  const exists = await objectExistsAt(ref.url);
  return { ...ref, exists };
}
