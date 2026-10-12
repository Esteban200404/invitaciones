export type RSVPStatus = "PENDING" | "CONFIRMED" | "DECLINED";
export type GiftStatus = "AVAILABLE" | "RESERVED";

export interface EventRecord {
  id: string;
  slug: string;
  name: string;
  baby_name: string | null;
  description: string | null;
  event_date: string;
  event_time: string;
  timezone: string;
  location: string | null;
  address: string | null;
  extra_info: string | null;
  parents_message: string | null;
  accent_colors: Record<string, string>;
  cover_image_url: string | null;
}

export interface GuestRecord {
  id: string;
  event_id: string;
  name: string;
  invitation_code: string;
  is_active: boolean;
  rsvp_status: RSVPStatus;
  companions: number;
}

export interface GiftRecord {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  status: GiftStatus;
  is_active: boolean;
}
