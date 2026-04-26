import { getMarkets } from "@/lib/supabaseMarkets";
import { scanPoltar4D } from "@/lib/scanner";
import type { EngineMode } from "@/lib/types";

const modes: EngineMode[] = ["aman", "campuran", "agresif"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const marketId = url.searchParams.get("market") || "SINGAPORE";
  const limit = Number(url.searchParams.get("limit") || 50);
  const modeText = url.searchParams.get("mode") as EngineMode | null;
  const mode = modeText && modes.includes(modeText) ? modeText : "campuran";

  const markets = await getMarkets();
  const market = markets.find((m) => m.id === marketId || m.name === marketId);

  if (!market) {
    return Response.json({ error: "Market tidak ditemukan" }, { status: 404 });
  }

  const scan = scanPoltar4D(market.history_data || "", limit, mode);

  return Response.json({
    market: {
      id: market.id,
      name: market.name,
      updated_at: market.updated_at ?? null
    },
    scan
  });
}
