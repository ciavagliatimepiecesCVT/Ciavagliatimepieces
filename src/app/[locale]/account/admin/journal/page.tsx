"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ScrollReveal from "@/components/ScrollReveal";
import {
  getAdminJournalPosts,
  createJournalPost,
  updateJournalPost,
  deleteJournalPost,
  uploadJournalImage,
  uploadJournalVideo,
} from "../actions";

type JournalPost = {
  id: string;
  title: string | null;
  excerpt: string | null;
  body: string | null;
  image_url: string | null;
  video_url: string | null;
  published_at: string | null;
  locale: string | null;
};

type JournalFormState = {
  title: string;
  excerpt: string;
  body: string;
  locale: string;
  image_url: string;
  video_url: string;
};

const emptyJournalForm = (): JournalFormState => ({
  title: "",
  excerpt: "",
  body: "",
  locale: "en",
  image_url: "",
  video_url: "",
});

export default function AdminJournalPage() {
  const params = useParams<{ locale?: string | string[] }>();
  const locale = Array.isArray(params.locale) ? params.locale[0] : params.locale ?? "en";
  const isFr = locale === "fr";
  const [journalPosts, setJournalPosts] = useState<JournalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddJournal, setShowAddJournal] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [journalForm, setJournalForm] = useState<JournalFormState>(emptyJournalForm);
  const [uploadingJournalImage, setUploadingJournalImage] = useState(false);
  const [uploadingJournalVideo, setUploadingJournalVideo] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAdminJournalPosts();
        setJournalPosts(data as JournalPost[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unauthorized");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const startEditJournal = (post: JournalPost) => {
    setEditingJournalId(post.id);
    setJournalForm({
      title: post.title ?? "",
      excerpt: post.excerpt ?? "",
      body: post.body ?? "",
      locale: post.locale ?? "en",
      image_url: post.image_url ?? "",
      video_url: post.video_url ?? "",
    });
    setError(null);
  };

  const cancelEditJournal = () => {
    setEditingJournalId(null);
    setJournalForm(emptyJournalForm());
  };

  const pickJournalImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/gif";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploadingJournalImage(true);
      setError(null);
      try {
        const fd = new FormData();
        fd.set("image", file);
        const { url } = await uploadJournalImage(fd);
        setJournalForm((p) => ({ ...p, image_url: url }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploadingJournalImage(false);
      }
    };
    input.click();
  };

  const pickJournalVideo = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploadingJournalVideo(true);
      setError(null);
      try {
        const fd = new FormData();
        fd.set("video", file);
        const { url } = await uploadJournalVideo(fd);
        setJournalForm((p) => ({ ...p, video_url: url }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploadingJournalVideo(false);
      }
    };
    input.click();
  };

  const handleSaveJournal = async () => {
    if (!editingJournalId) return;
    setError(null);
    try {
      await updateJournalPost(editingJournalId, {
        title: journalForm.title,
        excerpt: journalForm.excerpt,
        body: journalForm.body || null,
        locale: journalForm.locale,
        image_url: journalForm.image_url || null,
        video_url: journalForm.video_url || null,
      });
      setJournalPosts(await getAdminJournalPosts());
      cancelEditJournal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const handleAddJournal = async () => {
    if (!journalForm.title.trim()) return;
    setError(null);
    try {
      await createJournalPost({
        title: journalForm.title,
        excerpt: journalForm.excerpt,
        body: journalForm.body || null,
        locale: journalForm.locale,
        image_url: journalForm.image_url || null,
        video_url: journalForm.video_url || null,
      });
      setJournalPosts(await getAdminJournalPosts());
      setShowAddJournal(false);
      setJournalForm(emptyJournalForm());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add post");
    }
  };

  const handleDeleteJournal = async (id: string) => {
    if (!confirm(isFr ? "Supprimer cet article ?" : "Delete this post?")) return;
    setError(null);
    try {
      await deleteJournalPost(id);
      setJournalPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <p className="text-white/90">{isFr ? "Chargement..." : "Loading..."}</p>
      </div>
    );
  }

  if (error && !journalPosts.length) {
    return (
      <div className="py-12">
        <p className="text-red-600">{error}</p>
        <a href={`/${locale}/account/manage`} className="mt-4 inline-block text-sm text-white underline hover:text-white/90">
          {isFr ? "Retour au compte" : "Back to account"}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ScrollReveal>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white">{isFr ? "Journal" : "Journal"}</h1>
            <p className="mt-1 text-white/90">
              {isFr ? "Ajoutez et modifiez les articles du journal." : "Add and edit journal posts."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowAddJournal(true);
              setJournalForm(emptyJournalForm());
              setError(null);
            }}
            className="rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.3em] text-white"
          >
            {isFr ? "Nouvel article" : "New post"}
          </button>
        </div>
      </ScrollReveal>

      {error && journalPosts.length > 0 && (
        <p className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {showAddJournal && (
        <ScrollReveal>
          <div className="rounded-[28px] border border-white/70 bg-white/80 p-6 text-foreground shadow-[0_24px_90px_rgba(15,20,23,0.1)]">
            <h2 className="text-xl">{isFr ? "Nouvel article" : "New post"}</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">Title</label>
                <input value={journalForm.title} onChange={(e) => setJournalForm((p) => ({ ...p, title: e.target.value }))} className="mt-1 w-full rounded-full border border-foreground/20 bg-white px-4 py-2" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">Excerpt</label>
                <input value={journalForm.excerpt} onChange={(e) => setJournalForm((p) => ({ ...p, excerpt: e.target.value }))} className="mt-1 w-full rounded-full border border-foreground/20 bg-white px-4 py-2" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                  {isFr ? "Image (optionnel)" : "Image (optional)"}
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    value={journalForm.image_url}
                    onChange={(e) => setJournalForm((p) => ({ ...p, image_url: e.target.value }))}
                    placeholder="https://…"
                    className="min-w-0 flex-1 rounded-full border border-foreground/20 bg-white px-4 py-2"
                  />
                  <button
                    type="button"
                    onClick={pickJournalImage}
                    disabled={uploadingJournalImage}
                    className="shrink-0 rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-[0.2em] disabled:opacity-50"
                  >
                    {uploadingJournalImage ? "…" : isFr ? "Envoyer" : "Upload"}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                  {isFr ? "Vidéo (optionnel)" : "Video (optional)"}
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    value={journalForm.video_url}
                    onChange={(e) => setJournalForm((p) => ({ ...p, video_url: e.target.value }))}
                    placeholder={isFr ? "URL ou fichier MP4/WebM/MOV" : "URL or upload MP4/WebM/MOV (max 100MB)"}
                    className="min-w-0 flex-1 rounded-full border border-foreground/20 bg-white px-4 py-2"
                  />
                  <button
                    type="button"
                    onClick={pickJournalVideo}
                    disabled={uploadingJournalVideo}
                    className="shrink-0 rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-[0.2em] disabled:opacity-50"
                  >
                    {uploadingJournalVideo ? "…" : isFr ? "Envoyer" : "Upload"}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">Body (optional)</label>
                <textarea value={journalForm.body} onChange={(e) => setJournalForm((p) => ({ ...p, body: e.target.value }))} rows={4} className="mt-1 w-full rounded-xl border border-foreground/20 bg-white px-4 py-2" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">Locale</label>
                <select value={journalForm.locale} onChange={(e) => setJournalForm((p) => ({ ...p, locale: e.target.value }))} className="mt-1 w-full rounded-full border border-foreground/20 bg-white px-4 py-2">
                  <option value="en">en</option>
                  <option value="fr">fr</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={handleAddJournal} className="btn-hover rounded-full bg-foreground px-6 py-2 text-xs uppercase tracking-[0.2em] text-white">
                {isFr ? "Créer" : "Create"}
              </button>
              <button type="button" onClick={() => setShowAddJournal(false)} className="rounded-full border border-foreground/20 px-6 py-2 text-xs uppercase tracking-[0.2em]">
                {isFr ? "Annuler" : "Cancel"}
              </button>
            </div>
          </div>
        </ScrollReveal>
      )}

      <div className="space-y-6">
        {journalPosts.map((post) => (
          <ScrollReveal key={post.id}>
            <div className="rounded-[28px] border border-white/70 bg-white/80 p-6 text-foreground shadow-[0_24px_90px_rgba(15,20,23,0.1)]">
              {editingJournalId === post.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">Title</label>
                    <input value={journalForm.title} onChange={(e) => setJournalForm((p) => ({ ...p, title: e.target.value }))} className="mt-1 w-full rounded-full border border-foreground/20 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">Excerpt</label>
                    <input value={journalForm.excerpt} onChange={(e) => setJournalForm((p) => ({ ...p, excerpt: e.target.value }))} className="mt-1 w-full rounded-full border border-foreground/20 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                      {isFr ? "Image" : "Image"}
                    </label>
                    <div className="mt-1 flex gap-2">
                      <input
                        value={journalForm.image_url}
                        onChange={(e) => setJournalForm((p) => ({ ...p, image_url: e.target.value }))}
                        className="min-w-0 flex-1 rounded-full border border-foreground/20 bg-white px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={pickJournalImage}
                        disabled={uploadingJournalImage}
                        className="shrink-0 rounded-full border border-foreground/20 px-3 py-2 text-xs disabled:opacity-50"
                      >
                        {uploadingJournalImage ? "…" : isFr ? "Envoyer" : "Upload"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                      {isFr ? "Vidéo" : "Video"}
                    </label>
                    <div className="mt-1 flex gap-2">
                      <input
                        value={journalForm.video_url}
                        onChange={(e) => setJournalForm((p) => ({ ...p, video_url: e.target.value }))}
                        placeholder={isFr ? "URL ou fichier" : "URL or file"}
                        className="min-w-0 flex-1 rounded-full border border-foreground/20 bg-white px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={pickJournalVideo}
                        disabled={uploadingJournalVideo}
                        className="shrink-0 rounded-full border border-foreground/20 px-3 py-2 text-xs disabled:opacity-50"
                      >
                        {uploadingJournalVideo ? "…" : isFr ? "Envoyer" : "Upload"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">Body</label>
                    <textarea value={journalForm.body} onChange={(e) => setJournalForm((p) => ({ ...p, body: e.target.value }))} rows={3} className="mt-1 w-full rounded-xl border border-foreground/20 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">Locale</label>
                    <select value={journalForm.locale} onChange={(e) => setJournalForm((p) => ({ ...p, locale: e.target.value }))} className="mt-1 w-full rounded-full border border-foreground/20 bg-white px-3 py-2 text-sm">
                      <option value="en">en</option>
                      <option value="fr">fr</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleSaveJournal} className="btn-hover rounded-full bg-foreground px-4 py-2 text-xs uppercase tracking-[0.2em] text-white">
                      {isFr ? "Enregistrer" : "Save"}
                    </button>
                    <button type="button" onClick={cancelEditJournal} className="rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-[0.2em]">
                      {isFr ? "Annuler" : "Cancel"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-semibold">{post.title}</h3>
                    <p className="mt-1 text-sm text-foreground/70">{post.excerpt}</p>
                    <p className="mt-1 text-xs text-foreground/50">
                      {post.locale ?? "en"} · {post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => startEditJournal(post)} className="rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-[0.2em]">
                      {isFr ? "Modifier" : "Edit"}
                    </button>
                    <button type="button" onClick={() => handleDeleteJournal(post.id)} className="btn-hover rounded-full border border-red-200 px-4 py-2 text-xs uppercase tracking-[0.2em] text-red-600">
                      {isFr ? "Supprimer" : "Delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
