import type { Market } from "./types";

export const SUPABASE_MARKETS_URL =
  process.env.SUPABASE_MARKETS_URL ||
  "https://ldeofmwxttdjcvylhabu.supabase.co/functions/v1/get-markets";

export async function getMarkets(): Promise<Market[]> {
  const res = await fetch(SUPABASE_MARKETS_URL, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Gagal mengambil data market: ${res.status}`);
  }

  const json = await res.json();

  if (Array.isArray(json)) return json as Market[];
  if (Array.isArray(json.data)) return json.data as Market[];
  if (Array.isArray(json.markets)) return json.markets as Market[];

  throw new Error("Format response market tidak dikenali");
}
