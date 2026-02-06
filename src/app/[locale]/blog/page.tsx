import type { Metadata } from "next";
import ScrollReveal from "@/components/ScrollReveal";
import { createAuthServerClient } from "@/lib/supabase/server";
import { Locale } from "@/lib/i18n";

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
    .select("id, title, excerpt, body, published_at, locale")
    .order("published_at", { ascending: false });

  const list = (posts ?? []).filter((p) => !p.locale || p.locale === locale);

  return (
    <section className="px-6">
      <div className="mx-auto max-w-5xl space-y-10">
        <ScrollReveal>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-foreground/50">
              {isFr ? "Journal" : "Journal"}
            </p>
            <h1 className="mt-4 text-4xl">
              {isFr ? "Histoires Ciavaglia." : "Stories from the studio."}
            </h1>
            <p className="mt-4 text-foreground/70">
              {isFr
                ? "Coulisses, philosophie du design et rituels horlogers."
                : "Behind-the-scenes notes, design philosophy, and watchmaking rituals."}
            </p>
          </div>
        </ScrollReveal>
        <div className="grid gap-6">
          {list.length === 0 ? (
            <ScrollReveal>
              <p className="rounded-[26px] border border-white/70 bg-white/80 p-10 text-center text-foreground/70">
                {isFr ? "Aucun article pour le moment." : "No posts yet."}
              </p>
            </ScrollReveal>
          ) : (
            list.map((post) => (
              <ScrollReveal key={post.id}>
                <article className="rounded-[26px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,20,23,0.1)]">
                  <p className="text-xs uppercase tracking-[0.3em] text-foreground/50">
                    {formatDate(post.published_at)}
                  </p>
                  <h2 className="mt-4 text-2xl">{post.title}</h2>
                  <p className="mt-3 text-foreground/70">{post.excerpt}</p>
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
