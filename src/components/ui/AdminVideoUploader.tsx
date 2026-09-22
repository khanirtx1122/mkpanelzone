"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Video as VideoIcon } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface AdminVideoUploaderProps {
  name: string;
  defaultValue?: string;
  bucket?: string;
  folder?: string;
}

export function AdminVideoUploader({
  name,
  defaultValue = "",
  bucket = "media",
  folder = "uploads",
}: AdminVideoUploaderProps) {
  const [url, setUrl] = useState<string>(defaultValue);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g. 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError("File must be less than 50MB");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setProgress(10); // Start progress

      // Fake progress
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 5, 90));
      }, 500);

      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const originalExt = file.name.split('.').pop() || 'mp4';
      const filename = `${uniqueSuffix}.${originalExt}`;
      const filePath = `${folder}/${filename}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          contentType: file.type || 'video/mp4',
          upsert: false
        });

      clearInterval(progressInterval);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setProgress(100);
      setUrl(publicUrlData.publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload file.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 1000);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const clearVideo = () => {
    setUrl("");
  };

  return (
    <div className="space-y-4">
      {/* Hidden input to pass value in FormData */}
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="relative group w-full max-w-sm rounded-lg border border-white/10 overflow-hidden bg-black aspect-video flex flex-col justify-center items-center">
          <VideoIcon className="text-brand-blue-400 mb-2 opacity-50" size={32} />
          <span className="text-xs text-white font-mono break-all px-4 text-center">
            {url.split('/').pop()}
          </span>
          <a href={url} target="_blank" rel="noreferrer" className="text-[10px] text-brand-blue-400 hover:underline mt-2 relative z-10">View File</a>
          
          <div className="absolute inset-0 bg-black/50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none md:pointer-events-auto group-hover:pointer-events-auto">
            <button
              type="button"
              onClick={clearVideo}
              className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg pointer-events-auto"
              title="Remove Video"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`
            w-full max-w-sm aspect-video rounded-lg border-2 border-dashed 
            flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden
            ${error ? 'border-red-500/50 bg-red-500/5 hover:bg-red-500/10' : 'border-white/10 bg-black/20 hover:bg-white/5'}
            ${isUploading ? 'cursor-not-allowed opacity-80' : ''}
          `}
        >
          {isUploading && (
            <div 
              className="absolute bottom-0 left-0 h-1 bg-brand-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          )}

          {isUploading ? (
            <div className="flex flex-col items-center text-brand-blue-400 z-10">
              <Loader2 className="animate-spin mb-2" size={24} />
              <span className="text-xs font-bold tracking-widest uppercase">Uploading {progress}%</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-brand-ink-3 hover:text-white transition-colors z-10">
              <VideoIcon className="mb-2 opacity-50" size={32} />
              <span className="text-xs font-bold tracking-widest uppercase">Click or Drag Video</span>
              <span className="text-[10px] mt-1 opacity-50 font-mono">Max 50MB (MP4, WebM)</span>
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
        accept="video/mp4,video/webm"
        className="hidden"
      />
    </div>
  );
}
