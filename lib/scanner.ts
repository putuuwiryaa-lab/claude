export function parseHistory(historyData: string): string[] {
  return historyData.trim().split(/\s+/).filter((item) => /^\d{4}$/.test(item));
}

const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const positions = ["as", "kop", "kepala", "ekor"] as const;
type Position = (typeof positions)[number];

type WeightSet = {
  name: string;
  position: number;
  global: number;
  recent: number;
  gap: number;
  momentum: number;
};

const FIXED_LIMIT = 169;
const TEST_SIZE = 14;
const TRAIN_SIZE = FIXED_LIMIT - TEST_SIZE;
const indexMap: Record<Position, number> = { as: 0, kop: 1, kepala: 2, ekor: 3 };

const candidateWeights: WeightSet[] = [
  { name: "Balanced A", position: 0.4, global: 0.15, recent: 0.2, gap: 0.1, momentum: 0.15 },
  { name: "Balanced B", position: 0.35, global: 0.15, recent: 0.25, gap: 0.1, momentum: 0.15 },
  { name: "Position Strong", position: 0.5, global: 0.15, recent: 0.15, gap: 0.05, momentum: 0.15 },
  { name: "Position Safe", position: 0.45, global: 0.2, recent: 0.15, gap: 0.05, momentum: 0.15 },
  { name: "Recent Strong", position: 0.3, global: 0.1, recent: 0.35, gap: 0.1, momentum: 0.15 },
  { name: "Recent Momentum", position: 0.25, global: 0.1, recent: 0.35, gap: 0.05, momentum: 0.25 },
  { name: "Momentum Strong", position: 0.3, global: 0.1, recent: 0.2, gap: 0.1, momentum: 0.3 },
  { name: "Gap Support", position: 0.35, global: 0.1, recent: 0.2, gap: 0.2, momentum: 0.15 },
  { name: "Global Support", position: 0.35, global: 0.25, recent: 0.2, gap: 0.05, momentum: 0.15 },
  { name: "Lean Recent", position: 0.35, global: 0.1, recent: 0.3, gap: 0.05, momentum: 0.2 },
  { name: "Lean Stable", position: 0.45, global: 0.2, recent: 0.2, gap: 0.05, momentum: 0.1 },
  { name: "Equal Core", position: 0.3, global: 0.2, recent: 0.25, gap: 0.1, momentum: 0.15 }
];

function zero(): Record<string, number> {
  return Object.fromEntries(digits.map((digit) => [digit, 0]));
}

function maxValue(obj: Record<string, number>) {
  return Math.max(...Object.values(obj), 0);
}

function norm(value: number, max: number) {
  return max > 0 ? value / max : 0;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
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

  const length = results.length;
  results.forEach((result, index) => {
    const age = length - index;
    const weight = 1 / age;
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
      let gap = results.length;
      for (let index = results.length - 1; index >= 0; index -= 1) {
        if (results[index][indexMap[pos]] === digit) {
          gap = results.length - 1 - index;
          break;
        }
      }
      scores[pos][digit] = gap;
    }
  }

  return scores;
}

function momentumScores(results: string[]) {
  const short = results.slice(Math.max(0, results.length - 10));
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

function rankWithWeights(results: string[], weights: WeightSet) {
  const pc = positionCounts(results);
  const gc = globalCounts(results);
  const rs = recentScores(results);
  const gs = gapScores(results);
  const ms = momentumScores(results);
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
        norm(pc[pos][digit], maxPos) * weights.position +
        norm(gc[digit], maxGlobal) * weights.global +
        norm(rs[pos][digit], maxRecent) * weights.recent +
        norm(gs[pos][digit], maxGap) * weights.gap +
        norm(ms[pos][digit], maxMomentum) * weights.momentum;

      return { digit, score: round1(raw * 100), count: pc[pos][digit] };
    }).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.count !== a.count) return b.count - a.count;
      return Number(a.digit) - Number(b.digit);
    });
  }

  return scores;
}

function evaluateWeights(data: string[], weights: WeightSet) {
  const steps = Math.max(0, data.length - TRAIN_SIZE);
  let rankPoints = 0;
  let top3Hits = 0;
  let top5Hits = 0;
  const positionTop5: Record<Position, number> = { as: 0, kop: 0, kepala: 0, ekor: 0 };
  const blockScores = [0, 0, 0];
  const blockMax = [0, 0, 0];

  for (let targetIndex = TRAIN_SIZE; targetIndex < data.length; targetIndex += 1) {
    const train = data.slice(0, targetIndex);
    const target = data[targetIndex];
    const ranking = rankWithWeights(train, weights);
    const block = Math.min(2, Math.floor(((targetIndex - TRAIN_SIZE) * 3) / Math.max(1, steps)));

    for (const pos of positions) {
      const targetDigit = target[indexMap[pos]];
      const rankIndex = ranking[pos].findIndex((item) => item.digit === targetDigit);
      const points = rankIndex >= 0 ? 10 - rankIndex : 0;
      rankPoints += points;
      blockScores[block] += points;
      blockMax[block] += 10;
      if (rankIndex >= 0 && rankIndex < 3) top3Hits += 1;
      if (rankIndex >= 0 && rankIndex < 5) {
        top5Hits += 1;
        positionTop5[pos] += 1;
      }
    }
  }

  const maxRankPoints = Math.max(1, steps * positions.length * 10);
  const totalChecks = Math.max(1, steps * positions.length);
  const rankScore = (rankPoints / maxRankPoints) * 100;
  const top3Rate = (top3Hits / totalChecks) * 100;
  const top5Rate = (top5Hits / totalChecks) * 100;
  const blockRates = blockScores.map((score, index) => (blockMax[index] ? (score / blockMax[index]) * 100 : rankScore));
  const stability = Math.max(0, 100 - (Math.max(...blockRates) - Math.min(...blockRates)));
  const posRates = positions.map((pos) => (positionTop5[pos] / Math.max(1, steps)) * 100);
  const balance = Math.max(0, 100 - (Math.max(...posRates) - Math.min(...posRates)));
  const finalScore = rankScore * 0.4 + top3Rate * 0.25 + top5Rate * 0.2 + stability * 0.1 + balance * 0.05;

  return {
    method: weights.name,
    rank_score: round1(rankScore),
    top3_hit_rate: round1(top3Rate),
    top5_hit_rate: round1(top5Rate),
    stability: round1(stability),
    balance: round1(balance),
    final_score: round1(finalScore),
    position_top5: Object.fromEntries(positions.map((pos) => [pos, round1((positionTop5[pos] / Math.max(1, steps)) * 100)]))
  };
}

function formatWeights(weights: WeightSet) {
  return {
    method: weights.name,
    position_frequency: `${Math.round(weights.position * 100)}%`,
    global_frequency: `${Math.round(weights.global * 100)}%`,
    recency: `${Math.round(weights.recent * 100)}%`,
    gap_absen: `${Math.round(weights.gap * 100)}%`,
    momentum: `${Math.round(weights.momentum * 100)}%`
  };
}

export function scanPoltar4D(historyData: string) {
  const all = parseHistory(historyData);
  const fixedData = all.slice(-FIXED_LIMIT);
  const usableData = fixedData.length >= 30 ? fixedData : all;
  const evaluations = candidateWeights.map((weights) => ({ weights, test: evaluateWeights(usableData, weights) }));
  evaluations.sort((a, b) => b.test.final_score - a.test.final_score);
  const best = evaluations[0] || { weights: candidateWeights[0], test: evaluateWeights(usableData, candidateWeights[0]) };
  const scores = rankWithWeights(usableData, best.weights);

  return {
    engine: "Poltar Walk Forward Engine v2",
    total_data: all.length,
    sample_used: usableData.length,
    fixed_limit: FIXED_LIMIT,
    train_size: Math.min(TRAIN_SIZE, Math.max(0, usableData.length - TEST_SIZE)),
    test_size: Math.max(0, usableData.length - Math.min(TRAIN_SIZE, usableData.length)),
    latest_result: usableData[usableData.length - 1] || null,
    selected_method: best.test.method,
    selected_weights: formatWeights(best.weights),
    test_result: best.test,
    leaderboard: evaluations.slice(0, 5).map((item) => item.test),
    poltar: {
      as: scores.as.map((item) => item.digit).join(" "),
      kop: scores.kop.map((item) => item.digit).join(" "),
      kepala: scores.kepala.map((item) => item.digit).join(" "),
      ekor: scores.ekor.map((item) => item.digit).join(" ")
    },
    scores
  };
}
