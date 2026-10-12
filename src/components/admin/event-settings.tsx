"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EventRecord } from "@/types/database";

type EventForm = {
  name: string; baby_name: string; description: string; event_date: string; event_time: string; timezone: string;
  location: string; address: string; extra_info: string; parents_message: string; cover_image_url: string;
  primary_color: string; secondary_color: string;
};

function toForm(event: EventRecord): EventForm {
  return {
    name: event.name ?? "", baby_name: event.baby_name ?? "", description: event.description ?? "",
    event_date: event.event_date, event_time: event.event_time.slice(0, 5), timezone: event.timezone || "America/Bogota",
    location: event.location ?? "", address: event.address ?? "", extra_info: event.extra_info ?? "",
    parents_message: event.parents_message ?? "", cover_image_url: event.cover_image_url ?? "",
    primary_color: event.accent_colors?.primary ?? "#985d5a", secondary_color: event.accent_colors?.secondary ?? "#f8f4ee",
  };
}

export function EventSettings({ initialEvent }: { initialEvent: EventRecord }) {
  const [form, setForm] = useState(() => toForm(initialEvent));
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  function change(name: keyof EventForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const { primary_color, secondary_color, ...fields } = form;
      const response = await fetch("/api/admin/event", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fields, accent_colors: { primary: primary_color, secondary: secondary_color } }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No se pudo guardar la configuración.");
      setStatus("Los detalles del evento se guardaron correctamente.");
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : "Ha ocurrido un problema. Intenta nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  const input = (key: keyof EventForm, label: string, type = "text", required = false) => <div><label className="label" htmlFor={`event-${key}`}>{label}</label><input id={`event-${key}`} className="field" type={type} value={form[key]} onChange={(event) => change(key, event.target.value)} required={required} /></div>;

  return <section className="rounded-2xl border border-[#e9e1db] bg-[#fffdf9] p-5 sm:p-7">
    <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[.17em] text-[#a27b72]">Personalización</p><h2 className="serif mt-1 text-3xl text-[#493a37]">Detalles del evento</h2><p className="mt-2 text-sm text-[#847772]">Los cambios se reflejan en la invitación de todos los invitados.</p></div>
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      {input("name", "Nombre del evento", "text", true)}{input("baby_name", "Nombre del bebé")}
      {input("event_date", "Fecha", "date", true)}{input("event_time", "Hora", "time", true)}
      {input("timezone", "Zona horaria", "text", true)}{input("location", "Lugar")}
      {input("address", "Dirección")}{input("cover_image_url", "URL de imagen principal", "url")}
      {input("primary_color", "Color de acento", "color")}{input("secondary_color", "Color de fondo", "color")}
      <div className="sm:col-span-2"><label className="label" htmlFor="event-description">Descripción</label><textarea id="event-description" className="field min-h-24 resize-y" value={form.description} onChange={(event) => change("description", event.target.value)} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="event-extra">Información adicional</label><textarea id="event-extra" className="field min-h-20 resize-y" value={form.extra_info} onChange={(event) => change("extra_info", event.target.value)} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="event-message">Mensaje de los padres</label><textarea id="event-message" className="field min-h-20 resize-y" value={form.parents_message} onChange={(event) => change("parents_message", event.target.value)} /></div>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2"><Button disabled={busy}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />} Guardar detalles</Button>{status && <p role="status" aria-live="polite" className="text-sm text-[#786862]">{status}</p>}</div>
    </form>
  </section>;
}
