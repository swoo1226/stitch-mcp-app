export type WeatherStatus = "Radiant" | "Sunny" | "Foggy" | "Rainy" | "Stormy";

export const STATUS_KO: Record<WeatherStatus, string> = {
  Radiant: "쨍함",
  Sunny:   "맑음",
  Foggy:   "안개",
  Rainy:   "비",
  Stormy:  "번개",
};

export function statusToKo(status: WeatherStatus | null | undefined): string {
  if (!status) return "—";
  return STATUS_KO[status] ?? status;
}

export function scoreToStatus(score: number): WeatherStatus {
  if (score >= 81) return "Radiant";
  if (score >= 61) return "Sunny";
  if (score >= 41) return "Foggy";
  if (score >= 21) return "Rainy";
  return "Stormy";
}

export function statusToFallbackComment(status: WeatherStatus | null | undefined): string {
  const map: Record<WeatherStatus, string> = {
    Radiant: "에너지가 넘치는 하루예요!",
    Sunny:   "집중력 좋고 활기찬 하루예요.",
    Foggy:   "조금 흐릿하고 처진 느낌이에요.",
    Rainy:   "오늘은 많이 힘든 것 같아요.",
    Stormy:  "많이 지치고 힘든 상태예요.",
  };
  return (status && map[status]) ?? "오늘 기분을 기록하지 않았어요.";
}

export function statusToEmoji(status: WeatherStatus | null | undefined): string {
  const map: Record<WeatherStatus, string> = {
    Radiant: "✨",
    Sunny: "☀️",
    Foggy: "🌫️",
    Rainy: "🌧️",
    Stormy: "⛈️",
  };
  return (status && map[status]) ?? "☁️";
}
