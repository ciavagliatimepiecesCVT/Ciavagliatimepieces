"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const params = useParams<{ locale?: string | string[] }>();
  const router = useRouter();
  const locale = Array.isArray(params.locale) ? params.locale[0] : params.locale ?? "en";

  useEffect(() => {
    router.replace(`/${locale}/account/admin/orders`);
  }, [locale, router]);

  return (
    <div className="py-12">
      <p className="text-foreground/70">Redirecting…</p>
    </div>
  );
}
