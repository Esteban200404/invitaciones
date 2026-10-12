import "server-only";

const requiredEnvironment = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SESSION_SECRET",
  "ADMIN_EMAIL",
] as const;

export function getMissingRequiredEnvironment() {
  return requiredEnvironment.filter((name) => !process.env[name]?.trim());
}
