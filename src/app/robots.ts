import type { MetadataRoute } from "next";
import { fullUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account/", "/api/", "/en/account/", "/fr/account/"],
      },
    ],
    sitemap: fullUrl("/sitemap.xml"),
  };
}
