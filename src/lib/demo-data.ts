import { scoreToStatus, type WeatherStatus } from "./mood";

// ─── 더미 팀/유저 ID ─────────────────────────────────────────────────────────
export const DEMO_TEAM_ID = "demo";
export const DEMO_USER_ID = "demo";

// ─── 날짜 유틸 (demo 기준 오늘 = 현재 날짜) ──────────────────────────────────
function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// ─── 더미 멤버 원본 데이터 ────────────────────────────────────────────────────
const RAW_MEMBERS = [
  { id: "d1", name: "김상우", avatar: "🌟", part_id: "p1",
    scores: [82, 75, 88, null, 79] },
  { id: "d2", name: "이지연", avatar: "🌻", part_id: "p1",
    scores: [55, 60, null, 58, 63] },
  { id: "d3", name: "박민호", avatar: "⚡", part_id: "p2",
    scores: [30, null, 25, 35, 28] },
  { id: "d4", name: "최수아", avatar: "🌈", part_id: "p2",
    scores: [90, 85, 92, 88, null] },
  { id: "d5", name: "정다은", avatar: "🍀", part_id: "p3",
    scores: [65, 70, 68, null, 72] },
  { id: "d6", name: "한준서", avatar: "🌊", part_id: "p3",
    scores: [null, 42, 38, 45, 40] },
  { id: "d7", name: "윤서연", avatar: "🔥", part_id: "p1",
    scores: [78, 80, 76, 83, 77] },
] as const;

export const DEMO_PARTS = [
  { id: "p1", name: "프론트엔드" },
  { id: "p2", name: "백엔드" },
  { id: "p3", name: "디자인" },
];

// ─── Dashboard / Niko 용 멤버 데이터 생성 ────────────────────────────────────
export function getDemoMembers(weekOffset = 0) {
  const today = new Date();
  const baseMonday = getWeekStart(today);
  baseMonday.setDate(baseMonday.getDate() + weekOffset * 7);
  const weekDays = getWeekDays(baseMonday);
  const todayIso = isoDate(today);
  const todayIndex = weekDays.findIndex((d) => isoDate(d) === todayIso);

  return RAW_MEMBERS.map((m) => {
    const week = m.scores.map((score) => {
      if (score === null) return { status: null as WeatherStatus | null, score: null as number | null, message: null as string | null };
      return { status: scoreToStatus(score), score, message: null as string | null };
    });

    const todayScore = weekOffset === 0 && todayIndex >= 0 ? (week[todayIndex]?.score ?? null) : null;
    const todayEntry = week[todayIndex];
    const isToday = weekOffset === 0 && todayIndex >= 0 && todayEntry?.score !== null;

    return {
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      part_id: m.part_id,
      score: todayScore,
      status: todayScore !== null ? scoreToStatus(todayScore) : null,
      message: isToday ? "데모 데이터입니다." : "오늘 체크인이 아직 없어요.",
      week,
      todayScore,
    };
  });
}

// ─── Personal 용 유저 데이터 ─────────────────────────────────────────────────
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const DEMO_MOOD_LOGS = [
  { score: 82, message: "오늘은 집중도 잘 되고 에너지가 넘쳐요!", logged_at: daysAgo(0) },
  { score: 68, message: "무난한 하루였어요.", logged_at: daysAgo(1) },
  { score: 55, message: "약간 피곤한 날이었어요.", logged_at: daysAgo(2) },
  { score: 90, message: "최고의 하루! 드디어 기능 배포 성공!", logged_at: daysAgo(3) },
  { score: 40, message: "회의가 너무 많아서 지쳤어요.", logged_at: daysAgo(4) },
  { score: 73, message: null, logged_at: daysAgo(5) },
  { score: 60, message: "평범한 하루.", logged_at: daysAgo(6) },
];

export const DEMO_USER = {
  name: "데모 사용자",
  avatar_emoji: "🌟",
  mood_logs: DEMO_MOOD_LOGS,
};
