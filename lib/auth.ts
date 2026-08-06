import { getServerUser } from "@/lib/supabase/server";

/**
 * Admin authorization.
 *
 * Admins are defined by email in the `ADMIN_EMAILS` env var (comma-separated,
 * case-insensitive). This keeps admin control server-side and out of the DB,
 * so a malicious client can't promote themselves.
 *
 * Set in .env.local, e.g.  ADMIN_EMAILS=me@example.com,owner@example.com
 */
export function adminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** The authenticated user's email, or null if logged out. */
export async function getServerEmail(): Promise<string | null> {
  const user = await getServerUser();
  return user?.email ?? null;
}

/** True if the current request is from a logged-in admin. */
export async function isAdmin(): Promise<boolean> {
  const email = await getServerEmail();
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

/**
 * Returns the admin's email, or null if not an admin.
 * Use as a guard at the top of admin pages / routes: `if (!(await requireAdmin())) redirect("/")`.
 */
export async function requireAdmin(): Promise<string | null> {
  const email = await getServerEmail();
  if (email && adminEmails().includes(email.toLowerCase())) return email;
  return null;
}
