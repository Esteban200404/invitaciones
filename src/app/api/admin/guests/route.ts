import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { requireAdmin } from "@/lib/auth/admin";
import { errorResponse } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { guestInputSchema } from "@/lib/validations/schemas";

function makeCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  return `${letters[randomInt(letters.length)]}${letters[randomInt(letters.length)]}${randomInt(1000, 10000)}`;
}

export async function GET() {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const { data, error } = await getSupabaseAdmin().from("guests").select("id,event_id,name,invitation_code,is_active,rsvp_status,companions,created_at").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ guests: data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const input = guestInputSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { data: event, error: eventError } = await supabase.from("events").select("id").limit(1).single();
    if (eventError) throw eventError;
    let code = input.invitation_code?.toUpperCase() ?? makeCode();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data, error } = await supabase.from("guests").insert({ ...input, invitation_code: code, event_id: event.id }).select("id,event_id,name,invitation_code,is_active,rsvp_status,companions,created_at").single();
      if (!error) return NextResponse.json({ guest: data }, { status: 201 });
      if (error.code !== "23505" || input.invitation_code) throw error;
      code = makeCode();
    }
    throw new Error("Could not generate a unique invitation code");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const input = guestInputSchema.parse(body);
    const update = { ...input, invitation_code: input.invitation_code?.toUpperCase() };
    const { data, error } = await getSupabaseAdmin().from("guests").update(update).eq("id", id).select("id,event_id,name,invitation_code,is_active,rsvp_status,companions,created_at").single();
    if (error) throw error;
    return NextResponse.json({ guest: data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const { id } = await request.json();
    if (typeof id !== "string") return NextResponse.json({ error: "Invitado no válido." }, { status: 400 });
    const { error } = await getSupabaseAdmin().from("guests").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
