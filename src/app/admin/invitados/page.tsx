import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { GuestManager } from "@/components/admin/guest-manager";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = { title: "Invitados" };

export default async function Page() {
  if (!await requireAdmin()) redirect("/admin/login");
  return <AdminShell><GuestManager /></AdminShell>;
}
