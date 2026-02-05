import nodemailer from "nodemailer";
import { getSiteUrl } from "@/lib/stripe";

type OrderEmailPayload = {
  to: string;
  subject: string;
  html: string;
};

/** Base URL for images in emails. Must be a public URL (e.g. your production site) so email clients can load the logo. Set EMAIL_ASSET_BASE_URL in .env to your live site (e.g. https://yoursite.com) when testing locally. */
function getEmailAssetBaseUrl(): string {
  const base = process.env.EMAIL_ASSET_BASE_URL?.trim();
  if (base) return base.replace(/\/$/, "");
  return getSiteUrl();
}

/** Links for email footer (Privacy Policy, Terms of Service, Track Order). */
function getEmailFooterLinks(locale: "en" | "fr") {
  const base = getSiteUrl();
  return {
    privacy: `${base}/${locale}/privacy-policy`,
    terms: `${base}/${locale}/terms-of-service`,
    track: `${base}/${locale}/track-order`,
  };
}

const emailCopy = {
  en: {
    footer: "Ciavaglia Timepieces — Crafted with care",
    emailFooter: {
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      trackOrder: "Track your order",
      copyright: "© {year} Ciavaglia Timepieces. All rights reserved.",
    },
    atelier: {
      subject: "New Ciavaglia Timepieces order received",
      title: "New order received",
      intro: "A new Ciavaglia Timepieces order has been placed.",
      summaryLabel: "Summary",
      totalLabel: "Total",
      orderNumberLabel: "Order number",
      cta: "Please check the dashboard for full configuration details.",
    },
    customer: {
      subject: "Your Ciavaglia Timepieces order is confirmed",
      title: "Thank you for your Ciavaglia Timepieces order",
      intro: "We have received your payment and are preparing your build.",
      summaryLabel: "Order summary",
      totalLabel: "Total",
      orderNumberLabel: "Order number",
      trackCta: "You can track your order status anytime using the order number above.",
      cta: "We will be in touch if we need any details. If you have questions, reply to this email.",
    },
  },
  fr: {
    footer: "Ciavaglia Timepieces — Créé avec soin",
    emailFooter: {
      privacy: "Politique de confidentialité",
      terms: "Conditions d'utilisation",
      trackOrder: "Suivre votre commande",
      copyright: "© {year} Ciavaglia Timepieces. Tous droits réservés.",
    },
    atelier: {
      subject: "Nouvelle commande Ciavaglia Timepieces reçue",
      title: "Nouvelle commande reçue",
      intro: "Une nouvelle commande Ciavaglia Timepieces a été passée.",
      summaryLabel: "Résumé",
      totalLabel: "Total",
      orderNumberLabel: "Numéro de commande",
      cta: "Consultez le tableau de bord pour les détails de la configuration.",
    },
    customer: {
      subject: "Votre commande Ciavaglia Timepieces est confirmée",
      title: "Merci pour votre commande Ciavaglia Timepieces",
      intro: "Nous avons bien reçu votre paiement et préparons votre création.",
      summaryLabel: "Récapitulatif de la commande",
      totalLabel: "Total",
      orderNumberLabel: "Numéro de commande",
      trackCta: "Vous pouvez suivre le statut de votre commande à tout moment avec le numéro ci-dessus.",
      cta: "Nous vous contacterons si nous avons besoin de précisions. Pour toute question, répondez à cet e-mail.",
    },
  },
} as const;

function emailLayout(content: string, locale: "en" | "fr" = "en", showLogo = true) {
  const logoUrl = `${getEmailAssetBaseUrl()}/images/logo.png`;
  const links = getEmailFooterLinks(locale);
  const lang = locale === "fr" ? emailCopy.fr : emailCopy.en;
  const t = lang.emailFooter;
  const year = new Date().getFullYear();
  const footerBlock = `
    <div style="padding:20px 32px;border-top:1px solid #eee;text-align:center;font-size:12px;color:#888;">
      <p style="margin:0 0 8px;">${lang.footer}</p>
      <p style="margin:0 0 8px;">
        <a href="${links.privacy}" style="color:#666;text-decoration:underline;">${t.privacy}</a>
        &nbsp;·&nbsp;
        <a href="${links.terms}" style="color:#666;text-decoration:underline;">${t.terms}</a>
        &nbsp;·&nbsp;
        <a href="${links.track}" style="color:#666;text-decoration:underline;">${t.trackOrder}</a>
      </p>
      <p style="margin:0;font-size:11px;color:#999;">${t.copyright.replace("{year}", String(year))}</p>
    </div>`;
  const logoBlock = showLogo
    ? `
    <div style="text-align:center;padding:24px 24px 16px;">
      <img src="${logoUrl}" alt="Ciavaglia Timepieces" width="160" height="auto" style="display:inline-block;max-width:160px;height:auto;" />
    </div>`
    : "";
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f3f0;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f3f0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%);padding:28px 32px;text-align:center;">
              ${logoBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:0;">
              ${footerBlock}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOrderEmails({
  customerEmail,
  atelierEmail,
  summary,
  total,
  locale = "en",
  orderNumber,
}: {
  customerEmail: string | null;
  atelierEmail: string;
  summary: string;
  total: number;
  locale?: "en" | "fr";
  orderNumber?: string;
}) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !port || !user || !pass || !from) {
    console.warn(
      "Order emails skipped: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in your environment to send confirmation emails."
    );
    return;
  }

  const lang = locale === "fr" ? emailCopy.fr : emailCopy.en;
  const atelierT = lang.atelier;
  const customerT = lang.customer;

  const portNum = Number(port);
  const transporter = nodemailer.createTransport({
    host,
    port: portNum,
    secure: portNum === 465,
    auth: {
      user,
      pass,
    },
  });

  try {
    await transporter.verify();
  } catch (verifyError) {
    const msg = verifyError instanceof Error ? verifyError.message : String(verifyError);
    console.error("[Order email] SMTP connection failed:", msg);
    throw verifyError;
  }

  console.log("[Order email] Sending to atelier:", atelierEmail, customerEmail?.trim() ? "+ customer" : "");

  const orderNumberRow =
    orderNumber != null
      ? `<tr><td style="padding:0 20px 8px;font-size:14px;color:#333;"><strong>${atelierT.orderNumberLabel}</strong> — ${orderNumber}</td></tr>`
      : "";
  const atelierContent = `
    <h2 style="margin:0 0 20px;font-size:22px;font-weight:600;color:#1a1a1a;">${atelierT.title}</h2>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444;">${atelierT.intro}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-collapse:collapse;background:#f9f9f9;border-radius:6px;">
      ${orderNumberRow}
      <tr>
        <td style="padding:16px 20px;font-size:14px;color:#333;">
          <strong>${atelierT.summaryLabel}</strong><br/>${summary}
        </td>
      </tr>
      <tr>
        <td style="padding:0 20px 16px;font-size:14px;color:#333;">
          <strong>${atelierT.totalLabel}</strong> — $${total.toLocaleString()}
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;color:#666;">${atelierT.cta}</p>
  `;

  const atelierPayload: OrderEmailPayload = {
    to: atelierEmail,
    subject: atelierT.subject,
    html: emailLayout(atelierContent, locale),
  };

  await transporter.sendMail({ from, ...atelierPayload });

  if (customerEmail?.trim()) {
    const customerOrderNumberRow =
      orderNumber != null
        ? `<tr><td style="padding:16px 20px 0;font-size:14px;color:#333;"><strong>${customerT.orderNumberLabel}</strong> — ${orderNumber}</td></tr>`
        : "";
    const customerContent = `
      <h2 style="margin:0 0 20px;font-size:22px;font-weight:600;color:#1a1a1a;">${customerT.title}</h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444;">${customerT.intro}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-collapse:collapse;background:#f9f9f9;border-radius:6px;">
        ${customerOrderNumberRow}
        <tr>
          <td style="padding:16px 20px;font-size:14px;color:#333;">
            <strong>${customerT.summaryLabel}</strong><br/>${summary}
          </td>
        </tr>
        <tr>
          <td style="padding:0 20px 16px;font-size:14px;color:#333;">
            <strong>${customerT.totalLabel}</strong> — $${total.toLocaleString()}
          </td>
        </tr>
      </table>
      ${orderNumber != null ? `<p style="margin:0 0 12px;font-size:14px;color:#666;">${customerT.trackCta}</p>` : ""}
      <p style="margin:0;font-size:14px;color:#666;">${customerT.cta}</p>
    `;

    const customerPayload: OrderEmailPayload = {
      to: customerEmail.trim(),
      subject: customerT.subject,
      html: emailLayout(customerContent, locale),
    };
    await transporter.sendMail({ from, ...customerPayload });
  }

  console.log("[Order email] Sent successfully");
}
