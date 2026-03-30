import { redirect } from "next/navigation";

/**
 * /checkout → /checkout/review so the pre-Stripe step is always explicitly "review order".
 */
export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(sp)) {
    if (val === undefined) continue;
    if (Array.isArray(val)) {
      for (const v of val) qs.append(key, v);
    } else {
      qs.set(key, val);
    }
  }
  const q = qs.toString();
  redirect(`/${locale}/checkout/review${q ? `?${q}` : ""}`);
}
