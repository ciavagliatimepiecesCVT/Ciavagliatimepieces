"use client";

import { useEffect } from "react";
import { setGuestCart } from "@/lib/guest-cart";

/**
 * When the user lands on checkout success with a session_id (returned from Stripe),
 * clear the guest cart so purchased items (including custom builds) are removed.
 * Logged-in users' carts are cleared by the Stripe webhook.
 */
export default function ClearCartOnSuccess({ sessionId }: { sessionId: string | null }) {
  useEffect(() => {
    if (!sessionId?.trim()) return;
    setGuestCart([]);
    window.dispatchEvent(new CustomEvent("cart-updated"));
  }, [sessionId]);

  return null;
}
