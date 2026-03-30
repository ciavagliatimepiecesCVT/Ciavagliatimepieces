import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getPublicConfiguratorData, getProductConfiguratorConfig } from "@/app/[locale]/account/admin/actions";
import { createServerClient } from "@/lib/supabase/server";
import { Locale } from "@/lib/i18n";

const Configurator = dynamic(() => import("@/components/Configurator"), {
  ssr: true,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center bg-[var(--logo-green)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
    </div>
  ),
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isFr = locale === "fr";
  return {
    title: isFr ? "Configurateur | Créez votre montre" : "Configurator | Design Your Watch",
    description: isFr
      ? "Configurez votre montre sur mesure : boîtier, cadran, aiguilles, bracelet. Prix en direct."
      : "Design your custom watch: case, dial, hands, strap. Live pricing and instant add-to-cart.",
    openGraph: {
      title: isFr ? "Configurateur | Ciavaglia Timepieces" : "Configurator | Ciavaglia Timepieces",
    },
  };
}

export default async function ConfiguratorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ edit?: string; product?: string; adminPreset?: string; productName?: string; saved?: string }>;
}) {
  const { locale } = await params;
  const { edit: editCartItemId, product: productId, adminPreset, productName, saved: savedConfigurationId } = await searchParams;
  const supabase = createServerClient();
  const [{ data: freeShipRow }, initialConfigData, initialProductConfig] = await Promise.all([
    supabase.from("site_settings").select("value").eq("key", "configurator_free_shipping").maybeSingle(),
    getPublicConfiguratorData(),
    productId ? getProductConfiguratorConfig(productId) : Promise.resolve(null),
  ]);
  const configuratorFreeShipping =
    freeShipRow?.value === "true" || freeShipRow?.value === "1";

  const decodedProductName =
    typeof productName === "string"
      ? (() => {
          try {
            return decodeURIComponent(productName);
          } catch {
            return "";
          }
        })()
      : "";
  const adminPresetProduct =
    adminPreset && productId ? { id: productId, name: decodedProductName } : undefined;

  return (
    <section className="min-h-screen bg-[var(--logo-green)]">
      <Configurator
        locale={locale}
        editCartItemId={editCartItemId ?? undefined}
        productId={productId ?? undefined}
        savedConfigurationId={savedConfigurationId ?? undefined}
        initialProductConfig={initialProductConfig ?? undefined}
        initialData={initialConfigData}
        adminPresetProduct={adminPresetProduct}
        configuratorFreeShipping={configuratorFreeShipping}
      />
    </section>
  );
}
