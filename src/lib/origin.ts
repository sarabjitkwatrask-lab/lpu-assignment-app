import { headers } from "next/headers";

// The public address of the site for the current request (used to build email links).
export async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return h.get("origin") ?? `${proto}://${host}`;
}
