import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { errorResponse } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { eventInputSchema } from "@/lib/validations/schemas";

export async function GET() {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const { data, error } = await getSupabaseAdmin().from("events").select("*").limit(1).single();
    if (error) throw error;
    return NextResponse.json({ event: data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const input = eventInputSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { data: current, error: currentError } = await supabase.from("events").select("id").limit(1).single();
    if (currentError) throw currentError;
    const { data, error } = await supabase.from("events").update({ ...input, baby_name: input.baby_name || null, description: input.description || null, location: input.location || null, address: input.address || null, extra_info: input.extra_info || null, parents_message: input.parents_message || null, cover_image_url: input.cover_image_url || null }).eq("id", current.id).select("*").single();
    if (error) throw error;
    return NextResponse.json({ event: data });
  } catch (error) {
    return errorResponse(error);
  }
}
