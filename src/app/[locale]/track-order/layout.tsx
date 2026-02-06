import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isFr = locale === "fr";
  return {
    title: isFr ? "Suivi de commande" : "Track Order",
    description: isFr
      ? "Suivez votre commande Ciavaglia avec votre numéro de commande."
      : "Track your Ciavaglia order with your order number.",
    robots: { index: false, follow: true },
  };
}

export default function TrackOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
