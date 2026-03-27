export type WeatherStatus = "Radiant" | "Sunny" | "Foggy" | "Rainy" | "Stormy";

export function scoreToStatus(score: number): WeatherStatus {
  if (score >= 80) return "Radiant";
  if (score >= 60) return "Sunny";
  if (score >= 40) return "Foggy";
  if (score >= 20) return "Rainy";
  return "Stormy";
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
