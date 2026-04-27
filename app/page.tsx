"use client";

import { useEffect, useState } from "react";
import { PoltarRow } from "@/components/PoltarRow";

type Market = { id: string; name: string; total_history: number };
type TestResult = {
  method: string;
  rank_score: number;
  top3_hit_rate: number;
  top5_hit_rate: number;
  stability: number;
  balance: number;
  final_score: number;
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
    selected_method: string;
    selected_weights: Record<string, string>;
    test_result: TestResult;
    leaderboard: TestResult[];
    poltar: { as: string; kop: string; kepala: string; ekor: string };
  };
};

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
          <h1 className="text-4xl font-black">Poltar Walk Forward Engine v2</h1>
          <p className="mt-3 text-slate-300">Data Supabase dibaca kiri ke kanan sebagai urutan waktu. Engine mengambil 169 data terakhir, train 155 data, lalu walk-forward test 14 data terbaru untuk memilih bobot terbaik.</p>

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

            <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="mb-3 text-lg font-black">Metode Terpilih: {scan.scan.selected_method}</h2>
              <div className="grid gap-3 md:grid-cols-5">
                <Card label="Posisi" value={scan.scan.selected_weights.position_frequency} />
                <Card label="Global" value={scan.scan.selected_weights.global_frequency} />
                <Card label="Recency" value={scan.scan.selected_weights.recency} />
                <Card label="Absen" value={scan.scan.selected_weights.gap_absen} />
                <Card label="Momentum" value={scan.scan.selected_weights.momentum} />
              </div>
            </section>

            <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="mb-3 text-lg font-black">Hasil Walk Forward Test</h2>
              <div className="grid gap-3 md:grid-cols-5">
                <Card label="Final" value={`${scan.scan.test_result.final_score}%`} />
                <Card label="Rank" value={`${scan.scan.test_result.rank_score}%`} />
                <Card label="Top 3" value={`${scan.scan.test_result.top3_hit_rate}%`} />
                <Card label="Top 5" value={`${scan.scan.test_result.top5_hit_rate}%`} />
                <Card label="Stability" value={`${scan.scan.test_result.stability}%`} />
              </div>
            </section>

            <section className="grid gap-4">
              <PoltarRow label="AS" value={scan.scan.poltar.as} />
              <PoltarRow label="KOP" value={scan.scan.poltar.kop} />
              <PoltarRow label="KEPALA" value={scan.scan.poltar.kepala} />
              <PoltarRow label="EKOR" value={scan.scan.poltar.ekor} />
            </section>

            <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="mb-3 text-lg font-black">Leaderboard Metode</h2>
              <div className="grid gap-2">
                {scan.scan.leaderboard.map((item, index) => (
                  <div key={item.method} className="grid grid-cols-2 gap-2 rounded-xl bg-slate-900 p-3 text-sm md:grid-cols-6">
                    <div className="font-bold">#{index + 1} {item.method}</div>
                    <div>Final: {item.final_score}%</div>
                    <div>Rank: {item.rank_score}%</div>
                    <div>Top3: {item.top3_hit_rate}%</div>
                    <div>Top5: {item.top5_hit_rate}%</div>
                    <div>Stability: {item.stability}%</div>
                  </div>
                ))}
              </div>
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
