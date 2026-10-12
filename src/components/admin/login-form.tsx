"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LockKeyhole, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No se pudo iniciar sesión.");
      router.replace("/admin");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ha ocurrido un problema. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_22%,#fffdf9,#f4ebe4_75%)] px-5 py-12">
    <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-[#efd9d2]/45 blur-3xl" />
    <div className="surface relative w-full max-w-md rounded-[28px] p-7 sm:p-10">
      <a href="/" className="inline-flex items-center gap-2 text-xs text-[#806d66] hover:text-[#513f3b]"><ArrowLeft size={15} /> Volver a la invitación</a>
      <span className="mx-auto mt-7 grid h-12 w-12 place-items-center rounded-full bg-[#f2e4dd] text-[#a87770]"><LockKeyhole size={20} /></span>
      <h1 className="serif mt-5 text-center text-4xl text-[#493a37]">Acceso privado</h1>
      <p className="mt-2 text-center text-sm leading-6 text-[#847771]">Ingresa con la cuenta autorizada para administrar el evento.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <div><label htmlFor="email" className="label">Correo electrónico</label><input id="email" className="field" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
        <div><label htmlFor="password" className="label">Contraseña</label><input id="password" className="field" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} /></div>
        {error && <p role="alert" className="text-sm text-[#a64d4a]">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>{loading ? <><LoaderCircle className="animate-spin" size={16} /> Validando…</> : "Ingresar"}</Button>
      </form>
      <p className="mt-6 text-center text-[11px] text-[#9a8c85]">El acceso está protegido y reservado al administrador del evento.</p>
    </div>
  </main>;
}
