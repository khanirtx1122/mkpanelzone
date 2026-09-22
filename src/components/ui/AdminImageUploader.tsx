"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface AdminImageUploaderProps {
  name: string;
  defaultValue?: string;
  bucket?: string;
  folder?: string;
}

export function AdminImageUploader({
  name,
  defaultValue = "",
  bucket = "media",
  folder = "uploads",
}: AdminImageUploaderProps) {
  const [url, setUrl] = useState<string>(defaultValue);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const originalExt = file.name.split('.').pop() || 'png';
      const filename = `${uniqueSuffix}.${originalExt}`;
      const filePath = `${folder}/${filename}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          contentType: file.type || 'image/png',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setUrl(publicUrlData.publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const clearImage = () => {
    setUrl("");
  };

  return (
    <div className="space-y-4">
      {/* Hidden input to pass value in FormData */}
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="relative group w-full max-w-sm rounded-lg border border-white/10 overflow-hidden bg-black aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Uploaded preview" className="w-full h-full object-cover" />
          
          <div className="absolute inset-0 bg-black/50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={clearImage}
              className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
              title="Remove Image"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`
            w-full max-w-sm aspect-video rounded-lg border-2 border-dashed 
            flex flex-col items-center justify-center cursor-pointer transition-colors
            ${error ? 'border-red-500/50 bg-red-500/5 hover:bg-red-500/10' : 'border-white/10 bg-black/20 hover:bg-white/5'}
          `}
        >
          {isUploading ? (
            <div className="flex flex-col items-center text-brand-blue-400">
              <Loader2 className="animate-spin mb-2" size={24} />
              <span className="text-xs font-bold tracking-widest uppercase">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-brand-ink-3 hover:text-white transition-colors">
              <ImageIcon className="mb-2 opacity-50" size={32} />
              <span className="text-xs font-bold tracking-widest uppercase">Click or Drag Image</span>
              <span className="text-[10px] mt-1 opacity-50 font-mono">Max 5MB (JPG, PNG, WEBP)</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 font-mono">{error}</p>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
