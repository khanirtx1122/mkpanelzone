"use client";

import { AdminMediaUploader } from "@/components/ui/AdminMediaUploader";

/**
 * AdminVideoUploader — video-specialised entry point over the shared
 * `AdminMediaUploader` core (spec §53).
 *
 * Unlike the previous implementation this one reports real byte progress and
 * allows a pasted URL, which is the only way to configure a `YOUTUBE` or
 * `VIMEO` demo video.
 */
export interface AdminVideoUploaderProps {
  name: string;
  defaultValue?: string;
  bucket?: string;
  folder?: string;
  label?: string;
  allowUrl?: boolean;
}

export function AdminVideoUploader({
  name,
  defaultValue = "",
  bucket = "media",
  folder = "uploads",
  label,
  allowUrl = true,
}: AdminVideoUploaderProps) {
  return (
    <AdminMediaUploader
      kind="video"
      name={name}
      defaultValue={defaultValue}
      bucket={bucket}
      folder={folder}
      label={label}
      allowUrl={allowUrl}
    />
  );
}
