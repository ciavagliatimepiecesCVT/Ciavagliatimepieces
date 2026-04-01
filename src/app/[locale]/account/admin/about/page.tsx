"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ScrollReveal from "@/components/ScrollReveal";
import { getAboutSettings, setAboutSettings } from "../actions";
import type { AboutSettings } from "@/lib/about-settings";

export default function AdminAboutPage() {
  const params = useParams<{ locale?: string | string[] }>();
  const locale = Array.isArray(params.locale) ? params.locale[0] : params.locale ?? "en";
  const isFr = locale === "fr";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AboutSettings | null>(null);

  useEffect(() => {
    getAboutSettings().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      await setAboutSettings(data);
      if (isFr) alert("Page a propos enregistree.");
      else alert("About page saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return <div className="py-8 text-white/70">{isFr ? "Chargement..." : "Loading..."}</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-white">{isFr ? "A propos" : "About"}</h1>
      <p className="max-w-xl text-sm text-white/70">
        {isFr
          ? "Modifiez le titre et le corps de la page A propos."
          : "Edit the title and body for the About page."}
      </p>

      {error && <p className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-200">{error}</p>}

      <ScrollReveal>
        <div className="space-y-5 rounded-xl border border-white/20 bg-white/5 p-6 text-white">
          <div>
            <label className="text-xs text-white/60">{isFr ? "Titre" : "Title"}</label>
            <input
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-white/60">{isFr ? "Corps" : "Body"}</label>
            <textarea
              value={data.body}
              onChange={(e) => setData({ ...data, body: e.target.value })}
              rows={10}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-[var(--logo-gold)] px-6 py-3 text-sm font-medium text-[var(--logo-green)] disabled:opacity-50"
            >
              {saving ? "…" : isFr ? "Enregistrer" : "Save"}
            </button>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
