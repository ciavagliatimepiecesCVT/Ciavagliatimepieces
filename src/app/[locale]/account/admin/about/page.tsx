"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ScrollReveal from "@/components/ScrollReveal";
import { getAboutSettings, setAboutSettings, uploadAboutImage, uploadAboutVideo } from "../actions";
import type { AboutSettings } from "@/lib/about-settings";

export default function AdminAboutPage() {
  const params = useParams<{ locale?: string | string[] }>();
  const locale = Array.isArray(params.locale) ? params.locale[0] : params.locale ?? "en";
  const isFr = locale === "fr";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AboutSettings | null>(null);

  useEffect(() => {
    getAboutSettings().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      await setAboutSettings(data);
      if (isFr) alert("Page a propos enregistree.");
      else alert("About page saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const pickAboutImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/gif";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !data) return;
      setUploadingImage(true);
      setError(null);
      try {
        const fd = new FormData();
        fd.set("image", file);
        const { url } = await uploadAboutImage(fd);
        setData({ ...data, image_url: url });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploadingImage(false);
      }
    };
    input.click();
  };

  const pickAboutVideo = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !data) return;
      setUploadingVideo(true);
      setError(null);
      try {
        const fd = new FormData();
        fd.set("video", file);
        const { url } = await uploadAboutVideo(fd);
        setData({ ...data, video_url: url });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploadingVideo(false);
      }
    };
    input.click();
  };

  if (loading || !data) {
    return <div className="py-8 text-white/70">{isFr ? "Chargement..." : "Loading..."}</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-white">{isFr ? "A propos" : "About"}</h1>
      <p className="max-w-xl text-sm text-white/70">
        {isFr
          ? "Modifiez le titre, le corps, et ajoutez une image ou une vidéo (fichier MP4/WebM/MOV jusqu'à 100 Mo, ou lien YouTube/Vimeo)."
          : "Edit the title and body; add an image or video (upload MP4/WebM/MOV up to 100MB, or paste a YouTube/Vimeo/direct link)."}
      </p>

      {error && <p className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-200">{error}</p>}

      <ScrollReveal>
        <div className="space-y-5 rounded-xl border border-white/20 bg-white/5 p-6 text-white">
          <div>
            <label className="text-xs text-white/60">{isFr ? "Titre" : "Title"}</label>
            <input
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-white/60">{isFr ? "Image (optionnel)" : "Image (optional)"}</label>
            <div className="mt-1 flex gap-2">
              <input
                value={data.image_url}
                onChange={(e) => setData({ ...data, image_url: e.target.value })}
                placeholder="https://…"
                className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/40"
              />
              <button
                type="button"
                onClick={pickAboutImage}
                disabled={uploadingImage}
                className="shrink-0 rounded-lg border border-white/20 px-4 py-2 text-xs uppercase tracking-wider text-white disabled:opacity-50"
              >
                {uploadingImage ? "…" : isFr ? "Envoyer" : "Upload"}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/60">{isFr ? "Vidéo (optionnel)" : "Video (optional)"}</label>
            <div className="mt-1 flex gap-2">
              <input
                value={data.video_url}
                onChange={(e) => setData({ ...data, video_url: e.target.value })}
                placeholder={isFr ? "URL ou fichier (max 100 Mo)" : "URL or upload (max 100MB)"}
                className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/40"
              />
              <button
                type="button"
                onClick={pickAboutVideo}
                disabled={uploadingVideo}
                className="shrink-0 rounded-lg border border-white/20 px-4 py-2 text-xs uppercase tracking-wider text-white disabled:opacity-50"
              >
                {uploadingVideo ? "…" : isFr ? "Envoyer" : "Upload"}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/60">{isFr ? "Corps" : "Body"}</label>
            <textarea
              value={data.body}
              onChange={(e) => setData({ ...data, body: e.target.value })}
              rows={10}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-[var(--logo-gold)] px-6 py-3 text-sm font-medium text-[var(--logo-green)] disabled:opacity-50"
            >
              {saving ? "…" : isFr ? "Enregistrer" : "Save"}
            </button>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
