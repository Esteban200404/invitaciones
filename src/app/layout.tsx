import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
const metadataBase = new URL(siteUrl);
const socialImage = new URL("/baby-bear-cloud.png", metadataBase).toString();

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
    eventName = "Baby Shower";
  }
  const title = `${eventName} | Invitación`;
  return {
    metadataBase,
    title: { default: title, template: `%s | ${eventName}` },
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "es_CO",
      images: [{ url: socialImage, width: 712, height: 712, alt: "Osito bebé dormido sobre una nube" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [socialImage] },
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
