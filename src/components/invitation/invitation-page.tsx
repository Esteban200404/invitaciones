"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Flower2,
  Gift,
  Heart,
  Link2,
  LoaderCircle,
  MapPin,
  Share2,
  Sparkles,
  Star,
} from "lucide-react";
import { ScrollButterflies } from "@/components/invitation/scroll-butterflies";
import { Button } from "@/components/ui/button";
import { formatEventDate, formatEventTime } from "@/lib/utils";
import type { EventRecord, GiftStatus, RSVPStatus } from "@/types/database";

type Guest = {
  id: string;
  name: string;
  rsvp_status: RSVPStatus;
  companions: number;
};
type PublicGift = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  status: GiftStatus;
  reservedByYou: boolean;
};
type InvitationData = { guest: Guest; event: EventRecord; gifts: PublicGift[] };

const ease = [0.22, 1, 0.36, 1] as const;

function calendarRange(event: EventRecord) {
  const [year, month, day] = event.event_date.split("-").map(Number);
  const [hours, minutes] = event.event_time.split(":").map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const format = (date: Date) =>
    `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}T${String(date.getUTCHours()).padStart(2, "0")}${String(date.getUTCMinutes()).padStart(2, "0")}00`;
  return { start: format(startDate), end: format(endDate) };
}

function escapeCalendarText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(/\r?\n/g, "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

export function GoogleCalendarLink({ event }: { event: EventRecord }) {
  const { start, end } = calendarRange(event);
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", event.name);
  url.searchParams.set("dates", `${start}/${end}`);
  url.searchParams.set("ctz", event.timezone);
  url.searchParams.set("details", event.description ?? "Baby Shower");
  url.searchParams.set(
    "location",
    [event.location, event.address].filter(Boolean).join(", "),
  );
  return (
    <a
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#dfd2c8] bg-white/65 px-4 text-sm text-[#604e49] transition hover:bg-white"
      target="_blank"
      rel="noreferrer"
      href={url.toString()}
    >
      <CalendarDays size={16} /> Google Calendar
    </a>
  );
}

export function CalendarDownload({ event }: { event: EventRecord }) {
  function download() {
    const { start, end } = calendarRange(event);
    const location = [event.location, event.address].filter(Boolean).join(", ");
    const content = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Invitaciones//Baby Shower//ES",
      "BEGIN:VEVENT",
      `DTSTART;TZID=${event.timezone}:${start}`,
      `DTEND;TZID=${event.timezone}:${end}`,
      `SUMMARY:${escapeCalendarText(event.name)}`,
      `DESCRIPTION:${escapeCalendarText(event.description ?? "Baby Shower")}`,
      `LOCATION:${escapeCalendarText(location)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/calendar;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "baby-shower.ics";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <button
      onClick={download}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#dfd2c8] bg-white/65 px-4 text-sm text-[#604e49] transition hover:bg-white"
    >
      <CalendarDays size={16} /> Apple / Outlook
    </button>
  );
}

export function InvitationPage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [data, setData] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [companions, setCompanions] = useState(0);
  const [notice, setNotice] = useState("");
  const [selectedGift, setSelectedGift] = useState<PublicGift | null>(null);
  const [shareNotice, setShareNotice] = useState("");
  const [sharingPdf, setSharingPdf] = useState(false);

  const loadInvitation = useCallback(async () => {
    const response = await fetch("/api/guest/me", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 401) router.replace("/");
      throw new Error(result.error ?? "No fue posible cargar tu invitación.");
    }
    setData(result as InvitationData);
    setCompanions(result.guest.companions ?? 0);
  }, [router]);

  useEffect(() => {
    loadInvitation()
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Ha ocurrido un problema. Intenta nuevamente.",
        ),
      )
      .finally(() => setLoading(false));
  }, [loadInvitation]);

  const reveal = useMemo(
    () =>
      reducedMotion
        ? {}
        : {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, margin: "-60px" },
            transition: { duration: 0.7, ease },
          },
    [reducedMotion],
  );

  async function updateRsvp(status: "CONFIRMED" | "DECLINED") {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, companions }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "No se pudo guardar tu respuesta.");
      setData((current) =>
        current
          ? {
              ...current,
              guest: {
                ...current.guest,
                rsvp_status: status,
                companions: status === "CONFIRMED" ? companions : 0,
              },
            }
          : current,
      );
      setNotice(
        status === "CONFIRMED"
          ? "¡Nos alegra muchísimo contar contigo!"
          : "Gracias por avisarnos. Te vamos a extrañar.",
      );
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Ha ocurrido un problema. Intenta nuevamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function reserveGift() {
    if (!selectedGift) return;
    setBusy(true);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftId: selectedGift.id }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "No se pudo reservar el regalo.");
      setSelectedGift(null);
      setNotice(
        "¡Perfecto! Este regalo quedó reservado. Gracias por acompañarnos.",
      );
      await loadInvitation();
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Ha ocurrido un problema. Intenta nuevamente.",
      );
      if (
        reason instanceof Error &&
        reason.message.includes("acaba de ser seleccionado")
      )
        await loadInvitation();
    } finally {
      setBusy(false);
    }
  }

  async function shareInvitation() {
    if (!data || sharingPdf) return;
    setSharingPdf(true);
    setShareNotice("");
    try {
      const { createInvitationPdf } = await import("@/lib/invitation-pdf");
      const blob = await createInvitationPdf({
        guestName: data.guest.name,
        event: data.event,
        eventDate: formatEventDate(data.event.event_date),
        eventTime: formatEventTime(data.event.event_time),
      });
      const fileName = `Invitacion-${data.guest.name}-${data.event.name}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9-]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 90);
      const file = new File([blob], `${fileName || "Baby-Shower"}.pdf`, {
        type: "application/pdf",
      });
      const canShareFile =
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });

      if (canShareFile) {
        try {
          await navigator.share({
            title: data.event.name,
            text: "Te comparto la invitación de nuestro Baby Shower.",
            files: [file],
          });
          setShareNotice("Invitación PDF lista para compartir.");
          return;
        } catch (reason) {
          if (reason instanceof Error && reason.name === "AbortError") return;
        }
      }

      const url = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.name;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setShareNotice(
        "El PDF se descargó. Ya puedes adjuntarlo en tu aplicación de mensajería.",
      );
    } catch {
      setShareNotice("No fue posible generar el PDF. Intenta nuevamente.");
    } finally {
      setSharingPdf(false);
    }
  }

  async function shareLink() {
    if (!data) return;
    const url = `${window.location.origin}/`;
    try {
      const shareData = {
        title: data.event.name,
        text: "Mira la invitación de nuestro Baby Shower.",
        url,
      };
      if (navigator.share) {
        await navigator.share(shareData);
        setShareNotice("Enlace listo para compartir.");
      } else {
        await navigator.clipboard.writeText(url);
        setShareNotice("Enlace copiado. Ya puedes pegarlo en WhatsApp.");
      }
    } catch (reason) {
      if (reason instanceof Error && reason.name === "AbortError") return;
      setShareNotice("No fue posible compartir el enlace.");
    }
  }

  if (loading)
    return (
      <main className="grid min-h-screen place-items-center bg-[#f8f4ee] px-5">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin text-[#a97870]"
            size={27}
          />
          <p className="mt-4 text-sm text-[#776965]">
            Estamos preparando tu invitación…
          </p>
        </div>
      </main>
    );
  if (!data)
    return (
      <main className="grid min-h-screen place-items-center bg-[#f8f4ee] px-5">
        <div className="surface max-w-md rounded-3xl p-8 text-center">
          <p className="serif text-3xl">Un momento, por favor</p>
          <p className="mt-3 text-sm text-[#7c706b]">
            {error || "No pudimos encontrar tu invitación."}
          </p>
          <Button className="mt-6" onClick={() => router.push("/")}>
            Volver al inicio
          </Button>
        </div>
      </main>
    );

  const { guest, event, gifts } = data;
  const eventDate = formatEventDate(event.event_date);
  const eventTime = formatEventTime(event.event_time);

  return (
    <main
      className="invitation-theme relative overflow-hidden bg-[#f8f4ee] text-[#413633]"
      style={
        {
          "--event-accent": event.accent_colors?.primary ?? "#985d5a",
          "--event-background": event.accent_colors?.secondary ?? "#f8f4ee",
        } as CSSProperties
      }
    >
      <ScrollButterflies />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[730px] overflow-hidden bg-[radial-gradient(ellipse_at_50%_17%,#fffdf9_0%,#f7eee7_65%,#f8f4ee_100%)]"
      >
        <div className="absolute -left-24 top-28 h-64 w-64 rounded-full bg-[#efddd6]/45 blur-3xl" />
        <div className="absolute -right-16 top-12 h-72 w-72 rounded-full bg-[#e9e5db]/70 blur-3xl" />
        <Star
          className="twinkle absolute left-[12%] top-[19%] text-[#b99a7f]"
          size={14}
          strokeWidth={1}
        />
        <Star
          className="twinkle absolute right-[16%] top-[28%] text-[#b99a7f] [animation-delay:-2s]"
          size={18}
          strokeWidth={1}
        />
      </div>
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <a
          href="#arriba"
          className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#7c6962]"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full border border-[#d9c7bc]">
            <Heart size={15} />
          </span>{" "}
          Invitación personal
        </a>
        <button
          onClick={shareLink}
          className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-xs text-[#735f58] hover:bg-white/70"
          aria-label="Compartir enlace de la invitación"
        >
          <Link2 size={15} /> <span className="hidden sm:inline">Compartir enlace</span>
        </button>
      </header>

      <section
        id="arriba"
        className="relative z-10 mx-auto flex min-h-[590px] max-w-5xl flex-col items-center px-5 pb-16 pt-12 text-center sm:pt-16"
      >
        <div className="mb-6 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.23em] text-[#a47970]">
          <Sparkles size={13} /> Con mucho cariño
        </div>
        <motion.div
          {...(reducedMotion
            ? {}
            : {
                initial: { opacity: 0, y: 13 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.8, ease },
              })}
        >
          <p className="serif text-2xl italic text-[#88726b] sm:text-[2rem]">
            Querida/o
          </p>
          <h1 className="serif mt-1 break-words text-[clamp(3rem,10vw,6.2rem)] leading-[1.02] tracking-[-.055em] text-[#483a37]">
            {guest.name}
          </h1>
        </motion.div>
        <p className="serif mt-7 max-w-2xl text-[1.3rem] leading-8 text-[#766460] sm:text-[1.65rem] sm:leading-10">
          Tenemos el placer de invitarte a celebrar con nosotros este momento
          tan especial.
        </p>
        <div
          className="float-soft relative mt-9 grid h-[210px] w-[235px] place-items-center"
          aria-hidden="true"
        >
          <div className="absolute inset-1 rounded-[48%_52%_45%_55%] border border-[#d7b7a9]/60 bg-[linear-gradient(145deg,#fffdf8,#f2e5dc)] shadow-[0_24px_55px_rgba(105,79,64,.12)]" />
          <div className="absolute inset-5 rounded-[48%_52%_45%_55%] border border-white/75" />
          <Image
            src="/baby-bear-cloud.png"
            alt="Osito dormido sobre una nube con un lazo rosado"
            width={712}
            height={712}
            priority
            sizes="(max-width: 640px) 190px, 220px"
            className="relative -mt-2 h-[180px] w-[190px] object-contain drop-shadow-[0_8px_10px_rgba(87,65,57,.12)] sm:h-[200px] sm:w-[220px]"
          />
          <Flower2
            className="absolute bottom-6 left-5 text-[#a1a28f]"
            size={34}
            strokeWidth={1}
          />
          <Flower2
            className="absolute bottom-8 right-6 rotate-12 text-[#c48d82]"
            size={28}
            strokeWidth={1}
          />
          <Star
            className="absolute left-7 top-8 text-[#bd977c]"
            size={15}
            strokeWidth={1}
          />
          <Star
            className="absolute right-7 top-7 text-[#bd977c]"
            size={12}
            strokeWidth={1}
          />
        </div>
        <a
          href="#celebracion"
          className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[.18em] text-[#977972] transition hover:text-[#73514e]"
        >
          Descubre los detalles <ChevronDown size={14} />
        </a>
      </section>

      <section
        id="celebracion"
        className="relative z-10 mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-20"
      >
        <motion.div
          {...reveal}
          className="surface relative overflow-hidden rounded-[30px] px-6 py-10 text-center sm:px-14 sm:py-14"
        >
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#d7b4a5] via-[#bc8580] to-[#d7b4a5]" />
          <p className="text-[10px] font-semibold uppercase tracking-[.25em] text-[#a47c72]">
            {event.name}
          </p>
          <h2 className="serif mt-4 text-4xl leading-tight text-[#493a37] sm:text-6xl">
            {event.baby_name
              ? `Celebramos a ${event.baby_name}`
              : "Una dulce espera"}
          </h2>
          {event.cover_image_url && (
            <div className="relative mx-auto mb-6 mt-7 aspect-[2/1] w-full max-w-2xl overflow-hidden rounded-2xl">
              <Image
                src={event.cover_image_url}
                alt={`Imagen de ${event.name}`}
                fill
                unoptimized
                sizes="(max-width: 768px) 90vw, 672px"
                className="object-cover"
              />
            </div>
          )}
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#847772]">
            {event.description ||
              "Un día para compartir ilusión, abrazos y todo el amor que ya sentimos por nuestro bebé."}
          </p>
          <div className="mx-auto my-8 flex max-w-xs items-center gap-3 text-[#c3988d]">
            <span className="h-px flex-1 bg-[#e8d9d0]" />
            <Flower2 size={18} strokeWidth={1} />
            <span className="h-px flex-1 bg-[#e8d9d0]" />
          </div>
          <div className="grid gap-4 text-left sm:grid-cols-2">
            <div className="rounded-2xl bg-[#f8f3ed] p-5">
              <div className="flex items-center gap-2 text-[#aa7970]">
                <CalendarDays size={17} />
                <span className="text-[10px] font-semibold uppercase tracking-[.18em]">
                  Cuándo
                </span>
              </div>
              <p className="serif mt-3 text-xl capitalize text-[#51433f]">
                {eventDate}
              </p>
              <p className="mt-1 text-sm text-[#887a74]">A las {eventTime}</p>
            </div>
            <div className="rounded-2xl bg-[#f8f3ed] p-5">
              <div className="flex items-center gap-2 text-[#aa7970]">
                <MapPin size={17} />
                <span className="text-[10px] font-semibold uppercase tracking-[.18em]">
                  Dónde
                </span>
              </div>
              <p className="serif mt-3 text-xl text-[#51433f]">
                {event.location || "Muy pronto"}
              </p>
              <p className="mt-1 text-sm text-[#887a74]">
                {event.address || ""}
              </p>
              {event.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex min-h-10 items-center text-xs font-semibold text-[#985d5a] underline decoration-[#d1aaa1] underline-offset-4"
                >
                  Cómo llegar <MapPin size={13} className="ml-1" />
                </a>
              )}
            </div>
          </div>
          {event.extra_info && (
            <p className="mt-5 rounded-xl bg-[#f8f3ed] p-4 text-sm leading-6 text-[#74645f] font-bold">
              {event.extra_info}
            </p>
          )}
          {/* <div className="mt-6 flex flex-wrap justify-center gap-2"><GoogleCalendarLink event={event} /><CalendarDownload event={event} /></div> */}
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-5xl px-5 pb-8 pt-2 sm:px-8 sm:pb-12">
        <motion.div
          {...reveal}
          className="grid items-center gap-3 overflow-hidden rounded-[30px] border border-[#e8d8cf] bg-[linear-gradient(135deg,#f5e8e1,#fffaf5)] px-6 py-7 sm:px-12 md:grid-cols-[1fr_.7fr] md:py-8"
        >
          <div className="text-center md:text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#a17b72]">
              Una dulce espera
            </p>
            <h2 className="serif mt-3 text-3xl leading-tight text-[#493a37] sm:text-4xl">
              {event.baby_name
                ? `Ya casi te conocemos, ${event.baby_name}`
                : "Una aventura llena de amor está por comenzar"}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#847772]">
              Cada abrazo y cada sonrisa harán este día todavía más especial.
              Gracias por acompañarnos en este comienzo.
            </p>
          </div>
          <div className="mx-auto w-full max-w-[165px] sm:max-w-[205px] md:max-w-[225px]">
            <Image
              src="/baby-balloon.png"
              alt="Globo rosa con un osito bebé entre nubes"
              width={567}
              height={1024}
              sizes="(max-width: 768px) 45vw, 225px"
              className="h-auto w-full object-contain drop-shadow-[0_12px_18px_rgba(120,82,70,.1)]"
            />
          </div>
        </motion.div>
      </section>

      <section
        id="rsvp"
        className="relative z-10 mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-16"
      >
        <motion.div
          {...reveal}
          className="grid overflow-hidden rounded-[30px] border border-[#d9c8be] bg-[#eee3dc] md:grid-cols-[.82fr_1.18fr]"
        >
          <div className="relative flex min-h-56 flex-col justify-center overflow-hidden bg-[#e8d7cf] px-7 py-9 sm:px-10">
            <Flower2
              className="absolute -right-5 -top-5 rotate-12 text-[#c08f84]/45"
              size={110}
              strokeWidth={0.7}
            />
            <span className="relative text-[10px] font-semibold uppercase tracking-[.22em] text-[#98736b]">
              Tu compañía nos hace felices
            </span>
            <h2 className="serif relative mt-4 text-4xl leading-tight text-[#483a37]">
              ¿Nos acompañarás?
            </h2>
            <p className="relative mt-3 max-w-xs text-sm leading-6 text-[#7f6e68]">
              Cuéntanos para preparar todo con mucho cariño.
            </p>
          </div>
          <div className="flex flex-col justify-center bg-[#fffdf9] px-6 py-8 sm:px-10">
            <p className="text-sm text-[#81736e]">
              Tu respuesta actual:{" "}
              <strong className="text-[#584744]">
                {guest.rsvp_status === "CONFIRMED"
                  ? "Sí, asistiré"
                  : guest.rsvp_status === "DECLINED"
                    ? "No podré asistir"
                    : "Pendiente"}
              </strong>
            </p>
            {guest.rsvp_status !== "DECLINED" && (
              <label className="mt-5 max-w-[230px]">
                <span className="label">Acompañantes adicionales*</span>
                <select
                  className="field min-h-11"
                  value={companions}
                  onChange={(event) =>
                    setCompanions(Number(event.target.value))
                  }
                  aria-label="Número de acompañantes"
                >
                  {Array.from({ length: 6 }, (_, number) => (
                    <option key={number} value={number}>
                      {number} {number === 1 ? "acompañante" : "acompañantes"}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button disabled={busy} onClick={() => updateRsvp("CONFIRMED")}>
                <Check size={16} /> Sí, confirmo mi asistencia
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => updateRsvp("DECLINED")}
              >
                No podré asistir
              </Button>
            </div>
            {notice && (
              <p
                role="status"
                aria-live="polite"
                className="mt-4 text-sm text-[#785e59]"
              >
                {notice}
              </p>
            )}
          </div>
        </motion.div>
      </section>

      <section
        id="regalos"
        className="relative z-10 mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-20"
      >
        <motion.div {...reveal} className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#efe3dc] text-[#a87870]">
            <Gift size={20} strokeWidth={1.4} />
          </span>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.24em] text-[#a17b72]">
            Un detalle con mucho amor
          </p>
          <h2 className="serif mt-2 text-4xl text-[#493a37] sm:text-5xl">
            ¿Qué quieres regalar?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#847772]">
            Tu cariño es el mejor regalo. Si deseas ayudarnos con algo para el
            bebé, aquí dejamos algunas ideas para que no se repitan.
          </p>
        </motion.div>
        {gifts.length ? (
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gifts.map((gift, index) => {
              const reserved = gift.status === "RESERVED";
              return (
                <motion.article
                  key={gift.id}
                  {...reveal}
                  transition={
                    reducedMotion
                      ? undefined
                      : {
                          duration: 0.55,
                          delay: Math.min(index * 0.05, 0.25),
                          ease,
                        }
                  }
                  className="flex min-h-32 items-start gap-4 rounded-[20px] border border-[#e8ddd5] bg-[#fffdf9]/85 p-5 shadow-[0_8px_24px_rgba(73,54,46,.035)]"
                >
                  {gift.image_url ? (
                    <Image
                      src={gift.image_url}
                      alt={gift.name}
                      width={48}
                      height={48}
                      unoptimized
                      className="mt-0.5 h-12 w-12 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span
                      className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full ${reserved ? "bg-[#edf0e9] text-[#77866e]" : "bg-[#f4e7e0] text-[#aa7770]"}`}
                    >
                      {reserved ? <Check size={17} /> : <Gift size={17} />}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[#554541]">
                      {gift.name}
                    </h3>
                    {gift.description && (
                      <p className="mt-1 text-sm leading-5 text-[#897b75]">
                        {gift.description}
                      </p>
                    )}
                    {reserved ? (
                      <p className="mt-3 text-xs font-medium text-[#71816a]">
                        {gift.reservedByYou
                          ? "Elegiste este regalo"
                          : "Ya seleccionado"}
                      </p>
                    ) : (
                      <button
                        onClick={() => setSelectedGift(gift)}
                        className="mt-3 min-h-9 rounded-full px-3 text-xs font-semibold text-[#995f5b] transition hover:bg-[#f3e7e1]"
                      >
                        Elegir este regalo <span aria-hidden="true">→</span>
                      </button>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <p className="mt-8 text-center text-sm text-[#887b75]">
            Pronto compartiremos algunas ideas de regalo.
          </p>
        )}
        <p className="mx-auto mt-3 max-w-lg border-t border-[#e8dcd8] pt-3 text-center text-sm font-bold leading-6 text-[#847772]">
          Si tienes otro regalo que quieras ofrecer, estaríamos encantados de
          recibirlo.
        </p>
      </section>

      <section className="relative z-10 px-5 pb-16 pt-8 sm:pb-24">
        <motion.div
          {...reveal}
          className="surface mx-auto max-w-3xl rounded-[30px] px-6 py-10 text-center sm:px-12 sm:py-14"
        >
          <Heart
            className="mx-auto text-[#bc807b]"
            size={21}
            strokeWidth={1.3}
          />
          <p className="serif mt-5 text-2xl leading-9 text-[#624c47] sm:text-3xl">
            {event.parents_message ||
              "Esperamos compartir contigo una tarde llena de amor, ilusión y momentos que guardaremos para siempre."}
          </p>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.23em] text-[#a17c73]">
            Con todo nuestro cariño
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              onClick={shareInvitation}
              disabled={sharingPdf}
              aria-label={sharingPdf ? "Preparando el PDF" : "Compartir invitación como PDF"}
              className="event-accent-button inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-60"
            >
              {sharingPdf ? <LoaderCircle className="animate-spin" size={15} /> : <Share2 size={15} />}
              {sharingPdf ? "Preparando PDF…" : "Compartir PDF"}
            </button>
            <button
              onClick={shareLink}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dfd2c8] px-5 text-sm font-semibold text-[#715c56] hover:bg-[#f7f1ec]"
              aria-label="Compartir el enlace de la invitación"
            >
              <Link2 size={15} /> Compartir enlace
            </button>
            {/* <button
              onClick={toggleMusic}
              aria-pressed={musicOn}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dfd2c8] px-4 text-sm text-[#715c56] hover:bg-[#f7f1ec]"
            >
              <Music2 size={15} /> {musicOn ? "Pausar música" : "Música"}
            </button> */}

          </div>
          {shareNotice && (
            <p className="mt-3 text-xs text-[#7f6c66]" role="status">
              {shareNotice}
            </p>
          )}
        </motion.div>
      </section>
      <footer className="relative z-10 border-t border-[#e7ddd4] px-5 py-6 text-center text-xs text-[#95847d]">
        Gracias por ser parte de esta historia <span className="mx-1">·</span>{" "}
        <a
          className="underline decoration-[#cbb9ac] underline-offset-4"
          href="/"
        >
          Volver al inicio
        </a>
      </footer>
      {selectedGift && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#342925]/45 px-5 py-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedGift(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reserve-title"
            className="surface w-full max-w-md rounded-[24px] p-6 sm:p-8"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f4e7e0] text-[#a87870]">
              <Gift size={19} />
            </span>
            <h2
              id="reserve-title"
              className="serif mt-5 text-3xl text-[#493a37]"
            >
              ¿Quieres reservarlo?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#7f716c]">
              {selectedGift.name} quedará reservado para que nadie más lo elija.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => setSelectedGift(null)}
              >
                Cancelar
              </Button>
              <Button disabled={busy} onClick={reserveGift}>
                {busy ? "Reservando…" : "Sí, reservar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
