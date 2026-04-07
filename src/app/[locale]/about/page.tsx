import type { Metadata } from "next";
import ScrollReveal from "@/components/ScrollReveal";
import { getAboutSettings } from "@/app/[locale]/account/admin/actions";
import { Locale } from "@/lib/i18n";
import { resolveJournalVideo } from "@/lib/journal-video-embed";
import { isAdmin } from "@/lib/admin";
import { createAuthServerClient } from "@/lib/supabase/server";
import AboutImageReposition from "@/components/AboutImageReposition";
import VideoLinkCard from "@/components/VideoLinkCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isFr = locale === "fr";
  return {
    title: isFr ? "A propos | Ciavaglia Timepieces" : "About Me | Ciavaglia Timepieces",
    description: isFr
      ? "Decouvrez l'histoire et la vision de Ciavaglia Timepieces."
      : "Discover the story and vision behind Ciavaglia Timepieces.",
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const isFr = locale === "fr";
  const [about, supabase] = await Promise.all([
    getAboutSettings(),
    createAuthServerClient(),
  ]);
  const { data: { user } } = await supabase.auth.getUser();
  const adminUser = isAdmin(user?.id);
  const video = resolveJournalVideo(about.video_url);

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-4xl space-y-8">
        <ScrollReveal>
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">
            {isFr ? "A propos" : "About"}
          </p>
          <h1 className="mt-4 text-4xl text-white">{about.title}</h1>
        </ScrollReveal>
        <ScrollReveal>
          <div className="rounded-[26px] border border-white/70 bg-white/80 p-6 text-foreground shadow-[0_20px_70px_rgba(15,20,23,0.1)]">
            {about.image_url ? (
              adminUser ? (
                <AboutImageReposition
                  src={about.image_url}
                  alt={about.title}
                  initialPosition={about.image_position ?? "50% 50%"}
                  isFr={isFr}
                />
              ) : (
                <div className="mb-6 overflow-hidden rounded-2xl border border-foreground/10">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin-supplied URLs from any https origin */}
                  <img
                    src={about.image_url}
                    alt={about.title}
                    className="max-h-[min(480px,70vh)] w-full object-cover"
                    style={{ objectPosition: about.image_position ?? "50% 50%" }}
                  />
                </div>
              )
            ) : null}
            {video ? (
              video.kind === "iframe" ? (
                <div className="mb-6 aspect-video w-full overflow-hidden rounded-2xl border border-foreground/10 bg-black/5">
                  <iframe
                    src={video.src}
                    className="h-full w-full border-0"
                    title={about.title ? `${about.title} — video` : "Video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : video.kind === "video" ? (
                <div className="mb-6 overflow-hidden rounded-2xl border border-foreground/10">
                  <video src={video.src} controls className="max-h-[min(480px,70vh)] w-full" playsInline>
                    {isFr ? "Vidéo non prise en charge." : "Your browser does not support video."}
                  </video>
                </div>
              ) : video.kind === "link" ? (
                <div className="mb-6">
                  <VideoLinkCard href={video.href} platform={video.platform} />
                </div>
              ) : null
            ) : null}
            <p className="whitespace-pre-line text-foreground/80">{about.body}</p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
