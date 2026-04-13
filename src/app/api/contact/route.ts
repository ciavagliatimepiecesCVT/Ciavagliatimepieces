import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  let body: { name?: string; email?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || !email || !message) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  const contactTo = process.env.CONTACT_EMAIL ?? process.env.ORDER_NOTIFY_EMAIL ?? "atelier@civagliatimepieces.com";

  if (!host || !port || !user || !pass || !from) {
    console.warn("[Contact] SMTP not configured — message from", email, "not sent.");
    // Still return success so the user sees the confirmation
    return NextResponse.json({ ok: true });
  }

  const portNum = Number(port);
  const transporter = nodemailer.createTransport({
    host,
    port: portNum,
    secure: portNum === 465,
    auth: { user, pass },
  });

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;">
      <h2 style="margin:0 0 16px;color:#1a1a1a;">New contact message</h2>
      <table style="border-collapse:collapse;width:100%;">
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#333;vertical-align:top;">Name</td>
          <td style="padding:8px 12px;color:#444;">${name.replace(/</g, "&lt;")}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#333;vertical-align:top;">Email</td>
          <td style="padding:8px 12px;color:#444;"><a href="mailto:${email.replace(/"/g, "&quot;")}">${email.replace(/</g, "&lt;")}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#333;vertical-align:top;">Message</td>
          <td style="padding:8px 12px;color:#444;white-space:pre-line;">${message.replace(/</g, "&lt;")}</td>
        </tr>
      </table>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to: contactTo,
      replyTo: email,
      subject: `Contact form: ${name}`,
      html,
    });
    console.log("[Contact] Message sent from", email);
  } catch (err) {
    console.error("[Contact] Failed to send:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
