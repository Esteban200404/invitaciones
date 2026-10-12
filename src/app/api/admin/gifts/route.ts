import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { errorResponse } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { giftInputSchema } from "@/lib/validations/schemas";

export async function GET() {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const supabase = getSupabaseAdmin();
    const [{ data: gifts, error: giftsError }, { data: reservations, error: reservationsError }] = await Promise.all([
      supabase.from("gifts").select("id,event_id,name,description,image_url,status,is_active,created_at").order("created_at"),
      supabase.from("gift_reservations").select("gift_id,guest_id,guest_name"),
    ]);
    if (giftsError || reservationsError) throw giftsError ?? reservationsError;
    const guestIds = [...new Set((reservations ?? []).flatMap((reservation) => reservation.guest_id ? [reservation.guest_id] : []))];
    const { data: guests, error: guestsError } = guestIds.length
      ? await supabase.from("guests").select("id,name").in("id", guestIds)
      : { data: [], error: null };
    if (guestsError) throw guestsError;
    const guestNames = new Map((guests ?? []).map((guest) => [guest.id, guest.name]));
    const reservationsByGift = new Map((reservations ?? []).map((reservation) => [reservation.gift_id, {
      guest_id: reservation.guest_id,
      guest_name: reservation.guest_name ?? (reservation.guest_id ? guestNames.get(reservation.guest_id) ?? null : null),
    }]));
    return NextResponse.json({ gifts: (gifts ?? []).map((gift) => ({
      ...gift,
      gift_reservations: reservationsByGift.has(gift.id) ? [reservationsByGift.get(gift.id)] : [],
    })) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const input = giftInputSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { data: event, error: eventError } = await supabase.from("events").select("id").limit(1).single();
    if (eventError) throw eventError;
    const { data, error } = await supabase.from("gifts").insert({ ...input, image_url: input.image_url || null, event_id: event.id }).select("id,event_id,name,description,image_url,status,is_active,created_at").single();
    if (error) throw error;
    return NextResponse.json({ gift: data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const body = await request.json();
    if (typeof body.id !== "string") return NextResponse.json({ error: "Regalo no válido." }, { status: 400 });
    const input = giftInputSchema.parse(body);
    const { data, error } = await getSupabaseAdmin().from("gifts").update({ ...input, image_url: input.image_url || null }).eq("id", body.id).select("id,event_id,name,description,image_url,status,is_active,created_at").single();
    if (error) throw error;
    return NextResponse.json({ gift: data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const { id } = await request.json();
    if (typeof id !== "string") return NextResponse.json({ error: "Regalo no válido." }, { status: 400 });
    const { error } = await getSupabaseAdmin().from("gifts").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const { giftId } = await request.json();
    if (typeof giftId !== "string") return NextResponse.json({ error: "Reserva no válida." }, { status: 400 });
    const { error } = await getSupabaseAdmin().from("gift_reservations").delete().eq("gift_id", giftId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
