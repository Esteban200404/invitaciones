"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Gift, LayoutDashboard, LogOut, Menu, Users, X } from "lucide-react";

const navigation = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/invitados", label: "Invitados", icon: Users },
  { href: "/admin/regalos", label: "Regalos", icon: Gift },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return <div className="min-h-screen bg-[#f7f4ef] lg:flex">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col border-r border-[#e8dfd8] bg-[#fffdf9] px-5 py-6 transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex items-center justify-between px-2"><Link href="/admin" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#f3e7e0] text-[#a8756f]"><HeartIcon /></span><span><span className="block text-sm font-semibold text-[#463936]">Baby Shower</span><span className="mt-0.5 block text-[10px] uppercase tracking-[.15em] text-[#a08d85]">Administración</span></span></Link><button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Cerrar menú"><X size={18} /></button></div>
      <nav className="mt-10 space-y-1" aria-label="Administración">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition ${pathname === href ? "bg-[#f2e8e2] font-semibold text-[#875954]" : "text-[#756660] hover:bg-[#f8f3ee]"}`}><Icon size={17} strokeWidth={1.7} />{label}</Link>)}</nav>
      <div className="mt-auto border-t border-[#eee5df] pt-4"><Link href="/" className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm text-[#7a6b65] hover:bg-[#f8f3ee]"><CalendarDays size={17} /> Ver invitación</Link><button onClick={logout} className="mt-1 flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-[#7a6b65] hover:bg-[#f8f3ee]"><LogOut size={17} /> Cerrar sesión</button></div>
    </aside>
    {open && <button aria-label="Cerrar menú" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/20 lg:hidden" />}
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#e9e1db] bg-[#f7f4ef]/90 px-5 backdrop-blur sm:px-8"><div className="flex items-center gap-3"><button onClick={() => setOpen(true)} aria-label="Abrir menú" className="grid h-10 w-10 place-items-center rounded-lg text-[#6d5d57] hover:bg-white lg:hidden"><Menu size={19} /></button><p className="text-sm font-medium text-[#685954]">{navigation.find((item) => item.href === pathname)?.label ?? "Administración"}</p></div><div className="flex items-center gap-2 text-xs text-[#8f7f78]"><span className="h-2 w-2 rounded-full bg-[#8b9e7a]" /> Sesión protegida</div></header>
      <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-10">{children}</main>
    </div>
  </div>;
}

function HeartIcon() {
  return <span aria-hidden="true" className="text-lg">♡</span>;
}
