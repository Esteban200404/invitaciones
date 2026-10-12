import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    const allowedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (error || !user || !allowedEmail || user.email?.toLowerCase() !== allowedEmail) return null;
    return user;
  } catch {
    return null;
  }
}
