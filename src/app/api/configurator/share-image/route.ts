import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/** Public OG image endpoint for shared configurator builds. */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")?.trim();
  if (!id) {
    return new NextResponse("Missing id", { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("shared_watch_configurations")
    .select("preview_data_url, image_url")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return new NextResponse("Not found", { status: 404 });
  }

  const previewDataUrl = (data as { preview_data_url?: string | null }).preview_data_url;
  if (typeof previewDataUrl === "string" && previewDataUrl.startsWith("data:image/")) {
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(previewDataUrl);
    if (match) {
      const mimeType = match[1];
      const base64 = match[2];
      const body = Buffer.from(base64, "base64");
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }

  const fallbackImageUrl = (data as { image_url?: string | null }).image_url || "/images/configurator.svg";
  return NextResponse.redirect(new URL(fallbackImageUrl, request.nextUrl.origin));
}
