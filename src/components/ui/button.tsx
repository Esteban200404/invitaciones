import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost"; size?: "default" | "small" };

export function Button({ className, variant = "primary", size = "default", ...props }: ButtonProps) {
  return <button className={cn("inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-55", variant === "primary" && "bg-[#985d5a] text-white shadow-[0_8px_20px_rgba(152,93,90,.2)] hover:bg-[#824d4b]", variant === "secondary" && "border border-[#ddcfc6] bg-white/70 text-[#594947] hover:bg-white", variant === "ghost" && "text-[#735d58] hover:bg-[#f1e8e2]", size === "small" && "min-h-10 rounded-lg px-3 text-sm", className)} {...props} />;
}
