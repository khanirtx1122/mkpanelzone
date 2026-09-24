"use client";

import { AdminMediaUploader } from "@/components/ui/AdminMediaUploader";

/**
 * AdminImageUploader — image-specialised entry point over the shared
 * `AdminMediaUploader` core (spec §53).
 *
 * Kept as a named component so existing call sites and their `name` /
 * `defaultValue` contract stay unchanged.
 */
export interface AdminImageUploaderProps {
  name: string;
  defaultValue?: string;
  bucket?: string;
  folder?: string;
  label?: string;
}

export function AdminImageUploader({
  name,
  defaultValue = "",
  bucket = "media",
  folder = "uploads",
  label,
}: AdminImageUploaderProps) {
  return (
    <AdminMediaUploader
      kind="image"
      name={name}
      defaultValue={defaultValue}
      bucket={bucket}
      folder={folder}
      label={label}
    />
  );
}
