import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { createAuthServerClient } from "@/lib/supabase/server";

/** Use in Route Handlers to ensure the session belongs to an admin user. */
export async function requireAdminApi(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id || !isAdmin(user.id)) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 403 }) };
  }
  return { ok: true, userId: user.id };
}
