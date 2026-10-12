import { z } from "zod";

export const inviteCodeSchema = z.object({ code: z.string().trim().min(4).max(16).regex(/^[a-zA-Z0-9-]+$/) });
export const rsvpSchema = z.object({ status: z.enum(["CONFIRMED", "DECLINED"]), companions: z.number().int().min(0).max(10).default(0) });
export const reservationSchema = z.object({ giftId: z.string().uuid() });
export const guestInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  invitation_code: z.string().trim().min(4).max(16).regex(/^[a-zA-Z0-9-]+$/).optional(),
  is_active: z.boolean().default(true),
  rsvp_status: z.enum(["PENDING", "CONFIRMED", "DECLINED"]).default("PENDING"),
  companions: z.number().int().min(0).max(10).default(0),
});
export const giftInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  image_url: z.string().url().or(z.literal("")).default(""),
  is_active: z.boolean().default(true),
});
export const eventInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  baby_name: z.string().trim().max(120).default(""),
  description: z.string().trim().max(1000).default(""),
  event_date: z.string().date(),
  event_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  timezone: z.string().min(1).max(80).default("America/Bogota").refine((timezone) => { try { new Intl.DateTimeFormat("es", { timeZone: timezone }); return true; } catch { return false; } }),
  location: z.string().trim().max(200).default(""),
  address: z.string().trim().max(300).default(""),
  extra_info: z.string().trim().max(1000).default(""),
  parents_message: z.string().trim().max(1000).default(""),
  accent_colors: z.record(z.string(), z.string().regex(/^#[0-9a-fA-F]{6}$/)).default({}),
  cover_image_url: z.string().url().or(z.literal("")).default(""),
});
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });
