export default function ShopLoading() {
  return (
    <section className="min-h-[100svh] bg-[var(--logo-green)] px-6 pb-12">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="space-y-4">
          <div className="h-3 w-32 rounded-full bg-white/15" />
          <div className="h-10 w-64 max-w-full rounded-full bg-white/15" />
          <div className="h-4 w-full max-w-xl rounded-full bg-white/10" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 md:gap-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="min-w-0 rounded-2xl border border-white/70 bg-white/80 p-3 shadow-[0_12px_32px_rgba(15,20,23,0.08)] sm:rounded-[24px] sm:p-5 md:rounded-[28px] md:p-6"
            >
              <div className="flex aspect-square items-center justify-center rounded-xl bg-[var(--logo-green)]/10 sm:rounded-[18px] md:rounded-[22px]">
                <span className="h-7 w-7 animate-spin rounded-full border-2 border-foreground/15 border-t-[var(--accent)]" />
              </div>
              <div className="mt-3 h-5 w-4/5 rounded-full bg-foreground/10 sm:mt-5" />
              <div className="mt-2 h-3 w-full rounded-full bg-foreground/10" />
              <div className="mt-3 h-4 w-1/2 rounded-full bg-foreground/10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
