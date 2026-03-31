"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import { createBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const params = useParams<{ locale?: string | string[] }>();
  const locale = Array.isArray(params.locale) ? params.locale[0] : params.locale ?? "en";
  const isFr = locale === "fr";

  const isRecoveryMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    return hashParams.get("type") === "recovery";
  }, []);

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRequestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createBrowserClient();
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const redirectTo = siteUrl ? `${siteUrl.replace(/\/$/, "")}/${locale}/account/forgot-password` : undefined;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(
        isFr
          ? "Nous avons envoye un lien de reinitialisation a votre adresse e-mail."
          : "We sent a password reset link to your email address."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (newPassword.length < 8) {
        setError(isFr ? "Le mot de passe doit contenir au moins 8 caracteres." : "Password must be at least 8 characters.");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError(isFr ? "Les mots de passe ne correspondent pas." : "Passwords do not match.");
        return;
      }

      const supabase = createBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(isFr ? "Mot de passe mis a jour. Vous pouvez maintenant vous connecter." : "Password updated. You can now sign in.");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="px-6">
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1.1fr_0.9fr]">
        <ScrollReveal>
          <div className="rounded-[32px] border border-white/70 bg-white/80 p-10 text-foreground shadow-[0_24px_90px_rgba(15,20,23,0.1)]">
            <p className="text-xs uppercase tracking-[0.4em] text-foreground/50">
              {isFr ? "Compte" : "Account"}
            </p>
            <h1 className="mt-4 text-3xl">
              {isRecoveryMode ? (isFr ? "Choisissez un nouveau mot de passe." : "Choose a new password.") : isFr ? "Reinitialiser votre mot de passe." : "Reset your password."}
            </h1>
            <p className="mt-4 text-foreground/70">
              {isRecoveryMode
                ? isFr
                  ? "Saisissez un nouveau mot de passe pour securiser votre compte."
                  : "Enter a new password to secure your account."
                : isFr
                  ? "Entrez votre e-mail et nous vous enverrons un lien de reinitialisation."
                  : "Enter your email and we will send you a reset link."}
            </p>

            <form onSubmit={isRecoveryMode ? handleUpdatePassword : handleRequestReset} className="mt-8 space-y-4">
              {isRecoveryMode ? (
                <>
                  <div>
                    <label className="text-xs uppercase tracking-[0.3em] text-foreground/60">
                      {isFr ? "Nouveau mot de passe" : "New password"}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      required
                      minLength={8}
                      className="mt-2 w-full rounded-full border border-foreground/20 bg-white/80 px-4 py-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.3em] text-foreground/60">
                      {isFr ? "Confirmer le mot de passe" : "Confirm password"}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      minLength={8}
                      className="mt-2 w-full rounded-full border border-foreground/20 bg-white/80 px-4 py-3 text-sm"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-foreground/60">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="mt-2 w-full rounded-full border border-foreground/20 bg-white/80 px-4 py-3 text-sm"
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-700">{success}</p>}

              <button
                type="submit"
                className="btn-hover w-full rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.3em] text-white"
                disabled={loading}
              >
                {loading
                  ? isFr
                    ? "En cours..."
                    : "Please wait..."
                  : isRecoveryMode
                    ? isFr
                      ? "Mettre a jour le mot de passe"
                      : "Update password"
                    : isFr
                      ? "Envoyer le lien"
                      : "Send reset link"}
              </button>
            </form>

            <p className="mt-6 text-sm text-foreground/70">
              <Link href={`/${locale}/account/login`} className="text-foreground underline">
                {isFr ? "Retour a la connexion" : "Back to sign in"}
              </Link>
              .
            </p>
          </div>
        </ScrollReveal>
        <div className="space-y-6">
          <ScrollReveal>
            <div className="rounded-[32px] border border-foreground/10 bg-foreground px-8 py-10 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                {isFr ? "Assistance" : "Support"}
              </p>
              <p className="mt-4 text-sm text-white/80">
                {isFr
                  ? "Si vous ne recevez pas l'e-mail, verifiez vos indésirables ou contactez notre equipe."
                  : "If you do not receive the email, check spam or contact our concierge team."}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
