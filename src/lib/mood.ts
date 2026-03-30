export type WeatherStatus = "Radiant" | "Sunny" | "Cloudy" | "Foggy" | "Rainy" | "Stormy";

export const STATUS_KO: Record<WeatherStatus, string> = {
  Radiant: "쨍함",
  Sunny:   "맑음",
  Cloudy:  "구름",
  Foggy:   "안개",
  Rainy:   "비",
  Stormy:  "번개",
};

export function statusToKo(status: WeatherStatus | null | undefined): string {
  if (!status) return "—";
  return STATUS_KO[status] ?? status;
}

export function scoreToStatus(score: number): WeatherStatus {
  if (score >= 91) return "Radiant";
  if (score >= 71) return "Sunny";
  if (score >= 41) return "Cloudy";
  if (score >= 21) return "Foggy";
  if (score >= 6)  return "Rainy";
  return "Stormy";
}

export function statusToEmoji(status: WeatherStatus | null | undefined): string {
  const map: Record<WeatherStatus, string> = {
    Radiant: "✨",
    Sunny: "☀️",
    Cloudy: "☁️",
    Foggy: "🌫️",
    Rainy: "🌧️",
    Stormy: "⛈️",
  };
  return (status && map[status]) ?? "☁️";
}
