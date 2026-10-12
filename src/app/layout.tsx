import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  await headers();
  let eventName = "Baby Shower";
  let description = "Una invitación muy especial para celebrar la llegada de nuestro bebé.";
  try {
    const { data } = await getSupabaseAdmin().from("events").select("name,description,baby_name").limit(1).maybeSingle();
    if (data) {
      eventName = data.name;
      description = data.description || `Nos encantaría celebrar contigo la llegada de ${data.baby_name || "nuestro bebé"}.`;
    }
  } catch {
    return { title: { default: "Un día para celebrar | Baby Shower", template: "%s | Baby Shower" }, description, applicationName: "Baby Shower" };
  }
  return {
    title: { default: `${eventName} | Invitación`, template: `%s | ${eventName}` },
    description,
    openGraph: { title: `${eventName} | Invitación`, description, type: "website", locale: "es_CO" },
    applicationName: eventName,
  };
}

export const viewport: Viewport = {
  themeColor: "#f8f3ed",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
