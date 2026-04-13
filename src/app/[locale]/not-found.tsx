import Link from "next/link";

export default function NotFound() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-white/70 bg-white/80 p-10 text-center text-foreground shadow-[0_24px_90px_rgba(15,20,23,0.1)]">
        <p className="text-xs uppercase tracking-[0.4em] text-foreground/50">404</p>
        <h1 className="mt-4 text-3xl font-medium">Page not found</h1>
        <p className="mt-4 text-foreground/70">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/en"
            className="btn-hover rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.3em] text-white"
          >
            Return Home
          </Link>
          <Link
            href="/en/shop"
            className="btn-hover rounded-full border border-foreground/30 px-6 py-3 text-xs uppercase tracking-[0.3em] text-foreground/70"
          >
            Explore Watches
          </Link>
        </div>
      </div>
    </section>
  );
}
