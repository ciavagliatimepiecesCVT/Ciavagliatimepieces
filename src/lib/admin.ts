export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  const ids = process.env.ADMIN_USER_IDS ?? "";
  return ids.split(",").map((id) => id.trim()).filter(Boolean).includes(userId);
}
