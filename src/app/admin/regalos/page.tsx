import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { GiftManager } from "@/components/admin/gift-manager";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = { title: "Regalos" };

export default async function Page() {
  if (!await requireAdmin()) redirect("/admin/login");
  return <AdminShell><GiftManager /></AdminShell>;
}
