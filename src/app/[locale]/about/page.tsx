import type { Metadata } from "next";
import ScrollReveal from "@/components/ScrollReveal";
import { getAboutSettings } from "@/app/[locale]/account/admin/actions";
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
    title: isFr ? "A propos | Ciavaglia Timepieces" : "About Me | Ciavaglia Timepieces",
    description: isFr
      ? "Decouvrez l'histoire et la vision de Ciavaglia Timepieces."
      : "Discover the story and vision behind Ciavaglia Timepieces.",
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const isFr = locale === "fr";
  const about = await getAboutSettings();
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
              <div className="mb-6 overflow-hidden rounded-2xl border border-foreground/10">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-supplied URLs from any https origin */}
                <img
                  src={about.image_url}
                  alt={about.title}
                  className="max-h-[min(480px,70vh)] w-full object-cover"
                />
              </div>
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
              ) : (
                <p className="mb-6">
                  <a
                    href={video.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline underline-offset-4"
                  >
                    {isFr ? "Voir la vidéo" : "Watch video"}
                  </a>
                </p>
              )
            ) : null}
            <p className="whitespace-pre-line text-foreground/80">{about.body}</p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
