import Configurator from "@/components/Configurator";
import { Locale } from "@/lib/i18n";

export default async function ConfiguratorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { locale } = await params;
  const { edit: editCartItemId } = await searchParams;

  return (
    <section className="min-h-screen bg-neutral-900">
      <Configurator locale={locale} editCartItemId={editCartItemId ?? undefined} />
    </section>
  );
}
