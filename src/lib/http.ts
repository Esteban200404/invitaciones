import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Revisa la información e inténtalo de nuevo." }, { status: 400 });
  }
  console.error("Request failed", error);
  return NextResponse.json({ error: "Ha ocurrido un problema. Intenta nuevamente." }, { status: 500 });
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Tu sesión ya no está activa. Ingresa nuevamente." }, { status: 401 });
}
