export function parseHistory(historyData: string): string[] {
  return historyData.trim().split(/\s+/).filter((item) => /^\d{4}$/.test(item));
}

const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const positions = ["as", "kop", "kepala", "ekor"] as const;
type Position = (typeof positions)[number];

type Mode = "aman" | "campuran" | "agresif";

const indexMap: Record<Position, number> = { as: 0, kop: 1, kepala: 2, ekor: 3 };

const weights = {
  aman: { position: 0.5, global: 0.2, recent: 0.15, gap: 0.05, momentum: 0.1 },
  campuran: { position: 0.4, global: 0.15, recent: 0.2, gap: 0.1, momentum: 0.15 },
  agresif: { position: 0.25, global: 0.1, recent: 0.35, gap: 0.1, momentum: 0.2 }
};

function zero(): Record<string, number> {
  return Object.fromEntries(digits.map((digit) => [digit, 0]));
}

function maxValue(obj: Record<string, number>) {
  return Math.max(...Object.values(obj), 0);
}

function norm(value: number, max: number) {
  return max > 0 ? value / max : 0;
}

function round(value: number) {
  return Math.round(value * 1000) / 10;
}

function positionCounts(results: string[]) {
  const counts: Record<Position, Record<string, number>> = {
    as: zero(),
    kop: zero(),
    kepala: zero(),
    ekor: zero()
  };

  for (const result of results) {
    for (const pos of positions) {
      counts[pos][result[indexMap[pos]]] += 1;
    }
  }

  return counts;
}

function globalCounts(results: string[]) {
  const counts = zero();
  for (const result of results) {
    for (const digit of result) counts[digit] += 1;
  }
  return counts;
}

function recentScores(results: string[]) {
  const scores: Record<Position, Record<string, number>> = {
    as: zero(),
    kop: zero(),
    kepala: zero(),
    ekor: zero()
  };

  results.forEach((result, index) => {
    const weight = 1 / (index + 1);
    for (const pos of positions) scores[pos][result[indexMap[pos]]] += weight;
  });

  return scores;
}

function gapScores(results: string[]) {
  const scores: Record<Position, Record<string, number>> = {
    as: zero(),
    kop: zero(),
    kepala: zero(),
    ekor: zero()
  };

  for (const pos of positions) {
    for (const digit of digits) {
      const found = results.findIndex((result) => result[indexMap[pos]] === digit);
      scores[pos][digit] = found === -1 ? results.length : found;
    }
  }

  return scores;
}

function momentumScores(results: string[]) {
  const short = results.slice(0, Math.min(10, results.length));
  const shortCounts = positionCounts(short);
  const longCounts = positionCounts(results);
  const scores: Record<Position, Record<string, number>> = {
    as: zero(),
    kop: zero(),
    kepala: zero(),
    ekor: zero()
  };

  for (const pos of positions) {
    for (const digit of digits) {
      const shortRate = short.length ? shortCounts[pos][digit] / short.length : 0;
      const longRate = results.length ? longCounts[pos][digit] / results.length : 0;
      scores[pos][digit] = Math.max(0, shortRate - longRate);
    }
  }

  return scores;
}

export function scanPoltar4D(historyData: string, limit = 50, mode: Mode = "campuran") {
  const all = parseHistory(historyData);
  const sample = all.slice(0, Math.max(1, Math.min(limit, all.length || limit)));
  const pc = positionCounts(sample);
  const gc = globalCounts(sample);
  const rs = recentScores(sample);
  const gs = gapScores(sample);
  const ms = momentumScores(sample);
  const w = weights[mode] || weights.campuran;
  const maxGlobal = maxValue(gc);

  const scores: Record<Position, Array<{ digit: string; score: number; count: number }>> = {
    as: [],
    kop: [],
    kepala: [],
    ekor: []
  };

  for (const pos of positions) {
    const maxPos = maxValue(pc[pos]);
    const maxRecent = maxValue(rs[pos]);
    const maxGap = maxValue(gs[pos]);
    const maxMomentum = maxValue(ms[pos]);

    scores[pos] = digits.map((digit) => {
      const raw =
        norm(pc[pos][digit], maxPos) * w.position +
        norm(gc[digit], maxGlobal) * w.global +
        norm(rs[pos][digit], maxRecent) * w.recent +
        norm(gs[pos][digit], maxGap) * w.gap +
        norm(ms[pos][digit], maxMomentum) * w.momentum;

      return { digit, score: round(raw), count: pc[pos][digit] };
    }).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.count !== a.count) return b.count - a.count;
      return Number(a.digit) - Number(b.digit);
    });
  }

  return {
    engine: "Poltar 4D Engine v1",
    mode,
    total_data: all.length,
    sample_used: sample.length,
    latest_result: all[0] || null,
    poltar: {
      as: scores.as.map((item) => item.digit).join(" "),
      kop: scores.kop.map((item) => item.digit).join(" "),
      kepala: scores.kepala.map((item) => item.digit).join(" "),
      ekor: scores.ekor.map((item) => item.digit).join(" ")
    },
    scores,
    weights: w
  };
}
