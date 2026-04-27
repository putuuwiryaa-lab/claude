"use client";

import { useEffect, useState } from "react";
import { PoltarRow } from "@/components/PoltarRow";

type Market = { id: string; name: string; total_history: number };
type Pos = "as" | "kop" | "kepala" | "ekor";
type TestResult = {
  position: Pos;
  method: string;
  rank_score: number;
  top3_hit_rate: number;
  top5_hit_rate: number;
  stability: number;
  final_score: number;
};
type PositionMethod = {
  weights: Record<string, string>;
  test: TestResult;
  leaderboard: TestResult[];
};
type Scan = {
  market: { name: string };
  scan: {
    engine: string;
    total_data: number;
    sample_used: number;
    fixed_limit: number;
    train_size: number;
    test_size: number;
    latest_result: string | null;
    position_methods: Record<Pos, PositionMethod>;
    poltar: Record<Pos, string>;
  };
};

const labels: Array<{ key: Pos; title: string }> = [
  { key: "as", title: "AS" },
  { key: "kop", title: "KOP" },
  { key: "kepala", title: "KEPALA" },
  { key: "ekor", title: "EKOR" }
];

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [market, setMarket] = useState("SINGAPORE");
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadMarkets() {
    const res = await fetch("/api/markets");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal ambil market");
    setMarkets(json.markets || []);
    if (json.markets?.length) setMarket(json.markets[0].id);
  }

  async function runScan(nextMarket = market) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ market: nextMarket });
      const res = await fetch(`/api/scan?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal scan");
      setScan(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal scan");
      setScan(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMarkets().then(() => runScan("SINGAPORE")).catch((err) => setError(err.message));
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <section className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">Angkanet Scanner</p>
          <h1 className="text-4xl font-black">Poltar Walk Forward Engine v3</h1>
          <p className="mt-3 text-slate-300">AS, KOP, KEPALA, dan EKOR dioptimasi independen. Tiap posisi memilih metode dan bobot sendiri dari walk-forward test 14 data terbaru.</p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <select value={market} onChange={(e) => setMarket(e.target.value)} className="rounded-xl bg-slate-900 p-3">
              {markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <button onClick={() => runScan()} disabled={loading} className="rounded-xl bg-cyan-400 p-3 font-black text-slate-950 disabled:opacity-50">
              {loading ? "Training..." : "Train & Scan"}
            </button>
          </div>
        </section>

        {error && <div className="mb-6 rounded-2xl bg-red-500/20 p-4 text-red-100">{error}</div>}

        {scan && (
          <>
            <section className="mb-6 grid gap-3 md:grid-cols-5">
              <Card label="Market" value={scan.market.name} />
              <Card label="Latest" value={scan.scan.latest_result || "-"} />
              <Card label="Data Fix" value={`${scan.scan.fixed_limit}`} />
              <Card label="Train" value={`${scan.scan.train_size}`} />
              <Card label="Test" value={`${scan.scan.test_size}`} />
            </section>

            <section className="grid gap-4">
              {labels.map((item) => <PoltarRow key={item.key} label={item.title} value={scan.scan.poltar[item.key]} />)}
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-2">
              {labels.map((item) => {
                const method = scan.scan.position_methods[item.key];
                return (
                  <div key={item.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <h2 className="mb-3 text-xl font-black">{item.title}: {method.weights.method}</h2>
                    <div className="grid gap-3 sm:grid-cols-5">
                      <Small label="Posisi" value={method.weights.position_frequency} />
                      <Small label="Global" value={method.weights.global_frequency} />
                      <Small label="Recency" value={method.weights.recency} />
                      <Small label="Absen" value={method.weights.gap_absen} />
                      <Small label="Momentum" value={method.weights.momentum} />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-5">
                      <Small label="Final" value={`${method.test.final_score}%`} />
                      <Small label="Rank" value={`${method.test.rank_score}%`} />
                      <Small label="Top3" value={`${method.test.top3_hit_rate}%`} />
                      <Small label="Top5" value={`${method.test.top5_hit_rate}%`} />
                      <Small label="Stable" value={`${method.test.stability}%`} />
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs uppercase text-slate-400">{label}</div><div className="mt-2 text-xl font-black">{value}</div></div>;
}

function Small({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-900 p-3"><div className="text-[10px] uppercase text-slate-400">{label}</div><div className="mt-1 font-black">{value}</div></div>;
}
