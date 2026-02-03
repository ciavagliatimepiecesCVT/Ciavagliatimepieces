import nodemailer from "nodemailer";

type OrderEmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendOrderEmails({
  customerEmail,
  atelierEmail,
  summary,
  total,
}: {
  customerEmail: string;
  atelierEmail: string;
  summary: string;
  total: number;
}) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !port || !user || !pass || !from) {
    throw new Error("Missing SMTP configuration.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    auth: {
      user,
      pass,
    },
  });

  const customerPayload: OrderEmailPayload = {
    to: customerEmail,
    subject: "Your Ciavaglia order is confirmed",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Thank you for your Ciavaglia order.</h2>
        <p>We have received your payment and the atelier is preparing your build.</p>
        <p><strong>Summary:</strong> ${summary}</p>
        <p><strong>Total:</strong> $${total.toLocaleString()}</p>
      </div>
    `,
  };

  const atelierPayload: OrderEmailPayload = {
    to: atelierEmail,
    subject: "New Ciavaglia order received",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>New order received</h2>
        <p><strong>Summary:</strong> ${summary}</p>
        <p><strong>Total:</strong> $${total.toLocaleString()}</p>
        <p>Please check the dashboard for configuration details.</p>
      </div>
    `,
  };

  await transporter.sendMail({
    from,
    ...customerPayload,
  });

  await transporter.sendMail({
    from,
    ...atelierPayload,
  });
}
