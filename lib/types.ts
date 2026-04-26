export type Market = {
  id: string;
  name: string;
  history_data: string;
  order?: number;
  updated_at?: string;
};

export type EngineMode = "aman" | "campuran" | "agresif";

export type DigitScore = {
  digit: string;
  score: number;
  count: number;
  parts: {
    positionFrequency: number;
    globalFrequency: number;
    recency: number;
    gap: number;
    momentum: number;
    pairSupport: number;
  };
};

export type PositionKey = "as" | "kop" | "kepala" | "ekor";
