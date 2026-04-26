"use client";

import { useEffect, useState } from "react";
import { PoltarRow } from "@/components/PoltarRow";

type Market = { id: string; name: string; total_history: number };
type Scan = {
  market: { name: string };
  scan: {
    mode: string;
    total_data: number;
    sample_used: number;
    latest_result: string | null;
    poltar: { as: string; kop: string; kepala: string; ekor: string };
    scores: Record<string, Array<{ digit: string; score: number }>>;
  };
};

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [market, setMarket] = useState("SINGAPORE");
  const [limit, setLimit] = useState(50);
  const [mode, setMode] = useState("campuran");
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
      const params = new URLSearchParams({ market: nextMarket, limit: String(limit), mode });
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
          <h1 className="text-4xl font-black">Poltar 4D Engine</h1>
          <p className="mt-3 text-slate-300">Output AS, KOP, KEPALA, EKOR berisi angka 0-9 lengkap dari terkuat ke terlemah.</p>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <select value={market} onChange={(e) => setMarket(e.target.value)} className="rounded-xl bg-slate-900 p-3">
              {markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="rounded-xl bg-slate-900 p-3">
              {[30, 50, 100, 150, 200].map((n) => <option key={n} value={n}>{n} data</option>)}
            </select>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="rounded-xl bg-slate-900 p-3">
              <option value="aman">Aman</option>
              <option value="campuran">Campuran</option>
              <option value="agresif">Agresif</option>
            </select>
            <button onClick={() => runScan()} disabled={loading} className="rounded-xl bg-cyan-400 p-3 font-black text-slate-950 disabled:opacity-50">
              {loading ? "Scanning..." : "Scan Poltar 4D"}
            </button>
          </div>
        </section>

        {error && <div className="mb-6 rounded-2xl bg-red-500/20 p-4 text-red-100">{error}</div>}

        {scan && (
          <>
            <section className="mb-6 grid gap-3 md:grid-cols-4">
              <Card label="Market" value={scan.market.name} />
              <Card label="Latest" value={scan.scan.latest_result || "-"} />
              <Card label="Sample" value={`${scan.scan.sample_used}/${scan.scan.total_data}`} />
              <Card label="Mode" value={scan.scan.mode.toUpperCase()} />
            </section>
            <section className="grid gap-4">
              <PoltarRow label="AS" value={scan.scan.poltar.as} />
              <PoltarRow label="KOP" value={scan.scan.poltar.kop} />
              <PoltarRow label="KEPALA" value={scan.scan.poltar.kepala} />
              <PoltarRow label="EKOR" value={scan.scan.poltar.ekor} />
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
