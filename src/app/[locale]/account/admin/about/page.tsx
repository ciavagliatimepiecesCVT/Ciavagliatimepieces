"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ScrollReveal from "@/components/ScrollReveal";
import { getAboutSettings, setAboutSettings, uploadAboutImage, uploadAboutVideo } from "../actions";
import type { AboutSettings } from "@/lib/about-settings";
import AdminImageEditor from "@/components/admin/AdminImageEditor";
import VideoLinkCard from "@/components/VideoLinkCard";
import { detectVideoPlatform, resolveJournalVideo } from "@/lib/journal-video-embed";

function isLinkUrl(url: string) {
  const resolved = resolveJournalVideo(url);
  return resolved?.kind === "link";
}

export default function AdminAboutPage() {
  const params = useParams<{ locale?: string | string[] }>();
  const locale = Array.isArray(params.locale) ? params.locale[0] : params.locale ?? "en";
  const isFr = locale === "fr";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AboutSettings | null>(null);

  // Derived: the link field shows the URL only when it's an external link (not a direct video file)
  const [linkInput, setLinkInput] = useState("");

  // Image crop state
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImageSource, setCropImageSource] = useState<string | null>(null);

  useEffect(() => {
    getAboutSettings()
      .then((settings) => {
        setData(settings);
        if (isLinkUrl(settings.video_url)) {
          setLinkInput(settings.video_url);
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
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
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const objectUrl = URL.createObjectURL(file);
      setCropImageSource(objectUrl);
      setCropOpen(true);
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
        setLinkInput(""); // clear link field
        setData({ ...data, video_url: url });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploadingVideo(false);
      }
    };
    input.click();
  };

  const handleLinkChange = (val: string) => {
    setLinkInput(val);
    if (!data) return;
    if (val.trim() === "") {
      if (isLinkUrl(data.video_url)) setData({ ...data, video_url: "" });
    } else {
      setData({ ...data, video_url: val.trim() });
    }
  };

  const clearVideo = () => {
    if (!data) return;
    setData({ ...data, video_url: "" });
    setLinkInput("");
  };

  // The currently saved video is an uploaded file (not an external link)
  const uploadedVideoUrl = data?.video_url && !isLinkUrl(data.video_url) ? data.video_url : "";

  if (loading || !data) {
    return <div className="py-8 text-white/70">{isFr ? "Chargement..." : "Loading..."}</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-white">{isFr ? "A propos" : "About"}</h1>

      {error && <p className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-200">{error}</p>}

      <ScrollReveal>
        <div className="space-y-5 rounded-xl border border-white/20 bg-white/5 p-6 text-white">
          {/* Title */}
          <div>
            <label className="text-xs text-white/60">{isFr ? "Titre" : "Title"}</label>
            <input
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white"
            />
          </div>

          {/* Image */}
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
                className="shrink-0 rounded-lg border border-white/20 px-4 py-2 text-xs uppercase tracking-wider text-white"
              >
                {isFr ? "Envoyer" : "Upload"}
              </button>
            </div>
            {data.image_url ? (
              <div className="mt-3 max-w-xs overflow-hidden rounded-xl border border-white/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.image_url} alt="Preview" className="max-h-48 w-full object-cover" />
              </div>
            ) : null}
          </div>

          {/* Video — two options */}
          <div className="space-y-4">
            <label className="text-xs text-white/60">{isFr ? "Vidéo (optionnel)" : "Video (optional)"}</label>

            {/* Option 1: Upload file */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-sm font-medium text-white/80">
                {isFr ? "Option 1 — Téléverser un fichier vidéo" : "Option 1 — Upload a video file"}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={pickAboutVideo}
                  disabled={uploadingVideo}
                  className="shrink-0 rounded-lg border border-white/20 px-4 py-2 text-xs uppercase tracking-wider text-white disabled:opacity-50"
                >
                  {uploadingVideo ? "…" : isFr ? "Choisir un fichier" : "Choose file"}
                </button>
                {uploadedVideoUrl ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate text-xs text-white/50">{uploadedVideoUrl}</span>
                    <button
                      type="button"
                      onClick={clearVideo}
                      className="shrink-0 text-xs text-white/40 hover:text-white/70"
                      title={isFr ? "Supprimer" : "Remove"}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-white/30">
                    {isFr ? "MP4, WebM ou MOV — max 100 Mo" : "MP4, WebM or MOV — max 100MB"}
                  </span>
                )}
              </div>
              {uploadedVideoUrl ? (
                <video
                  src={uploadedVideoUrl}
                  controls
                  className="mt-3 max-h-48 w-full max-w-xs rounded-xl border border-white/20"
                />
              ) : null}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-white/30">{isFr ? "OU" : "OR"}</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Option 2: External link */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-sm font-medium text-white/80">
                {isFr ? "Option 2 — Lien vidéo" : "Option 2 — Video link"}
              </p>
              <p className="mb-3 text-xs text-white/40">
                {isFr
                  ? "Instagram, TikTok, YouTube, Facebook, X ou tout autre lien"
                  : "Instagram, TikTok, YouTube, Facebook, X, or any other link"}
              </p>
              <div className="flex gap-2">
                <input
                  value={linkInput}
                  onChange={(e) => handleLinkChange(e.target.value)}
                  placeholder="https://…"
                  className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
                />
                {linkInput && (
                  <button
                    type="button"
                    onClick={() => handleLinkChange("")}
                    className="shrink-0 rounded-lg border border-white/20 px-3 py-2 text-xs text-white/40 hover:text-white/70"
                    title={isFr ? "Supprimer" : "Remove"}
                  >
                    ✕
                  </button>
                )}
              </div>
              {linkInput && resolveJournalVideo(linkInput)?.kind === "link" ? (
                <div className="mt-3">
                  <VideoLinkCard
                    href={linkInput}
                    platform={detectVideoPlatform(linkInput)}
                    dark
                  />
                </div>
              ) : linkInput && resolveJournalVideo(linkInput)?.kind === "iframe" ? (
                <p className="mt-2 text-xs text-white/50">
                  {isFr ? "Sera intégré comme lecteur vidéo." : "Will be embedded as a video player."}
                </p>
              ) : linkInput ? (
                <p className="mt-2 text-xs text-red-400">
                  {isFr ? "URL invalide" : "Invalid URL"}
                </p>
              ) : null}
            </div>
          </div>

          {/* Body */}
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

      <AdminImageEditor
        open={cropOpen}
        onClose={() => {
          setCropOpen(false);
          if (cropImageSource?.startsWith("blob:")) URL.revokeObjectURL(cropImageSource);
          setCropImageSource(null);
        }}
        imageSource={cropImageSource}
        onSave={(url) => {
          if (data) setData({ ...data, image_url: url });
        }}
        onUpload={uploadAboutImage}
        locale={locale}
        label={isFr ? "Recadrer l'image" : "Crop image"}
        aspect={16 / 9}
      />
    </div>
  );
}
