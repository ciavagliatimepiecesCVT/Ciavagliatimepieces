"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/lib/meta-pixel";

export function MetaSearchTracker({ query }: { query: string }) {
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    trackMetaEvent("Search", { search_string: trimmed });
  }, [query]);

  return null;
}

