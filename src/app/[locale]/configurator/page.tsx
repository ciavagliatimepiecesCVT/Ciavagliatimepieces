import Configurator from "@/components/Configurator";
import ScrollReveal from "@/components/ScrollReveal";
import { Locale } from "@/lib/i18n";

export default async function ConfiguratorPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const isFr = locale === "fr";

  return (
    <section className="px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <ScrollReveal>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-foreground/50">
              {isFr ? "Configurateur" : "Configurator"}
            </p>
            <h1 className="mt-4 text-4xl">
              {isFr ? "Creez votre montre Ciavaglia." : "Build your own Ciavaglia watch."}
            </h1>
            <p className="mt-4 text-foreground/70">
              {isFr
                ? "Personnalisez chaque detail, puis payez en toute securite. L'atelier recoit votre configuration instantanement."
                : "Customize every detail, then checkout securely. The atelier receives your exact configuration instantly."}
            </p>
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <Configurator locale={locale} />
        </ScrollReveal>
      </div>
    </section>
  );
}
