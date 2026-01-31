import Link from "next/link";

export default async function CheckoutSuccess({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isFr = locale === "fr";

  return (
    <section className="px-6">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-white/70 bg-white/80 p-10 text-center shadow-[0_24px_90px_rgba(15,20,23,0.1)]">
        <p className="text-xs uppercase tracking-[0.4em] text-foreground/50">
          {isFr ? "Paiement recu" : "Payment received"}
        </p>
        <h1 className="mt-4 text-3xl">
          {isFr ? "Votre commande est confirmee." : "Your Civaglia order is confirmed."}
        </h1>
        <p className="mt-4 text-foreground/70">
          {isFr
            ? "Un e-mail de confirmation arrive. L'atelier prepare votre piece."
            : "A confirmation email is on the way. The atelier has been notified and will begin your build."}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href={`/${locale}/account/manage`}
            className="rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.3em] text-white"
          >
            {isFr ? "Voir le compte" : "View account"}
          </Link>
          <Link
            href={`/${locale}/shop`}
            className="rounded-full border border-foreground/30 px-6 py-3 text-xs uppercase tracking-[0.3em] text-foreground/70"
          >
            {isFr ? "Continuer" : "Continue shopping"}
          </Link>
        </div>
      </div>
    </section>
  );
}
