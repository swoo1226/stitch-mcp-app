import {
  IconSunny, IconPartlyCloudy, IconCloudy, IconRainy, IconStormy,
} from "../components/WeatherIcons";

export const NAV_ITEMS = [
  { label: "개인 현황", href: "/personal" },
  { label: "팀", href: "/dashboard" },
  { label: "Niko-Niko", href: "/niko" },
  { label: "우리 팀도 써보기", href: "/request-access" },
  { label: "알림", href: "/alerts", disabled: true },
];

export const WEATHER_STATES = [
  {
    icon: IconStormy,
    status: "Stormy" as const,
    range: "0–20",
    desc: "뇌우 — 많이 지쳐 있어요. 즉각적인 관심과 체크인이 필요한 상태예요.",
    bg: "color-mix(in srgb, var(--weather-stormy-blob-2) 18%, var(--surface-elevated))",
    accent: "var(--weather-stormy-blob-2)",
  },
  {
    icon: IconRainy,
    status: "Rainy" as const,
    range: "21–40",
    desc: "비 — 오늘은 힘든 하루예요. 지지와 격려가 필요한 상태예요.",
    bg: "color-mix(in srgb, var(--weather-rainy-blob-2) 14%, var(--surface-elevated))",
    accent: "var(--weather-rainy-blob-2)",
  },
  {
    icon: IconCloudy,
    status: "Cloudy" as const,
    range: "41–60",
    desc: "흐림 — 에너지가 낮고 무거운 느낌이에요. 천천히 살펴봐 주세요.",
    bg: "color-mix(in srgb, var(--weather-cloudy-blob-2) 16%, var(--surface-elevated))",
    accent: "var(--weather-cloudy-blob-1)",
  },
  {
    icon: IconPartlyCloudy,
    status: "PartlyCloudy" as const,
    range: "61–80",
    desc: "구름조금 — 안정적이고 괜찮은 하루예요. 집중력도 잘 유지되고 있어요.",
    bg: "color-mix(in srgb, var(--weather-partlycloudy-blob-2) 14%, var(--surface-elevated))",
    accent: "var(--weather-partlycloudy-blob-1)",
  },
  {
    icon: IconSunny,
    status: "Sunny" as const,
    range: "81–100",
    desc: "맑음 — 에너지가 넘치는 하루예요. 팀 전체가 생산적이고 긍정적이에요.",
    bg: "color-mix(in srgb, var(--primary) 8%, var(--surface-elevated))",
    accent: "var(--primary)",
  },
];

export const HOW_IT_WORKS = [
  {
    num: "01",
    title: "팀원: 하루 10초, 오늘 컨디션 남기기",
    desc: "1~100 사이 점수 하나면 끝이에요. 코멘트를 남기면 더 솔직하게 전달돼요.",
  },
  {
    num: "02",
    title: "점수 → 날씨로 자동 변환",
    desc: "맑음·구름조금·흐림·비·뇌우. 숫자보다 날씨가 팀 분위기를 훨씬 빠르게 전달해요.",
  },
  {
    num: "03",
    title: "팀장: 패턴을 먼저 발견하기",
    desc: "Niko-Niko 캘린더와 주간 추이로 문제가 커지기 전에 선제적으로 다가갈 수 있어요.",
  },
];
