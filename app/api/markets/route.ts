import { getMarkets } from "@/lib/supabaseMarkets";

export async function GET() {
  const markets = await getMarkets();
  const list = markets.map((m) => ({
    id: m.id,
    name: m.name,
    order: m.order ?? 999,
    updated_at: m.updated_at ?? null,
    total_history: m.history_data ? m.history_data.trim().split(/\s+/).length : 0
  }));

  list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  return Response.json({ markets: list });
}
