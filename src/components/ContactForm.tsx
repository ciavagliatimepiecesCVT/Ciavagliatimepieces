"use client";

import { useState } from "react";
import { trackMetaEvent } from "@/lib/meta-pixel";

type ContactLabels = {
  name: string;
  email: string;
  message: string;
  send: string;
  success: string;
};

export default function ContactForm({ labels, locale }: { labels: ContactLabels; locale?: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFr = locale === "fr";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string)?.trim() ?? "";
    const email = (formData.get("email") as string)?.trim() ?? "";
    const message = (formData.get("message") as string)?.trim() ?? "";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? (isFr ? "Erreur lors de l'envoi." : "Failed to send message."));
        return;
      }

      setSubmitted(true);
      trackMetaEvent("Contact");
    } catch {
      setError(isFr ? "Erreur de connexion." : "Connection error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-[26px] border border-white/70 bg-white/80 p-8 text-center text-foreground shadow-[0_20px_70px_rgba(15,20,23,0.1)]">
        <p className="text-lg text-foreground/90">{labels.success}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[26px] border border-white/70 bg-white/80 p-6 text-foreground shadow-[0_20px_70px_rgba(15,20,23,0.1)] sm:p-8"
    >
      <div className="space-y-6">
        <div>
          <label htmlFor="contact-name" className="block text-xs uppercase tracking-[0.2em] text-foreground/60">
            {labels.name}
          </label>
          <input
            id="contact-name"
            type="text"
            name="name"
            required
            className="mt-2 w-full rounded-lg border border-foreground/20 bg-white/50 px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none"
            placeholder={labels.name}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-xs uppercase tracking-[0.2em] text-foreground/60">
            {labels.email}
          </label>
          <input
            id="contact-email"
            type="email"
            name="email"
            required
            className="mt-2 w-full rounded-lg border border-foreground/20 bg-white/50 px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none"
            placeholder={labels.email}
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="block text-xs uppercase tracking-[0.2em] text-foreground/60">
            {labels.message}
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            className="mt-2 w-full resize-y rounded-lg border border-foreground/20 bg-white/50 px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none"
            placeholder={labels.message}
          />
        </div>
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        )}
        <button
          type="submit"
          disabled={sending}
          className="btn-hover w-full rounded-full border border-foreground bg-foreground px-6 py-3 text-sm uppercase tracking-[0.2em] text-background transition hover:bg-foreground/90 disabled:opacity-60"
        >
          {sending ? (isFr ? "Envoi..." : "Sending...") : labels.send}
        </button>
      </div>
    </form>
  );
}
