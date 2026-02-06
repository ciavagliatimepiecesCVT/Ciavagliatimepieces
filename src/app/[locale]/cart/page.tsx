import CartView from "@/components/CartView";
import { getDictionary, Locale } from "@/lib/i18n";

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dictionary = getDictionary(locale as Locale);
  const labels = dictionary.cart;

  return <CartView locale={locale} labels={labels} />;
}
