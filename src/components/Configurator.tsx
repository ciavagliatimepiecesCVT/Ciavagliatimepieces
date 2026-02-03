"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

const options = {
  case: [
    { label: "Brushed Steel", price: 0 },
    { label: "Black DLC", price: 650 },
    { label: "Rose Gold", price: 1400 },
  ],
  dial: [
    { label: "Meteorite", price: 1200 },
    { label: "Porcelain", price: 600 },
    { label: "Guilloché", price: 900 },
  ],
  strap: [
    { label: "Italian Leather", price: 320 },
    { label: "Alligator", price: 680 },
    { label: "Milanese Mesh", price: 480 },
  ],
  movement: [
    { label: "Manual 42h", price: 0 },
    { label: "Automatic 80h", price: 1100 },
    { label: "Tourbillon", price: 4800 },
  ],
};

const basePrice = 9500;

export default function Configurator({ locale }: { locale: string }) {
  const isFr = locale === "fr";
  const [caseOption, setCaseOption] = useState(options.case[0]);
  const [dialOption, setDialOption] = useState(options.dial[0]);
  const [strapOption, setStrapOption] = useState(options.strap[0]);
  const [movementOption, setMovementOption] = useState(options.movement[0]);
  const [engraving, setEngraving] = useState("");
  const [loading, setLoading] = useState(false);

  const total = useMemo(() => {
    return (
      basePrice +
      caseOption.price +
      dialOption.price +
      strapOption.price +
      movementOption.price
    );
  }, [caseOption, dialOption, strapOption, movementOption]);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          type: "custom",
          userId: user?.id ?? null,
          configuration: {
            case: caseOption.label,
            dial: dialOption.label,
            strap: strapOption.label,
            movement: movementOption.label,
            engraving,
            price: total,
          },
        }),
      });

      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-[0_24px_90px_rgba(15,20,23,0.1)]">
        <Image
          src="/images/configurator.svg"
          alt="Configurator watch"
          width={560}
          height={520}
          className="h-[360px] w-full rounded-[24px] object-cover"
        />
        <div className="mt-8 grid gap-6">
          <ConfigGroup
            label={isFr ? "Boîtier" : "Case"}
            options={options.case}
            value={caseOption.label}
            onChange={(value) => setCaseOption(options.case.find((item) => item.label === value)!)}
          />
          <ConfigGroup
            label={isFr ? "Cadran" : "Dial"}
            options={options.dial}
            value={dialOption.label}
            onChange={(value) => setDialOption(options.dial.find((item) => item.label === value)!)}
          />
          <ConfigGroup
            label={isFr ? "Bracelet" : "Strap"}
            options={options.strap}
            value={strapOption.label}
            onChange={(value) => setStrapOption(options.strap.find((item) => item.label === value)!)}
          />
          <ConfigGroup
            label={isFr ? "Mouvement" : "Movement"}
            options={options.movement}
            value={movementOption.label}
            onChange={(value) => setMovementOption(options.movement.find((item) => item.label === value)!)}
          />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">
              {isFr ? "Gravure" : "Engraving"}
            </p>
            <input
              value={engraving}
              onChange={(event) => setEngraving(event.target.value)}
              placeholder={isFr ? "Gravure du fond de boîte" : "Optional caseback engraving"}
              className="mt-3 w-full rounded-full border border-foreground/20 bg-white/80 px-4 py-3 text-sm"
            />
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-[32px] border border-white/70 bg-white/80 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">{isFr ? "Résumé" : "Summary"}</p>
          <h2 className="mt-4 text-3xl">
            {isFr ? "Votre configuration" : "Your Ciavaglia configuration"}
          </h2>
          <div className="mt-6 space-y-2 text-sm text-foreground/70">
            <p>{isFr ? "Boîtier" : "Case"}: {caseOption.label}</p>
            <p>{isFr ? "Cadran" : "Dial"}: {dialOption.label}</p>
            <p>{isFr ? "Bracelet" : "Strap"}: {strapOption.label}</p>
            <p>{isFr ? "Mouvement" : "Movement"}: {movementOption.label}</p>
            <p>{isFr ? "Gravure" : "Engraving"}: {engraving || (isFr ? "Aucune" : "None")}</p>
          </div>
          <div className="mt-8 flex items-center justify-between text-lg font-semibold">
            <span>{isFr ? "Total" : "Total"}</span>
            <span>${total.toLocaleString()}</span>
          </div>
          <button
            onClick={handleCheckout}
            className="mt-8 w-full rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.3em] text-white"
            disabled={loading}
          >
            {isFr ? "Payer" : "Proceed to checkout"}
          </button>
          <p className="mt-4 text-xs text-foreground/50">
            {isFr
              ? "Paiement sécurisé via Stripe. Confirmation par e-mail." 
              : "Secure payment handled by Stripe. A confirmation email and atelier briefing will follow."}
          </p>
        </div>
        <div className="rounded-[32px] border border-foreground/10 bg-foreground px-8 py-10 text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">{isFr ? "Note atelier" : "Atelier note"}</p>
          <h3 className="mt-4 text-2xl">
            {isFr
              ? "Chaque pièce est assemblée et numérotée à la main."
              : "Every component is assembled, tested, and numbered by hand."}
          </h3>
          <p className="mt-4 text-sm text-white/70">
            {isFr
              ? "Les créations sur mesure expédient sous 4 à 8 semaines."
              : "Custom builds ship within 4-8 weeks. You will receive step-by-step progress updates from our watchmakers."}
          </p>
        </div>
      </div>
    </div>
  );
}

function ConfigGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; price: number }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">{label}</p>
      <div className="mt-3 grid gap-2">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={() => onChange(option.label)}
            className={`flex items-center justify-between rounded-full border px-4 py-3 text-sm transition ${
              option.label === value
                ? "border-foreground bg-foreground text-white"
                : "border-foreground/20 bg-white/80 text-foreground/70"
            }`}
          >
            <span>{option.label}</span>
            <span className="text-xs">+${option.price}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
