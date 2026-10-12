import { NextResponse } from "next/server";
import { clearGuestSession, setGuestSession } from "@/lib/auth/guest-session";
import { errorResponse } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { inviteCodeSchema } from "@/lib/validations/schemas";

export async function POST(request: Request) {
  try {
    const { code } = inviteCodeSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { data: guest, error } = await supabase.from("guests").select("id,is_active").eq("invitation_code", code.toUpperCase()).maybeSingle();
    if (error) throw error;
    if (!guest?.is_active) return NextResponse.json({ error: "El código de invitación no es válido." }, { status: 401 });
    await setGuestSession(guest.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE() {
  await clearGuestSession();
  return NextResponse.json({ ok: true });
}
