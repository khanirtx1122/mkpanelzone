"use client";

import * as React from "react";
import { X, Loader2, Image as ImageIcon, Video as VideoIcon, AlertCircle, ExternalLink } from "lucide-react";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabaseClient";
import { FieldLabel, Input } from "@/components/ui/Input";

/**
 * AdminMediaUploader — the single upload control for admin media fields
 * (spec §53: one reusable component instead of two near-identical copies).
 *
 * Two real defects in the previous implementation are fixed here:
 *
 * 1. §52 — the video uploader animated a *fabricated* percentage
 *    (`setInterval(() => setProgress(p => Math.min(p + 5, 90)), 500)`). It now
 *    reports genuine byte progress from an XHR upload.
 * 2. §52 — the dropzones read "Click or Drag" but had no drop handlers at all.
 *    Drag-and-drop now actually works, with a visible drag-over state.
 *
 * A third gap is closed while we are here: the video field previously offered
 * *only* file upload, so a `demoVideoType` of YOUTUBE or VIMEO could never be
 * configured. A paste-a-URL path is now available for video.
 */

type Kind = "image" | "video";

export interface AdminMediaUploaderProps {
  /** FormData field name — passed through untouched. */
  name: string;
  kind: Kind;
  label?: string;
  defaultValue?: string;
  bucket?: string;
  folder?: string;
  /** Allow pasting a remote URL instead of uploading. Defaults to true for video. */
  allowUrl?: boolean;
}

const LIMITS: Record<Kind, { maxBytes: number; accept: string; hint: string }> = {
  image: {
    maxBytes: 5 * 1024 * 1024,
    accept: "image/*",
    hint: "JPG, PNG or WebP · up to 5 MB",
  },
  video: {
    maxBytes: 50 * 1024 * 1024,
    accept: "video/mp4,video/webm",
    hint: "MP4 or WebM · up to 50 MB",
  },
};

/** Extensions a `<video>` element can actually play directly. */
const DIRECT_VIDEO_EXT = /\.(mp4|webm|ogv|ogg|mov|m4v)(\?|#|$)/i;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Upload a file to Supabase Storage with real progress reporting.
 *
 * The Supabase JS client's `upload()` uses `fetch`, which cannot report request
 * progress, which is why the original code invented a number. XHR is the only
 * browser API that exposes upload progress, and it hits the same storage
 * endpoint with the same publishable key, so bucket policies behave identically.
 */
function uploadWithProgress(
  file: File,
  bucket: string,
  filePath: string,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`);

    xhr.setRequestHeader("Authorization", `Bearer ${SUPABASE_ANON_KEY}`);
    xhr.setRequestHeader("apikey", SUPABASE_ANON_KEY);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve(`${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`);
        return;
      }
      /* Supabase returns a JSON body with a `message` on failure. */
      let message = `Upload failed (HTTP ${xhr.status}).`;
      try {
        const body = JSON.parse(xhr.responseText);
        if (body && typeof body.message === "string") message = body.message;
      } catch {
        /* Non-JSON error body — keep the generic message. */
      }
      reject(new Error(message));
    };

    xhr.onerror = () => reject(new Error("Network error — the upload could not be completed."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));

    xhr.send(file);
  });
}

export function AdminMediaUploader({
  name,
  kind,
  label,
  defaultValue = "",
  bucket = "media",
  folder = "uploads",
  allowUrl = kind === "video",
}: AdminMediaUploaderProps) {
  const [url, setUrl] = React.useState(defaultValue);
  const [isUploading, setIsUploading] = React.useState(false);
  /** `null` while uploading but before the first progress event arrives. */
  const [progress, setProgress] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [manualUrl, setManualUrl] = React.useState("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dragDepth = React.useRef(0);

  const limits = LIMITS[kind];
  const fieldId = React.useId();

  const handleFile = React.useCallback(
    async (file: File) => {
      if (file.size > limits.maxBytes) {
        setError(
          `That file is ${formatBytes(file.size)}. The limit for ${kind === "image" ? "images" : "video"} is ${formatBytes(limits.maxBytes)}.`
        );
        return;
      }

      setError(null);
      setIsUploading(true);
      setProgress(null);

      try {
        const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = (file.name.split(".").pop() || (kind === "image" ? "png" : "mp4")).toLowerCase();
        const filePath = `${folder}/${suffix}.${ext}`;

        const publicUrl = await uploadWithProgress(file, bucket, filePath, setProgress);
        setUrl(publicUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "The upload failed.");
      } finally {
        setIsUploading(false);
        setProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [bucket, folder, kind, limits.maxBytes]
  );

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
  };

  /* ── Drag and drop ─────────────────────────────────────────────────────── */
  const onDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const onDragOver = (event: React.DragEvent) => {
    /* Required, otherwise the browser opens the file instead of dropping it. */
    event.preventDefault();
  };

  const onDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setIsDragging(false);
    }
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    if (isUploading) return;

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    /* Dropping a non-media file is a user error worth naming explicitly. */
    const expected = kind === "image" ? "image/" : "video/";
    if (file.type && !file.type.startsWith(expected)) {
      setError(`That looks like a ${file.type.split("/")[0]} file. This field accepts ${kind === "image" ? "images" : "videos"} only.`);
      return;
    }

    void handleFile(file);
  };

  const applyManualUrl = () => {
    const trimmed = manualUrl.trim();
    if (!trimmed) return;
    setUrl(trimmed);
    setManualUrl("");
    setError(null);
  };

  const isPlayable = kind === "video" && DIRECT_VIDEO_EXT.test(url);

  return (
    <div className="space-y-3">
      {/* The value that actually posts with the form */}
      <input type="hidden" name={name} value={url} />

      {label && <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>}

      {url ? (
        /* ── Filled state ─────────────────────────────────────────────────── */
        <div className="group relative w-full max-w-[380px] overflow-hidden rounded-[14px] border border-border-subtle bg-surface">
          <div className="relative aspect-video">
            {kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="Uploaded preview" className="h-full w-full object-cover" />
            ) : isPlayable ? (
              <video
                src={url}
                className="h-full w-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center">
                <VideoIcon className="text-brand-ink-2 opacity-70" size={30} aria-hidden />
                <span className="break-all font-mono text-[11px] text-brand-ink-2">
                  {url.split("/").pop()}
                </span>
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100 max-md:bg-gradient-to-t max-md:from-black/70 max-md:via-transparent max-md:to-transparent max-md:items-end max-md:justify-end max-md:p-2">
              <a
                href={url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                title="Open in a new tab"
              >
                <ExternalLink size={15} aria-hidden />
                <span className="sr-only">Open in a new tab</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setUrl("");
                  setError(null);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-colors hover:border-[color:var(--status-danger-border)] hover:bg-[color:var(--status-danger-solid)]"
                title="Remove"
              >
                <X size={16} aria-hidden />
                <span className="sr-only">Remove {kind === "image" ? "image" : "video"}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Empty state ──────────────────────────────────────────────────── */
        <div
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => {
            if (!isUploading) fileInputRef.current?.click();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              if (!isUploading) fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-disabled={isUploading || undefined}
          aria-label={`Upload ${kind === "image" ? "an image" : "a video"}`}
          className={[
            "flex w-full max-w-[380px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed px-5 py-8 text-center transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]",
            isUploading ? "cursor-progress" : "",
            isDragging
              ? "border-border-strong bg-foreground/[0.07]"
              : error
                ? "border-[color:var(--status-danger-border)] bg-[color:var(--status-danger-bg)]"
                : "border-border-strong bg-foreground/[0.02] hover:border-border-strong hover:bg-foreground/[0.04]",
          ].join(" ")}
        >
          {isUploading ? (
            <>
              {kind === "image" ? (
                <ImageIcon className="animate-pulse text-brand-ink-2" size={26} aria-hidden />
              ) : (
                <Loader2 className="animate-spin text-brand-ink-2" size={26} aria-hidden />
              )}
              <span className="text-[12px] font-bold uppercase tracking-[0.09em] text-brand-ink-2">
                Uploading
                {progress !== null ? ` ${progress}%` : "…"}
              </span>
              {/* Real progress, or an indeterminate sweep before the first byte lands */}
              <span className="mt-1 block h-1 w-[70%] overflow-hidden rounded-full bg-foreground/[0.08]">
                {progress !== null ? (
                  <span
                    className="block h-full rounded-full bg-brand-blue-500 transition-[width] duration-200"
                    style={{ width: `${progress}%` }}
                  />
                ) : (
                  <span className="upload-indeterminate block h-full w-1/3 rounded-full bg-brand-blue-500" />
                )}
              </span>
            </>
          ) : (
            <>
              {kind === "image" ? (
                <ImageIcon className="text-brand-ink-4" size={26} aria-hidden />
              ) : (
                <VideoIcon className="text-brand-ink-4" size={26} aria-hidden />
              )}
              <span className="text-[12px] font-bold uppercase tracking-[0.09em] text-brand-ink-2">
                {isDragging ? "Drop to upload" : "Click to browse, or drag a file here"}
              </span>
              <span className="text-[11px] text-brand-ink-4">{limits.hint}</span>
            </>
          )}
        </div>
      )}

      {/* Paste-a-URL escape hatch — required to configure YouTube / Vimeo sources */}
      {allowUrl && !url && !isUploading && (
        <div className="flex max-w-[380px] items-center gap-2">
          <Input
            id={fieldId}
            value={manualUrl}
            onChange={(event) => setManualUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyManualUrl();
              }
            }}
            placeholder="…or paste a URL"
            aria-label="Paste a media URL"
          />
          {/* Matches the Input's own 52px height rather than overriding it —
              two conflicting height utilities resolve by stylesheet order,
              which is not something worth depending on. */}
          <button
            type="button"
            onClick={applyManualUrl}
            disabled={!manualUrl.trim()}
            className="h-[52px] shrink-0 rounded-[12px] border border-border-subtle px-3.5 text-[11px] font-bold uppercase tracking-[0.07em] text-brand-ink-2 transition-colors hover:border-border-strong hover:text-foreground disabled:opacity-40"
          >
            Use
          </button>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 text-[11.5px] leading-relaxed text-[color:var(--status-danger-text)]"
        >
          <AlertCircle size={13} className="mt-[1px] shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={onInputChange}
        accept={limits.accept}
        className="hidden"
        tabIndex={-1}
      />
    </div>
  );
}
