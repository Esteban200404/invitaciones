import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarDays, CircleHelp, Gift, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { EventSettings } from "@/components/admin/event-settings";

export const metadata: Metadata = { title: "Resumen" };

export default async function Page() {
  if (!await requireAdmin()) redirect("/admin/login");
  const supabase = getSupabaseAdmin();
  const [guests, confirmed, pending, declined, gifts, reserved, available, eventResult] = await Promise.all([
    supabase.from("guests").select("id", { count: "exact", head: true }),
    supabase.from("guests").select("id", { count: "exact", head: true }).eq("rsvp_status", "CONFIRMED"),
    supabase.from("guests").select("id", { count: "exact", head: true }).eq("rsvp_status", "PENDING"),
    supabase.from("guests").select("id", { count: "exact", head: true }).eq("rsvp_status", "DECLINED"),
    supabase.from("gifts").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("gifts").select("id", { count: "exact", head: true }).eq("status", "RESERVED").eq("is_active", true),
    supabase.from("gifts").select("id", { count: "exact", head: true }).eq("status", "AVAILABLE").eq("is_active", true),
    supabase.from("events").select("*").limit(1).single(),
  ]);
  if (eventResult.error) throw new Error("No se pudo cargar la configuración del evento.");
  const stats = [
    { label: "Total de invitados", value: guests.count ?? 0, detail: "Personas en la lista", icon: Users, color: "#9e716b" },
    { label: "Confirmados", value: confirmed.count ?? 0, detail: "Asistirán al evento", icon: CalendarDays, color: "#7c9274" },
    { label: "Pendientes", value: pending.count ?? 0, detail: "A la espera de respuesta", icon: CircleHelp, color: "#ba9265" },
    { label: "No asistirán", value: declined.count ?? 0, detail: "Han declinado la invitación", icon: Users, color: "#8b8580" },
    { label: "Regalos activos", value: gifts.count ?? 0, detail: `${reserved.count ?? 0} reservados`, icon: Gift, color: "#a77770" },
    { label: "Disponibles", value: available.count ?? 0, detail: "Aún pueden elegirse", icon: Gift, color: "#7c9274" },
  ];

  return <AdminShell>
    <div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#a27b72]">Tu evento en un vistazo</p><h1 className="serif mt-2 text-4xl text-[#493a37]">Resumen</h1><p className="mt-2 text-sm text-[#847772]">Gestiona invitados, confirma asistencia y acompaña cada detalle.</p></div>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Estadísticas del evento">{stats.map(({ label, value, detail, icon: Icon, color }) => <article key={label} className="rounded-2xl border border-[#e9e1db] bg-[#fffdf9] p-5 shadow-[0_5px_20px_rgba(71,53,44,.025)]"><div className="flex items-center justify-between"><p className="text-sm font-medium text-[#756762]">{label}</p><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f5eee9]" style={{ color }}><Icon size={17} /></span></div><p className="serif mt-4 text-4xl text-[#483a37]">{value}</p><p className="mt-1 text-xs text-[#988982]">{detail}</p></article>)}</section>
    <section className="mt-9"><EventSettings initialEvent={eventResult.data} /></section>
  </AdminShell>;
}
