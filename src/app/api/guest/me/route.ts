import { NextResponse } from "next/server";
import { getGuestSessionId } from "@/lib/auth/guest-session";
import { errorResponse, unauthorizedResponse } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const guestId = await getGuestSessionId();
    if (!guestId) return unauthorizedResponse();
    const supabase = getSupabaseAdmin();
    const { data: guest, error: guestError } = await supabase.from("guests").select("id,event_id,name,is_active,rsvp_status,companions").eq("id", guestId).maybeSingle();
    if (guestError) throw guestError;
    if (!guest?.is_active) return unauthorizedResponse();
    const [{ data: event, error: eventError }, { data: gifts, error: giftsError }, { data: reservations, error: reservationsError }] = await Promise.all([
      supabase.from("events").select("id,slug,name,baby_name,description,event_date,event_time,timezone,location,address,extra_info,parents_message,accent_colors,cover_image_url").eq("id", guest.event_id).maybeSingle(),
      supabase.from("gifts").select("id,event_id,name,description,image_url,status,is_active").eq("event_id", guest.event_id).eq("is_active", true).order("created_at"),
      supabase.from("gift_reservations").select("gift_id").eq("guest_id", guest.id),
    ]);
    if (eventError || giftsError || reservationsError) throw eventError ?? giftsError ?? reservationsError;
    const reservedByYou = new Set((reservations ?? []).map((reservation) => reservation.gift_id));
    return NextResponse.json({
      guest: { id: guest.id, name: guest.name, rsvp_status: guest.rsvp_status, companions: guest.companions },
      event,
      gifts: (gifts ?? []).map(({ id, name, description, image_url, status }) => ({ id, name, description, image_url, status, reservedByYou: reservedByYou.has(id) })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
