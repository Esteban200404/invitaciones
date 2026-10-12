import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { errorResponse } from "@/lib/http";
import { loginSchema } from "@/lib/validations/schemas";

export async function POST(request: Request) {
  try {
    const { email, password } = loginSchema.parse(await request.json());
    if (email.toLowerCase() !== process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
      return NextResponse.json({ error: "No se pudo iniciar sesión con esos datos." }, { status: 401 });
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user || data.user.email?.toLowerCase() !== process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
      return NextResponse.json({ error: "No se pudo iniciar sesión con esos datos." }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
