"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight, Cloud, Flower2, Heart, Moon, Sparkles, Star } from "lucide-react";
import { ScrollButterflies } from "@/components/invitation/scroll-butterflies";
import { Button } from "@/components/ui/button";

const ease = [0.22, 1, 0.36, 1] as const;

export function HomePage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const cloudParallax = useTransform(scrollY, [0, 900], [0, 30]);
  const flowerParallax = useTransform(scrollY, [0, 900], [0, -18]);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/guest/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "El código de invitación no es válido.");
      router.push("/invitacion");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ha ocurrido un problema. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  const enter = reducedMotion ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: .8, ease } };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_50%_32%,#fffdf9_0%,#f8f2ea_48%,#f3e9df_100%)]">
      <ScrollButterflies />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 top-24 h-72 w-72 rounded-full bg-[#eadbd0]/50 blur-3xl" />
        <div className="absolute -right-24 top-72 h-80 w-80 rounded-full bg-[#efd9d2]/55 blur-3xl" />
        <motion.div className="absolute left-[8%] top-[16%]" style={{ y: reducedMotion ? 0 : cloudParallax }}><div className="drift"><Cloud className="h-12 w-12 text-white/80" strokeWidth={1} /></div></motion.div>
        <motion.div className="absolute right-[9%] top-[28%] hidden sm:block" style={{ y: reducedMotion ? 0 : cloudParallax }}><div className="drift [animation-delay:-8s]"><Cloud className="h-16 w-16 text-white/70" strokeWidth={1} /></div></motion.div>
        <Star className="twinkle absolute left-[19%] top-[38%] h-4 w-4 text-[#c99b82]" strokeWidth={1} />
        <Star className="twinkle absolute right-[18%] top-[16%] h-3 w-3 text-[#c99b82] [animation-delay:-1.5s]" strokeWidth={1} />
        <motion.div className="absolute bottom-[18%] left-[7%] hidden sm:block" style={{ y: reducedMotion ? 0 : flowerParallax }}><div className="float-soft"><Flower2 className="h-12 w-12 text-[#c89188]/70" strokeWidth={1} /></div></motion.div>
        <motion.div className="absolute right-[7%] top-[54%]" style={{ y: reducedMotion ? 0 : flowerParallax }}><div className="float-soft [animation-delay:-3s]"><Flower2 className="h-10 w-10 text-[#98a28d]/75" strokeWidth={1} /></div></motion.div>
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <a href="#inicio" className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.22em] text-[#786763]">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-[#cda7a0]/60 text-[#a9726f]"><Heart size={15} strokeWidth={1.5} /></span>
          Un día para celebrar
        </a>
        <a href="/admin/login" className="rounded-full px-3 py-2 text-xs text-[#8a7c76] transition hover:bg-white/60 hover:text-[#594947]">Administración</a>
      </header>

      <div id="inicio" className="relative z-10 mx-auto grid min-h-[calc(100svh-72px)] max-w-7xl items-center gap-10 px-5 pb-14 pt-5 sm:px-8 md:grid-cols-[1.06fr_.94fr] md:gap-8 lg:px-16 lg:pb-20">
        <motion.section {...enter} className="order-2 flex flex-col items-center text-center md:order-1 md:items-start md:text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dfcfc2] bg-white/55 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#9c7469]">
            <Sparkles size={13} strokeWidth={1.5} /> Baby Shower · Una invitación hecha con amor
          </div>
          <h1 className="serif max-w-[620px] text-[clamp(2.85rem,8vw,5.7rem)] leading-[.98] tracking-[-.055em] text-[#443735]">
            Estamos esperando a <em className="font-normal text-[#b87976]">alguien</em> muy especial
          </h1>
          <p className="mt-6 max-w-[420px] text-[15px] leading-7 text-[#837572] sm:text-base">
            Y queremos celebrar esta dulce espera junto a las personas que más queremos.
          </p>
          <a href="#mi-invitacion" className="mt-8 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#985d5a] px-7 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(152,93,90,.2)] transition hover:-translate-y-0.5 hover:bg-[#824d4b]">
            Ver mi invitación <ArrowUpRight size={16} />
          </a>
          <div className="mt-9 flex items-center gap-3 text-xs text-[#92827c]"><span className="h-px w-9 bg-[#d8c8bd]" /> Un momento, un recuerdo para siempre</div>
        </motion.section>

        <motion.section
          {...(reducedMotion ? {} : { initial: { opacity: 0, scale: .96, y: 12 }, animate: { opacity: 1, scale: 1, y: 0 }, transition: { duration: 1, delay: .12, ease } })}
          aria-label="Ilustración delicada de una cuna entre flores"
          className="order-1 mx-auto w-full max-w-[440px] md:order-2"
        >
          <div className="relative mx-auto aspect-[.9] w-full max-w-[370px]">
            <div className="absolute inset-[7%] rounded-[48%_48%_43%_43%] border border-[#cba9a0]/40 bg-[linear-gradient(160deg,rgba(255,255,255,.8),rgba(238,220,207,.58))] shadow-[0_28px_70px_rgba(124,92,75,.11)]" />
            <div className="absolute inset-[14%] rounded-[48%_48%_43%_43%] border border-white/70" />
            <div className="absolute left-1/2 top-[17%] -translate-x-1/2 text-[#b47e78]"><Moon size={25} strokeWidth={1.2} /></div>
            <Star className="twinkle absolute left-[23%] top-[34%] h-4 w-4 text-[#c7987c]" strokeWidth={1.1} />
            <Star className="twinkle absolute right-[24%] top-[28%] h-3 w-3 text-[#c7987c] [animation-delay:-2s]" strokeWidth={1.1} />
            <div className="absolute left-1/2 top-[31%] -translate-x-1/2 text-[78px] leading-none drop-shadow-[0_9px_10px_rgba(117,83,71,.14)] sm:text-[92px]" aria-hidden="true">🧸</div>
            <div className="absolute bottom-[23%] left-1/2 h-[22%] w-[52%] -translate-x-1/2 rounded-t-[48%] border border-[#bc9288]/70 bg-[#f6e8df] shadow-[0_12px_24px_rgba(120,82,70,.08)]">
              <span className="absolute -top-4 left-1/2 h-8 w-[112%] -translate-x-1/2 rounded-full border border-[#c69b8f]/70 bg-[#fff9f3]" />
              <span className="absolute bottom-0 left-[19%] h-[77%] w-px bg-[#c69b8f]/55" />
              <span className="absolute bottom-0 left-[50%] h-[77%] w-px bg-[#c69b8f]/55" />
              <span className="absolute bottom-0 right-[19%] h-[77%] w-px bg-[#c69b8f]/55" />
            </div>
            <div className="absolute bottom-[14%] left-[21%] text-[#9aa18b]"><Flower2 size={43} strokeWidth={1.1} /></div>
            <div className="absolute bottom-[19%] right-[17%] rotate-12 text-[#c59186]"><Flower2 size={34} strokeWidth={1.1} /></div>
            <div className="absolute right-[13%] top-[43%] rounded-full border border-white/80 bg-white/60 px-3 py-2 text-[10px] uppercase tracking-[.17em] text-[#9b7a70] shadow-sm">con amor</div>
            <div className="absolute bottom-[6%] left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap text-[10px] uppercase tracking-[.24em] text-[#927e76]">
              <span className="h-px w-7 bg-[#d3b9aa]" /> Una espera muy dulce <span className="h-px w-7 bg-[#d3b9aa]" />
            </div>
          </div>
        </motion.section>
      </div>

      <section id="mi-invitacion" className="relative z-10 px-5 pb-20 pt-7 sm:pb-28">
        <motion.div
          {...(reducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-70px" }, transition: { duration: .7, ease } })}
          className="surface mx-auto max-w-xl rounded-[28px] px-6 py-8 text-center sm:px-12 sm:py-11"
        >
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f4e8e1] text-[#a97570]"><Heart size={19} strokeWidth={1.4} /></span>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.24em] text-[#a17a70]">Tu lugar te está esperando</p>
          <h2 className="serif mt-2 text-3xl text-[#493a37] sm:text-[2.25rem]">Ingresa tu código</h2>
          <p className="mt-2 text-sm leading-6 text-[#887c77]">Escribe el código personal que recibiste para abrir tu invitación.</p>
          <form onSubmit={submitCode} className="mt-7 text-left">
            <label htmlFor="invitation-code" className="label">Código de invitación</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input id="invitation-code" className="field min-h-12 flex-1 uppercase tracking-[.16em]" placeholder="EJ. MG4821" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" required maxLength={16} aria-describedby={error ? "invite-error" : undefined} />
              <Button type="submit" className="shrink-0" disabled={loading || !code.trim()}>{loading ? "Validando…" : "Abrir invitación"}</Button>
            </div>
            <p id="invite-error" role="alert" aria-live="polite" className="min-h-6 pt-2 text-sm text-[#a64d4a]">{error}</p>
          </form>
        </motion.div>
        <div className="mt-8 flex justify-center text-[#ad958a]"><ArrowDown size={17} strokeWidth={1.4} /></div>
      </section>
      <footer className="relative z-10 border-t border-[#e7ddd4] px-5 py-6 text-center text-xs text-[#95847d]">Hecho con mucho amor, para un día inolvidable <span aria-hidden="true">·</span> <a href="/admin/login" className="underline decoration-[#cbb9ac] underline-offset-4">Acceso privado</a></footer>
    </main>
  );
}
