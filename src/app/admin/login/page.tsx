import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { requireAdmin } from "@/lib/auth/admin";
import { getMissingRequiredEnvironment } from "@/lib/configuration";

export const metadata: Metadata = { title: "Acceso privado" };

function ConfigurationNotice({ missing }: { missing: string[] }) {
  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(ellipse_at_50%_22%,#fffdf9,#f4ebe4_75%)] px-5 py-12">
    <section className="surface w-full max-w-lg rounded-[28px] p-7 sm:p-10" aria-labelledby="setup-title">
      <a href="/" className="text-xs text-[#806d66] underline underline-offset-4">Volver a la invitación</a>
      <p className="mt-7 text-[10px] font-semibold uppercase tracking-[.2em] text-[#a27b72]">Configuración inicial</p>
      <h1 id="setup-title" className="serif mt-2 text-4xl text-[#493a37]">Conecta tu proyecto</h1>
      <p className="mt-3 text-sm leading-6 text-[#847771]">El acceso de administración necesita Supabase y una cuenta administradora. Añade estas variables a <code className="rounded bg-[#f3ece6] px-1.5 py-0.5">.env.local</code> y reinicia el servidor:</p>
      <ul className="mt-4 space-y-2">{missing.map((name) => <li key={name}><code className="break-all rounded-lg bg-[#f3ece6] px-2.5 py-1.5 text-xs text-[#654f49]">{name}</code></li>)}</ul>
      <ol className="mt-5 list-inside list-decimal space-y-2 text-sm leading-6 text-[#766963]">
        <li>Copia <code>.env.example</code> como <code>.env.local</code> y completa los valores desde tu proyecto Supabase.</li>
        <li>Ejecuta la migración SQL incluida en <code>supabase/migrations</code>.</li>
        <li>Crea en Supabase Auth el usuario cuyo correo coincida con <code>ADMIN_EMAIL</code>.</li>
      </ol>
      <p className="mt-5 text-xs leading-5 text-[#8f8079]">No compartas la service role key. Consulta el README para ver todos los pasos.</p>
    </section>
  </main>;
}

export default async function Page() {
  const missing = getMissingRequiredEnvironment();
  if (missing.length) return <ConfigurationNotice missing={missing} />;
  if (await requireAdmin()) redirect("/admin");
  return <LoginForm />;
}
