"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Gift, LoaderCircle, Pencil, Plus, RotateCcw, ToggleLeft, ToggleRight, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type GiftItem = { id: string; name: string; description: string | null; image_url: string | null; status: "AVAILABLE" | "RESERVED"; is_active: boolean; gift_reservations: { guest_id: string | null; guest_name: string | null }[] };
type GiftForm = { name: string; description: string; image_url: string; is_active: boolean };
const emptyForm: GiftForm = { name: "", description: "", image_url: "", is_active: true };

export function GiftManager() {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [form, setForm] = useState<GiftForm>(emptyForm);
  const [editing, setEditing] = useState<GiftItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function loadGifts() {
    const response = await fetch("/api/admin/gifts", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "No se pudo cargar la lista de regalos.");
    setGifts(result.gifts);
  }
  useEffect(() => { loadGifts().catch((reason: unknown) => setMessage(reason instanceof Error ? reason.message : "No se pudo cargar la lista.")); }, []);

  function openCreate() { setEditing(null); setForm(emptyForm); setShowForm(true); setMessage(""); }
  function openEdit(gift: GiftItem) { setEditing(gift); setForm({ name: gift.name, description: gift.description ?? "", image_url: gift.image_url ?? "", is_active: gift.is_active }); setShowForm(true); setMessage(""); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/gifts", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...(editing ? { id: editing.id } : {}), ...form }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No se pudo guardar el regalo.");
      setMessage(editing ? "Regalo actualizado." : "Regalo agregado a la lista."); setShowForm(false); await loadGifts();
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Ha ocurrido un problema. Intenta nuevamente."); }
    finally { setBusy(false); }
  }

  async function remove(gift: GiftItem) {
    if (!window.confirm(`¿Eliminar “${gift.name}”? Esta acción liberará la reserva si existe.`)) return;
    const response = await fetch("/api/admin/gifts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: gift.id }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error ?? "No se pudo eliminar el regalo."); return; }
    setMessage("Regalo eliminado."); await loadGifts();
  }

  async function toggleActive(gift: GiftItem) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/gifts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: gift.id, name: gift.name, description: gift.description ?? "", image_url: gift.image_url ?? "", is_active: !gift.is_active }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "No se pudo actualizar el regalo.");
      await loadGifts(); setMessage(gift.is_active ? "Regalo oculto para los invitados." : "Regalo visible para los invitados.");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Ha ocurrido un problema."); }
    finally { setBusy(false); }
  }

  async function release(gift: GiftItem) {
    if (!window.confirm(`¿Liberar la reserva de “${gift.name}”?`)) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/gifts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ giftId: gift.id }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "No se pudo liberar la reserva.");
      await loadGifts(); setMessage("Regalo disponible nuevamente.");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Ha ocurrido un problema."); }
    finally { setBusy(false); }
  }

  return <section>
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.17em] text-[#a27b72]">Lista de regalos</p><h1 className="serif mt-2 text-4xl text-[#493a37]">Regalos</h1><p className="mt-2 text-sm text-[#847772]">La identidad de cada persona que reserva solo es visible aquí.</p></div><Button onClick={openCreate}><Plus size={17} /> Agregar regalo</Button></div>
    {message && <p role="status" aria-live="polite" className="mb-4 rounded-xl bg-[#f4e9e2] px-4 py-3 text-sm text-[#775d56]">{message}</p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{gifts.length ? gifts.map((gift) => {
      const reservation = gift.gift_reservations?.[0];
      const guestName = reservation?.guest_name;
      return <article key={gift.id} className="flex flex-col rounded-2xl border border-[#e9e1db] bg-[#fffdf9] p-5 shadow-[0_5px_20px_rgba(71,53,44,.025)]">
        <div className="flex items-start justify-between gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${gift.status === "RESERVED" ? "bg-[#edf0e9] text-[#71816a]" : "bg-[#f4e7e0] text-[#a87870]"}`}><Gift size={18} /></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${gift.status === "RESERVED" ? "bg-[#edf0e9] text-[#687c60]" : "bg-[#f7efe1] text-[#96794f]"}`}>{gift.status === "RESERVED" ? "Reservado" : "Disponible"}</span></div>
        <h2 className="mt-4 font-semibold text-[#51433f]">{gift.name}</h2><p className="mt-1 min-h-10 text-sm leading-5 text-[#897b75]">{gift.description || "Sin descripción adicional."}</p>
        {gift.status === "RESERVED" && <div className="mt-4 rounded-xl bg-[#f6f1eb] px-3 py-2.5 text-xs text-[#786861]"><span className="font-medium">Reservado por:</span> {guestName ?? "Nombre no disponible para esta reserva anterior"}</div>}
        <div className="mt-auto flex flex-wrap items-center gap-1 border-t border-[#f0e9e4] pt-4"><button onClick={() => openEdit(gift)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs text-[#74635d] hover:bg-[#f5eee9]"><Pencil size={14} /> Editar</button><button disabled={busy} onClick={() => toggleActive(gift)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs text-[#74635d] hover:bg-[#f5eee9]">{gift.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}{gift.is_active ? "Visible" : "Oculto"}</button>{gift.status === "RESERVED" && <button disabled={busy} onClick={() => release(gift)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs text-[#8a625b] hover:bg-[#f8eeeb]"><RotateCcw size={13} /> Liberar</button>}<button onClick={() => remove(gift)} className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-[#a06b66] hover:bg-[#f8eeeb]" aria-label={`Eliminar ${gift.name}`}><Trash2 size={15} /></button></div>
      </article>;
    }) : <div className="col-span-full rounded-2xl border border-dashed border-[#ddcfc6] bg-[#fffdf9] py-14 text-center"><Gift size={25} className="mx-auto text-[#b69a8e]" /><p className="mt-3 text-sm text-[#81736e]">Aún no hay regalos en la lista.</p></div>}</div>
    {showForm && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#342925]/45 px-4 py-8" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}><section role="dialog" aria-modal="true" aria-labelledby="gift-form-title" className="surface w-full max-w-lg rounded-[24px] p-6 sm:p-8">
      <div className="flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#a27b72]">Lista de regalos</p><h2 id="gift-form-title" className="serif mt-1 text-3xl text-[#493a37]">{editing ? "Editar regalo" : "Nuevo regalo"}</h2></div><button onClick={() => setShowForm(false)} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#f5eee9]"><X size={18} /></button></div>
      <form onSubmit={save} className="mt-6 space-y-4"><div><label htmlFor="gift-name" className="label">Nombre</label><input id="gift-name" className="field" value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} required minLength={2} maxLength={120} autoFocus /></div><div><label htmlFor="gift-description" className="label">Descripción</label><textarea id="gift-description" className="field min-h-24 resize-y" value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} maxLength={500} /></div><div><label htmlFor="gift-image" className="label">URL de imagen (opcional)</label><input id="gift-image" className="field" type="url" value={form.image_url} onChange={(event) => setForm((value) => ({ ...value, image_url: event.target.value }))} /></div><label className="flex min-h-10 items-center gap-3 text-sm text-[#685954]"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm((value) => ({ ...value, is_active: event.target.checked }))} className="h-4 w-4 accent-[#985d5a]" /> Visible para invitados</label><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button><Button disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />}{editing ? "Guardar cambios" : "Agregar regalo"}</Button></div></form>
    </section></div>}
  </section>;
}
