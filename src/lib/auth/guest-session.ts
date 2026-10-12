import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "baby_guest_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function signature(value: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createGuestToken(guestId: string) {
  const payload = `${guestId}.${Math.floor(Date.now() / 1000) + SESSION_SECONDS}`;
  return `${payload}.${signature(payload)}`;
}

export function verifyGuestToken(token?: string) {
  if (!token) return null;
  const [guestId, expiryText, receivedSignature, ...rest] = token.split(".");
  if (!guestId || !expiryText || !receivedSignature || rest.length) return null;
  const expiry = Number(expiryText);
  if (!Number.isInteger(expiry) || expiry <= Math.floor(Date.now() / 1000)) return null;

  const expected = Buffer.from(signature(`${guestId}.${expiryText}`));
  const received = Buffer.from(receivedSignature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  return guestId;
}

export async function setGuestSession(guestId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createGuestToken(guestId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function getGuestSessionId() {
  const cookieStore = await cookies();
  return verifyGuestToken(cookieStore.get(COOKIE_NAME)?.value);
}

export async function clearGuestSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
