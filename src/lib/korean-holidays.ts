const DEFAULT_KR_HOLIDAYS = [
  "2026-01-01",
  "2026-02-16",
  "2026-02-17",
  "2026-02-18",
  "2026-03-01",
  "2026-05-05",
  "2026-05-24",
  "2026-05-25",
  "2026-06-06",
  "2026-08-15",
  "2026-09-24",
  "2026-09-25",
  "2026-09-26",
  "2026-10-03",
  "2026-10-09",
  "2026-12-25",
] as const;

export function toKoreanIsoDate(date: Date) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

function normalize(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

export function getKoreanHolidaySet() {
  const envHolidays = process.env.KR_HOLIDAYS
    ? normalize(process.env.KR_HOLIDAYS.split(","))
    : [];

  return new Set<string>([
    ...DEFAULT_KR_HOLIDAYS,
    ...envHolidays,
  ]);
}

export function getKoreanBusinessDaySkipReason(date = new Date()) {
  const seoul = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const weekday = seoul.getDay();
  if (weekday === 0 || weekday === 6) {
    return "weekend";
  }

  if (getKoreanHolidaySet().has(toKoreanIsoDate(date))) {
    return "holiday";
  }

  return null;
}
