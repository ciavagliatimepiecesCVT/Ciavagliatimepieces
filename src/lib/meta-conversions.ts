import crypto from "crypto";

type SendMetaPurchaseEventInput = {
  eventId: string;
  eventSourceUrl: string;
  value: number;
  currency?: string;
  orderId?: string | null;
  email?: string | null;
  phone?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
};

function normalizeGraphApiVersion(version: string | undefined) {
  const trimmed = version?.trim();
  if (!trimmed) return "v25.0";
  return trimmed.startsWith("v") ? trimmed : `v${trimmed}`;
}

function hash(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function hashPhone(value: string | null | undefined) {
  const normalized = value?.replace(/[^\d]/g, "");
  if (!normalized) return undefined;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export async function sendMetaPurchaseEvent(input: SendMetaPurchaseEventInput) {
  const pixelId = process.env.META_PIXEL_ID?.trim();
  const accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN?.trim();
  if (!pixelId || !accessToken) return;

  const graphVersion = normalizeGraphApiVersion(process.env.META_GRAPH_API_VERSION);
  const url = `https://graph.facebook.com/${graphVersion}/${pixelId}/events`;
  const testEventCode = process.env.META_TEST_EVENT_CODE?.trim();
  const userData: Record<string, string> = {};
  const hashedEmail = hash(input.email);
  const hashedPhone = hashPhone(input.phone);
  if (hashedEmail) userData.em = hashedEmail;
  if (hashedPhone) userData.ph = hashedPhone;
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.userAgent) userData.client_user_agent = input.userAgent;

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        event_source_url: input.eventSourceUrl,
        action_source: "website",
        user_data: userData,
        custom_data: {
          currency: input.currency ?? "CAD",
          value: input.value,
          ...(input.orderId ? { order_id: input.orderId } : {}),
        },
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`Meta Conversions API request failed: ${response.status} ${message}`);
  }
}

