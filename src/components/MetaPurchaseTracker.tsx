"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function MetaPurchaseTracker({
  sessionId,
  total,
  currency,
}: {
  sessionId: string | null;
  total: number | null;
  currency: string;
}) {
  useEffect(() => {
    if (!sessionId?.trim() || total == null || !Number.isFinite(total)) return;
    window.fbq?.(
      "track",
      "Purchase",
      {
        value: total,
        currency,
      },
      { eventID: sessionId.trim() }
    );
  }, [sessionId, total, currency]);

  return null;
}
