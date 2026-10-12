"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Clipboard, LoaderCircle, Pencil, Plus, RefreshCw, Search, Trash2, UserRoundPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RSVPStatus } from "@/types/database";

type Guest = { id: string; name: string; invitation_code: string; is_active: boolean; rsvp_status: RSVPStatus; companions: number };
type FormData = Pick<Guest, "name" | "invitation_code" | "is_active" | "rsvp_status" | "companions">;
const emptyForm: FormData = { name: "", invitation_code: "", is_active: true, rsvp_status: "PENDING", companions: 0 };

function makeCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  return `${letters[bytes[0] % letters.length]}${letters[bytes[1] % letters.length]}${Array.from(bytes.slice(2), (value) => digits[value % digits.length]).join("")}`;
}

export function GuestManager() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<FormData>(emptyForm);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState("");

  async function loadGuests() {
    const response = await fetch("/api/admin/guests", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "No se pudo cargar la lista de invitados.");
    setGuests(result.guests);
  }

  useEffect(() => { loadGuests().catch((reason: unknown) => setMessage(reason instanceof Error ? reason.message : "No se pudo cargar la lista.")); }, []);

  const filtered = guests.filter((guest) => `${guest.name} ${guest.invitation_code}`.toLowerCase().includes(query.toLowerCase()));

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, invitation_code: makeCode() });
    setShowForm(true);
    setMessage("");
  }

  function openEdit(guest: Guest) {
    setEditing(guest);
    setForm({ name: guest.name, invitation_code: guest.invitation_code, is_active: guest.is_active, rsvp_status: guest.rsvp_status, companions: guest.companions });
    setShowForm(true);
    setMessage("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/guests", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...(editing ? { id: editing.id } : {}), ...form }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No se pudo guardar el invitado.");
      setMessage(editing ? "Invitado actualizado." : `Invitado creado. Código: ${result.guest.invitation_code}`);
      setShowForm(false);
      await loadGuests();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Ha ocurrido un problema. Intenta nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(guest: Guest) {
    if (!window.confirm(`¿Eliminar a ${guest.name}? Sus regalos reservados seguirán reservados y el panel conservará quién los eligió.`)) return;
    try {
      const response = await fetch("/api/admin/guests", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: guest.id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No se pudo eliminar el invitado.");
      setMessage("Invitado eliminado.");
      await loadGuests();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Ha ocurrido un problema. Intenta nuevamente.");
    }
  }

  async function copyCode(guest: Guest) {
    try {
      await navigator.clipboard.writeText(guest.invitation_code);
      setCopied(guest.id);
      window.setTimeout(() => setCopied(""), 1700);
    } catch {
      setMessage("No fue posible copiar el código.");
    }
  }

  const statusLabel = (status: RSVPStatus) => status === "CONFIRMED" ? "Confirmado" : status === "DECLINED" ? "No asistirá" : "Pendiente";

  return <section>
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[.17em] text-[#a27b72]">Lista de asistencia</p><h1 className="serif mt-2 text-4xl text-[#493a37]">Invitados</h1><p className="mt-2 text-sm text-[#847772]">{guests.length} personas · gestiona invitaciones y respuestas</p></div>
      <Button onClick={openCreate}><Plus size={17} /> Agregar invitado</Button>
    </div>
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#e9e1db] bg-[#fffdf9] px-3"><Search size={17} className="text-[#a08f87]" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-12 w-full bg-transparent text-sm outline-none placeholder:text-[#a99d96]" placeholder="Buscar por nombre o código" aria-label="Buscar invitados" /></div>
    {message && <p className="mb-4 rounded-xl bg-[#f4e9e2] px-4 py-3 text-sm text-[#775d56]" role="status" aria-live="polite">{message}</p>}
    <div className="overflow-hidden rounded-2xl border border-[#e9e1db] bg-[#fffdf9]">
      <div className="hidden grid-cols-[1.4fr_1fr_1fr_.8fr_auto] gap-4 border-b border-[#eee6e0] px-5 py-3 text-[10px] font-semibold uppercase tracking-[.14em] text-[#97867f] md:grid"><span>Nombre</span><span>Código</span><span>Asistencia</span><span>Estado</span><span>Acciones</span></div>
      {filtered.length ? filtered.map((guest) => <article key={guest.id} className="grid gap-3 border-b border-[#f0e9e4] px-4 py-4 last:border-0 sm:px-5 md:grid-cols-[1.4fr_1fr_1fr_.8fr_auto] md:items-center md:gap-4">
        <div className="flex items-center justify-between md:block"><p className="font-semibold text-[#51433f]">{guest.name}</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-medium md:hidden ${guest.is_active ? "bg-[#edf0e9] text-[#71816a]" : "bg-[#f3e7e0] text-[#9c6b64]"}`}>{guest.is_active ? "Activo" : "Inactivo"}</span></div>
        <div className="flex items-center gap-2"><code className="rounded-md bg-[#f6f0eb] px-2 py-1 text-xs tracking-[.12em] text-[#745b54]">{guest.invitation_code}</code><button onClick={() => copyCode(guest)} aria-label={`Copiar código de ${guest.name}`} className="grid h-8 w-8 place-items-center rounded-md text-[#8b7770] hover:bg-[#f4ede8]">{copied === guest.id ? <Check size={14} /> : <Clipboard size={14} />}</button></div>
        <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-medium ${guest.rsvp_status === "CONFIRMED" ? "bg-[#edf0e9] text-[#687c60]" : guest.rsvp_status === "DECLINED" ? "bg-[#f1ece8] text-[#887b73]" : "bg-[#f7efe1] text-[#96794f]"}`}>{statusLabel(guest.rsvp_status)}{guest.rsvp_status === "CONFIRMED" && guest.companions > 0 ? ` (+${guest.companions})` : ""}</span>
        <span className={`hidden w-fit rounded-full px-2.5 py-1 text-[11px] font-medium md:block ${guest.is_active ? "bg-[#edf0e9] text-[#71816a]" : "bg-[#f3e7e0] text-[#9c6b64]"}`}>{guest.is_active ? "Activo" : "Inactivo"}</span>
        <div className="flex gap-1"><button onClick={() => openEdit(guest)} className="grid h-9 w-9 place-items-center rounded-lg text-[#7d6962] hover:bg-[#f5eee9]" aria-label={`Editar a ${guest.name}`}><Pencil size={15} /></button><button onClick={() => remove(guest)} className="grid h-9 w-9 place-items-center rounded-lg text-[#a06b66] hover:bg-[#f8eeeb]" aria-label={`Eliminar a ${guest.name}`}><Trash2 size={15} /></button></div>
      </article>) : <div className="px-5 py-12 text-center"><UserRoundPlus className="mx-auto text-[#b69a8e]" size={25} /><p className="mt-3 text-sm text-[#81736e]">{query ? "No encontramos invitados con esa búsqueda." : "Aún no has agregado invitados."}</p></div>}
    </div>
    {showForm && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#342925]/45 px-4 py-8" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}><section role="dialog" aria-modal="true" aria-labelledby="guest-form-title" className="surface w-full max-w-lg rounded-[24px] p-6 sm:p-8">
      <div className="flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#a27b72]">Invitados</p><h2 id="guest-form-title" className="serif mt-1 text-3xl text-[#493a37]">{editing ? "Editar invitado" : "Nueva invitación"}</h2></div><button onClick={() => setShowForm(false)} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#f5eee9]"><X size={18} /></button></div>
      <form onSubmit={save} className="mt-6 space-y-4"><div><label htmlFor="guest-name" className="label">Nombre completo</label><input id="guest-name" className="field" value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} required minLength={2} maxLength={120} autoFocus /></div>
        <div><label htmlFor="guest-code" className="label">Código de invitación</label><div className="flex gap-2"><input id="guest-code" className="field uppercase tracking-[.15em]" value={form.invitation_code} onChange={(event) => setForm((value) => ({ ...value, invitation_code: event.target.value.toUpperCase() }))} required minLength={4} maxLength={16} /><Button type="button" variant="secondary" size="small" onClick={() => setForm((value) => ({ ...value, invitation_code: makeCode() }))} aria-label="Generar nuevo código"><RefreshCw size={15} /><span className="hidden sm:inline">Generar</span></Button></div></div>
        {editing && <><div><label htmlFor="guest-rsvp" className="label">Estado RSVP</label><select id="guest-rsvp" className="field" value={form.rsvp_status} onChange={(event) => setForm((value) => ({ ...value, rsvp_status: event.target.value as RSVPStatus }))}><option value="PENDING">Pendiente</option><option value="CONFIRMED">Confirmado</option><option value="DECLINED">No asistirá</option></select></div><div><label htmlFor="guest-companions" className="label">Acompañantes</label><input id="guest-companions" className="field" type="number" min={0} max={10} value={form.companions} onChange={(event) => setForm((value) => ({ ...value, companions: Number(event.target.value) }))} /></div></>}
        <label className="flex min-h-11 items-center gap-3 text-sm text-[#685954]"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm((value) => ({ ...value, is_active: event.target.checked }))} className="h-4 w-4 accent-[#985d5a]" /> Invitación activa</label>
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button><Button disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />}{editing ? "Guardar cambios" : "Crear invitado"}</Button></div>
      </form>
    </section></div>}
  </section>;
}
