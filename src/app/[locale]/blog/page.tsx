import type { Metadata } from "next";
import ScrollReveal from "@/components/ScrollReveal";
import { createAuthServerClient } from "@/lib/supabase/server";
import { Locale } from "@/lib/i18n";
import { resolveJournalVideo } from "@/lib/journal-video-embed";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isFr = locale === "fr";
  return {
    title: isFr ? "Journal | Histoires du studio" : "Journal | Stories from the Studio",
    description: isFr
      ? "Coulisses, philosophie du design et rituels horlogers Ciavaglia."
      : "Behind-the-scenes notes, design philosophy, and watchmaking rituals from Ciavaglia.",
    openGraph: {
      title: isFr ? "Journal | Ciavaglia Timepieces" : "Journal | Ciavaglia Timepieces",
    },
  };
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "2-digit" });
}

export default async function BlogPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const isFr = locale === "fr";

  const supabase = await createAuthServerClient();
  const { data: posts } = await supabase
    .from("journal_posts")
    .select("id, title, excerpt, body, image_url, video_url, published_at, locale")
    .order("published_at", { ascending: false });

  const list = (posts ?? []).filter((p) => !p.locale || p.locale === locale);

  return (
    <section className="px-6">
      <div className="mx-auto max-w-5xl space-y-10">
        <ScrollReveal>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
              {isFr ? "Journal" : "Journal"}
            </p>
            <h1 className="mt-4 text-4xl text-white">
              {isFr ? "Histoires Ciavaglia." : "Stories from the studio."}
            </h1>
            <p className="mt-4 text-white/80">
              {isFr
                ? "Coulisses, philosophie du design et rituels horlogers."
                : "Behind-the-scenes notes, design philosophy, and watchmaking rituals."}
            </p>
          </div>
        </ScrollReveal>
        <div className="grid gap-6">
          {list.length === 0 ? (
            <ScrollReveal>
              <p className="rounded-[26px] border border-white/70 bg-white/80 p-10 text-center text-foreground text-foreground/70">
                {isFr ? "Aucun article pour le moment." : "No posts yet."}
              </p>
            </ScrollReveal>
          ) : (
            list.map((post) => (
              <ScrollReveal key={post.id}>
                <article className="rounded-[26px] border border-white/70 bg-white/80 p-6 text-foreground shadow-[0_20px_70px_rgba(15,20,23,0.1)]">
                  <p className="text-xs uppercase tracking-[0.3em] text-foreground/50">
                    {formatDate(post.published_at)}
                  </p>
                  <h2 className="mt-4 text-2xl">{post.title}</h2>
                  <p className="mt-3 text-foreground/70">{post.excerpt}</p>
                  {post.image_url ? (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-foreground/10">
                      {/* eslint-disable-next-line @next/next/no-img-element -- admin-supplied URLs from any https origin */}
                      <img
                        src={post.image_url}
                        alt={post.title ? `${post.title}` : ""}
                        className="max-h-[min(480px,70vh)] w-full object-cover"
                      />
                    </div>
                  ) : null}
                  {(() => {
                    const v = resolveJournalVideo(post.video_url);
                    if (!v) return null;
                    if (v.kind === "iframe") {
                      return (
                        <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl border border-foreground/10 bg-black/5">
                          <iframe
                            src={v.src}
                            className="h-full w-full border-0"
                            title={post.title ? `${post.title} — video` : "Video"}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      );
                    }
                    if (v.kind === "video") {
                      return (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-foreground/10">
                          <video src={v.src} controls className="max-h-[min(480px,70vh)] w-full" playsInline>
                            {isFr ? "Vidéo non prise en charge." : "Your browser does not support video."}
                          </video>
                        </div>
                      );
                    }
                    return (
                      <p className="mt-4">
                        <a
                          href={v.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground underline underline-offset-4"
                        >
                          {isFr ? "Voir la vidéo" : "Watch video"}
                        </a>
                      </p>
                    );
                  })()}
                  {post.body && (
                    <p className="mt-4 whitespace-pre-wrap text-foreground/80">{post.body}</p>
                  )}
                </article>
              </ScrollReveal>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
