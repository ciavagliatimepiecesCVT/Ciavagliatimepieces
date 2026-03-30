/**
 * Low-level HTTP mapping to FlagShip SmartShip JSON API.
 * Adjust paths and JSON shapes here if FlagShip changes their contract.
 */

import { getFlagshipApiBaseUrl, getFlagshipToken } from "./env";

export type FlagShipAddress = {
  name: string;
  attn?: string;
  address: string;
  suite?: string;
  city: string;
  country: string;
  state: string;
  postal_code: string;
  phone: string;
  ext?: string;
  department?: string;
  is_commercial?: boolean;
};

export type FlagShipPackageItem = {
  width: number;
  height: number;
  length: number;
  weight: number;
  description: string;
};

export type FlagShipRatesBody = {
  from: FlagShipAddress;
  to: FlagShipAddress;
  packages: {
    items: FlagShipPackageItem[];
    units: "imperial" | "metric";
    type: "package" | "letter" | "pack";
    content: string;
  };
  payment: { payer: string };
  options?: Record<string, unknown>;
};

export type FlagShipConfirmBody = FlagShipRatesBody & {
  service: { courier_name: string; courier_code: string };
  options?: Record<string, unknown>;
};

async function flagshipFetch<T>(
  path: string,
  init: RequestInit & { expectJson?: boolean }
): Promise<{ ok: boolean; status: number; data: T | null; text: string }> {
  const token = getFlagshipToken();
  if (!token) {
    throw new Error("FlagShip is not configured (missing API token).");
  }
  const base = getFlagshipApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Smartship-Token": token,
    ...(init.headers as Record<string, string> | undefined),
  };
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  let data: T | null = null;
  if (text && init.expectJson !== false) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = null;
    }
  }
  return { ok: res.ok, status: res.status, data, text };
}

/** POST /ship/rates — returns available services + prices */
export async function adapterPostRates(body: FlagShipRatesBody) {
  return flagshipFetch<unknown>("/ship/rates", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** POST /ship/confirm — purchase label / create shipment */
export async function adapterPostConfirm(body: FlagShipConfirmBody) {
  return flagshipFetch<unknown>("/ship/confirm", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** GET /ship/track?shipment_id= or &tracking_number= */
export async function adapterGetTrack(params: { shipmentId?: string; trackingNumber?: string }) {
  const q = new URLSearchParams();
  if (params.shipmentId) q.set("shipment_id", params.shipmentId);
  if (params.trackingNumber) q.set("tracking_number", params.trackingNumber);
  const qs = q.toString();
  return flagshipFetch<unknown>(`/ship/track?${qs}`, { method: "GET" });
}
