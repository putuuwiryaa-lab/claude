export function parseHistory(historyData: string): string[] {
  return historyData.trim().split(/\s+/).filter((item) => /^\d{4}$/.test(item));
}

const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const positions = ["as", "kop", "kepala", "ekor"] as const;
type Position = (typeof positions)[number];

const FIXED_LIMIT = 169;
const TEST_SIZE = 14;
const TRAIN_SIZE = FIXED_LIMIT - TEST_SIZE;
const indexMap: Record<Position, number> = { as: 0, kop: 1, kepala: 2, ekor: 3 };

const sourceLabels: Record<Position, string> = {
  as: "AS",
  kop: "KOP",
  kepala: "KPL",
  ekor: "EKR"
};

type SourceCounts = Record<Position, number>;
type RankItem = {
  digit: string;
  score: number;
  count: number;
  sources: SourceCounts;
};

type TestResult = {
  position: Position;
  method: string;
  rank_score: number;
  top3_hit_rate: number;
  top5_hit_rate: number;
  stability: number;
  final_score: number;
};

function zero(): Record<string, number> {
  return Object.fromEntries(digits.map((digit) => [digit, 0]));
}

function zeroSources(): SourceCounts {
  return { as: 0, kop: 0, kepala: 0, ekor: 0 };
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function emptyRanking(): RankItem[] {
  return digits.map((digit) => ({
    digit,
    score: 0,
    count: 0,
    sources: zeroSources()
  }));
}

function rankCrossPositionMarkov(results: string[], targetPos: Position): RankItem[] {
  if (results.length < 2) return emptyRanking();

  const last = results[results.length - 1];
  const targetIndex = indexMap[targetPos];

  const map: Record<string, RankItem> = Object.fromEntries(
    digits.map((digit) => [
      digit,
      {
        digit,
        score: 0,
        count: 0,
        sources: zeroSources()
      }
    ])
  );

  for (const sourcePos of positions) {
    const sourceIndex = indexMap[sourcePos];
    const sourceDigit = last[sourceIndex];
    const transitionCount = zero();
    let totalTransition = 0;

    for (let i = 0; i < results.length - 1; i += 1) {
      const previous = results[i];
      const next = results[i + 1];

      if (previous[sourceIndex] !== sourceDigit) continue;

      const nextTargetDigit = next[targetIndex];
      transitionCount[nextTargetDigit] += 1;
      totalTransition += 1;
    }

    if (totalTransition === 0) continue;

    // Confidence menahan transisi yang sampelnya terlalu kecil agar tidak langsung mendominasi.
    const sourceConfidence = totalTransition / (totalTransition + 3);

    for (const digit of digits) {
      const count = transitionCount[digit];
      const probability = count / totalTransition;
      const sourceScore = probability * sourceConfidence;

      map[digit].score += sourceScore;
      map[digit].count += count;
      map[digit].sources[sourcePos] = count;
    }
  }

  return Object.values(map)
    .map((item) => ({
      ...item,
      score: round1((item.score / positions.length) * 100)
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.count !== a.count) return b.count - a.count;
      if (b.sources[targetPos] !== a.sources[targetPos]) return b.sources[targetPos] - a.sources[targetPos];
      return Number(a.digit) - Number(b.digit);
    });
}

function evaluateCrossPositionMarkov(data: string[], pos: Position): TestResult {
  const start = Math.min(TRAIN_SIZE, Math.max(1, data.length - TEST_SIZE));
  const steps = Math.max(0, data.length - start);
  let rankPoints = 0;
  let top3Hits = 0;
  let top5Hits = 0;
  const blockScores = [0, 0, 0];
  const blockMax = [0, 0, 0];

  for (let targetIndex = start; targetIndex < data.length; targetIndex += 1) {
    const train = data.slice(0, targetIndex);
    const targetDigit = data[targetIndex][indexMap[pos]];
    const ranking = rankCrossPositionMarkov(train, pos);
    const rankIndex = ranking.findIndex((item) => item.digit === targetDigit);
    const points = rankIndex >= 0 ? Math.max(0, 10 - rankIndex) : 0;
    const block = Math.min(2, Math.floor(((targetIndex - start) * 3) / Math.max(1, steps)));

    rankPoints += points;
    blockScores[block] += points;
    blockMax[block] += 10;
    if (rankIndex >= 0 && rankIndex < 3) top3Hits += 1;
    if (rankIndex >= 0 && rankIndex < 5) top5Hits += 1;
  }

  const maxRankPoints = Math.max(1, steps * 10);
  const rankScore = (rankPoints / maxRankPoints) * 100;
  const top3Rate = (top3Hits / Math.max(1, steps)) * 100;
  const top5Rate = (top5Hits / Math.max(1, steps)) * 100;
  const blockRates = blockScores.map((score, index) => (blockMax[index] ? (score / blockMax[index]) * 100 : rankScore));
  const stability = Math.max(0, 100 - (Math.max(...blockRates) - Math.min(...blockRates)));
  const finalScore = rankScore * 0.5 + top3Rate * 0.25 + top5Rate * 0.2 + stability * 0.05;

  return {
    position: pos,
    method: "Cross Position Markov",
    rank_score: round1(rankScore),
    top3_hit_rate: round1(top3Rate),
    top5_hit_rate: round1(top5Rate),
    stability: round1(stability),
    final_score: round1(finalScore)
  };
}

function formatMarkovWeights() {
  return {
    method: "Cross Position Markov",
    position_frequency: "0%",
    recency: "0%",
    transition_markov: "100%",
    delta_pattern: "0%",
    cycle_due: "0%"
  };
}

function explainSources(item: RankItem) {
  return positions.map((pos) => `${sourceLabels[pos]}:${item.sources[pos]}`).join(" ");
}

export function scanPoltar4D(historyData: string) {
  const all = parseHistory(historyData);
  const fixedData = all.slice(-FIXED_LIMIT);
  const usableData = fixedData.length >= 30 ? fixedData : all;

  const positionMethods: Record<Position, { weights: ReturnType<typeof formatMarkovWeights>; test: TestResult; leaderboard: TestResult[] }> = {
    as: {} as any,
    kop: {} as any,
    kepala: {} as any,
    ekor: {} as any
  };
  const poltar: Record<Position, string> = { as: "", kop: "", kepala: "", ekor: "" };
  const scores: Record<Position, RankItem[]> = { as: [], kop: [], kepala: [], ekor: [] };
  const source_summary: Record<Position, string[]> = { as: [], kop: [], kepala: [], ekor: [] };

  for (const pos of positions) {
    const test = evaluateCrossPositionMarkov(usableData, pos);
    const ranking = rankCrossPositionMarkov(usableData, pos);

    positionMethods[pos] = {
      weights: formatMarkovWeights(),
      test,
      leaderboard: [test]
    };
    scores[pos] = ranking;
    poltar[pos] = ranking.map((item) => item.digit).join(" ");
    source_summary[pos] = ranking.slice(0, 10).map((item) => `${item.digit} = ${item.score}% | ${explainSources(item)}`);
  }

  return {
    engine: "Pure Cross Position Markov Scanner",
    total_data: all.length,
    sample_used: usableData.length,
    fixed_limit: FIXED_LIMIT,
    train_size: Math.min(TRAIN_SIZE, Math.max(0, usableData.length - TEST_SIZE)),
    test_size: Math.max(0, usableData.length - Math.min(TRAIN_SIZE, usableData.length)),
    latest_result: usableData[usableData.length - 1] || null,
    position_methods: positionMethods,
    poltar,
    scores,
    source_summary
  };
}
