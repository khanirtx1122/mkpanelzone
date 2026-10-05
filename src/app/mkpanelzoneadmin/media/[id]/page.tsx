import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Save, Video, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { AdminImageUploader } from "@/components/ui/AdminImageUploader";
import { AdminVideoUploader } from "@/components/ui/AdminVideoUploader";

export default async function ProductMediaDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const product = await prisma.product.findUnique({
    where: { id: params.id }
  });

  if (!product) return notFound();

  async function saveMedia(formData: FormData) {
    "use server";

    const coverImageUrl = formData.get("coverImageUrl") as string;
    const demoVideoUrl = formData.get("demoVideoUrl") as string;
    const demoVideoType = formData.get("demoVideoType") as string;
    const demoVideoPosterUrl = formData.get("demoVideoPosterUrl") as string;
    
    const videoAutoplay = formData.get("videoAutoplay") === "on";
    const videoMutedDefault = formData.get("videoMutedDefault") === "on";
    const videoLoop = formData.get("videoLoop") === "on";
    const videoEnabled = formData.get("videoEnabled") === "on";

    try {
      await prisma.product.update({
        where: { id: params.id },
        data: { 
          coverImageUrl, 
          demoVideoUrl, 
          demoVideoType,
          demoVideoPosterUrl,
          videoAutoplay,
          videoMutedDefault,
          videoLoop,
          videoEnabled
        }
      });
      revalidatePath("/mkpanelzoneadmin/media");
      redirect("/mkpanelzoneadmin/media");
    } catch (error) {
      console.error(error);
      redirect(`/mkpanelzoneadmin/media/${params.id}?error=failed`);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/mkpanelzoneadmin/media" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-brand-ink-3 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">
            Media Setup: {product.name}
          </h1>
          <p className="text-sm text-brand-ink-3 mt-1 font-mono">
            Configure images, video players, and media settings.
          </p>
        </div>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl p-6">
        <form action={saveMedia} className="space-y-8">
          
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <ImageIcon className="text-brand-blue-400" size={18} /> Image Configuration
            </h2>
            
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Cover Image</label>
              <AdminImageUploader 
                name="coverImageUrl" 
                defaultValue={product.coverImageUrl || ""} 
              />
              <p className="text-xs text-brand-ink-3 font-mono">Main thumbnail used across the site.</p>
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Video className="text-brand-blue-400" size={18} /> Video Configuration
              </h2>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  name="videoEnabled"
                  id="videoEnabled"
                  defaultChecked={product.videoEnabled}
                  className="w-4 h-4 accent-brand-blue-500 bg-black/50 border-white/10" 
                />
                <label htmlFor="videoEnabled" className="text-xs font-bold tracking-widest uppercase text-white">Enable Video Player</label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Video File</label>
                <AdminVideoUploader 
                  name="demoVideoUrl" 
                  defaultValue={product.demoVideoUrl || ""} 
                />
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Video Type</label>
                  <select 
                    name="demoVideoType"
                    defaultValue={product.demoVideoType || "DIRECT"}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
                  >
                    <option value="DIRECT">Direct MP4/WebM Link</option>
                    <option value="YOUTUBE">YouTube</option>
                    <option value="VIMEO">Vimeo</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Video Poster / Thumbnail (Optional)</label>
                  <AdminImageUploader 
                    name="demoVideoPosterUrl" 
                    defaultValue={product.demoVideoPosterUrl || ""} 
                  />
                  <p className="text-xs text-brand-ink-3 font-mono">Image shown while the video loads.</p>
                </div>
              </div>
            </div>

            <div className="bg-black/30 border border-white/5 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  name="videoAutoplay"
                  id="videoAutoplay"
                  defaultChecked={product.videoAutoplay}
                  className="w-4 h-4 accent-brand-blue-500 bg-black/50 border-white/10" 
                />
                <label htmlFor="videoAutoplay" className="text-sm text-white font-bold">Autoplay</label>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  name="videoLoop"
                  id="videoLoop"
                  defaultChecked={product.videoLoop}
                  className="w-4 h-4 accent-brand-blue-500 bg-black/50 border-white/10" 
                />
                <label htmlFor="videoLoop" className="text-sm text-white font-bold">Loop</label>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  name="videoMutedDefault"
                  id="videoMutedDefault"
                  defaultChecked={product.videoMutedDefault}
                  className="w-4 h-4 accent-brand-blue-500 bg-black/50 border-white/10" 
                />
                <label htmlFor="videoMutedDefault" className="text-sm text-white font-bold">Muted by Default</label>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex items-center justify-end">
            <button 
              type="submit" 
              className="inline-flex items-center gap-2 px-6 py-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
            >
              <Save size={16} /> Save Media Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
