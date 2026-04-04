// 날씨 단계: 뇌우(최악) → 비 → 흐림 → 구름조금 → 맑음(최선)
export type WeatherStatus = "Stormy" | "Rainy" | "Cloudy" | "PartlyCloudy" | "Sunny";

export const STATUS_KO: Record<WeatherStatus, string> = {
  Stormy:       "뇌우",
  Rainy:        "비",
  Cloudy:       "흐림",
  PartlyCloudy: "구름조금",
  Sunny:        "맑음",
};

export function statusToKo(status: WeatherStatus | null | undefined): string {
  if (!status) return "—";
  return STATUS_KO[status] ?? status;
}

export function scoreToStatus(score: number): WeatherStatus {
  if (score >= 81) return "Sunny";
  if (score >= 61) return "PartlyCloudy";
  if (score >= 41) return "Cloudy";
  if (score >= 21) return "Rainy";
  return "Stormy";
}

export function statusToFallbackComment(status: WeatherStatus | null | undefined): string {
  const map: Record<WeatherStatus, string> = {
    Sunny:        "에너지가 넘치는 하루예요!",
    PartlyCloudy: "집중력 좋고 안정적인 하루예요.",
    Cloudy:       "조금 흐릿하고 처진 느낌이에요.",
    Rainy:        "오늘은 많이 힘든 것 같아요.",
    Stormy:       "많이 지치고 힘든 상태예요.",
  };
  return (status && map[status]) ?? "오늘 기분을 기록하지 않았어요.";
}

export type WarningReason = "low_score" | "sharp_drop" | "consecutive_drop";

export function checkWarning(scores: Array<number | null>, i: number): WarningReason | null {
  const score = scores[i];
  if (score === null) return null;
  if (score <= 40) return "low_score";
  const prev = scores[i - 1];
  if (prev !== null && prev !== undefined && prev - score >= 20) return "sharp_drop";
  if (i >= 2) {
    const prev2 = scores[i - 2];
    if (prev !== null && prev !== undefined && prev2 !== null && prev2 !== undefined && score < prev && prev < prev2) return "consecutive_drop";
  }
  return null;
}

export const WARNING_REASON_KO: Record<WarningReason, string> = {
  low_score:        "점수 40 이하",
  sharp_drop:       "하루 20pt 이상 하락",
  consecutive_drop: "연속 하락",
};

export function statusToEmoji(status: WeatherStatus | null | undefined): string {
  const map: Record<WeatherStatus, string> = {
    Sunny:        "☀️",
    PartlyCloudy: "⛅",
    Cloudy:       "☁️",
    Rainy:        "🌧️",
    Stormy:       "⛈️",
  };
  return (status && map[status]) ?? "☁️";
}
