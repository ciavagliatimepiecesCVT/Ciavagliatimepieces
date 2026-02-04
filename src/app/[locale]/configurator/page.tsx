import Configurator from "@/components/Configurator";
import { Locale } from "@/lib/i18n";

export default async function ConfiguratorPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  return (
    <section className="min-h-screen bg-neutral-900">
      <Configurator locale={locale} />
    </section>
  );
}
