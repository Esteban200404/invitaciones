import { NextResponse } from "next/server";
import { getGuestSessionId } from "@/lib/auth/guest-session";
import { errorResponse, unauthorizedResponse } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { rsvpSchema } from "@/lib/validations/schemas";

export async function POST(request: Request) {
  try {
    const guestId = await getGuestSessionId();
    if (!guestId) return unauthorizedResponse();
    const { status, companions } = rsvpSchema.parse(await request.json());
    const { data: guest, error } = await getSupabaseAdmin().from("guests").update({ rsvp_status: status, companions: status === "CONFIRMED" ? companions : 0 }).eq("id", guestId).eq("is_active", true).select("id").maybeSingle();
    if (error) throw error;
    if (!guest) return unauthorizedResponse();
    return NextResponse.json({ ok: true, status, companions: status === "CONFIRMED" ? companions : 0 });
  } catch (error) {
    return errorResponse(error);
  }
}
