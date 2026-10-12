import { NextResponse } from "next/server";
import { getGuestSessionId } from "@/lib/auth/guest-session";
import { errorResponse, unauthorizedResponse } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { reservationSchema } from "@/lib/validations/schemas";

export async function POST(request: Request) {
  try {
    const guestId = await getGuestSessionId();
    if (!guestId) return unauthorizedResponse();
    const { giftId } = reservationSchema.parse(await request.json());
    const { data: reserved, error } = await getSupabaseAdmin().rpc("reserve_gift", { p_gift_id: giftId, p_guest_id: guestId });
    if (error) throw error;
    if (!reserved) return NextResponse.json({ error: "Este regalo acaba de ser seleccionado por otra persona. Por favor elige otro." }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
