import { getMarkets } from "@/lib/supabaseMarkets";
import { scanPoltar4D } from "@/lib/scanner";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const marketId = url.searchParams.get("market") || "SINGAPORE";

  const markets = await getMarkets();
  const market = markets.find((m) => m.id === marketId || m.name === marketId);

  if (!market) {
    return Response.json({ error: "Market tidak ditemukan" }, { status: 404 });
  }

  const scan = scanPoltar4D(market.history_data || "");

  return Response.json({
    market: {
      id: market.id,
      name: market.name,
      updated_at: market.updated_at ?? null
    },
    scan
  });
}
