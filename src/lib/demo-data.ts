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
const RAW_MEMBERS: {
  id: string;
  name: string;
  avatar: string;
  part_id: string;
  scores: (number | null)[];
  messages: (string | null)[];
}[] = [
  {
    id: "d1", name: "김상우", avatar: "🌟", part_id: "p1",
    scores:   [82,     75,     88,    null, 79],
    messages: [
      "**배포 성공!** 오늘은 정말 뿌듯한 하루였어요 🚀",
      "코드 리뷰 몇 건 처리하고 마무리. _무난했어요._",
      "집중 잘 됐어요. **PR 3개** 머지 완료 💪",
      null,
      "주말 전 마지막 정리. 개운하게 끝냈어요!",
    ],
  },
  {
    id: "d2", name: "이지연", avatar: "🌻", part_id: "p1",
    scores:   [55,     60,     null, 58,    63],
    messages: [
      "오전엔 집중이 안 됐어요. _오후에 조금 나아진 느낌_",
      "미팅이 많아서 **실제 작업 시간이 부족**했어요.",
      null,
      "컨디션이 좀 올라왔어요. 할 일 목록 정리 완료!",
      "이번 주는 그럭저럭. **다음 주가 더 기대돼요.**",
    ],
  },
  {
    id: "d3", name: "박민호", avatar: "⚡", part_id: "p2",
    scores:   [30,     null, 25,    35,    28],
    messages: [
      "**야근 연속**으로 많이 지쳤어요. 쉬고 싶어요 😞",
      null,
      "몸 상태가 최악이에요. _오늘 일찍 들어가도 될까요?_",
      "조금 나아졌지만 아직 피곤해요.",
      "이번 주 내내 힘들었어요. **다음 주엔 꼭 쉬어야겠어요.**",
    ],
  },
  {
    id: "d4", name: "최수아", avatar: "🌈", part_id: "p2",
    scores:   [90,    85,    92,    88,    null],
    messages: [
      "**정말 최고의 하루!** 새 기능 설계가 딱 맞아떨어졌어요 ✨",
      "어제보다 조금 덜하지만 그래도 _에너지 넘침_ ⚡",
      "**역대급 집중력.** 오늘 코드 퀄리티 진짜 마음에 들어요.",
      "살짝 긴장됐지만 발표 잘 끝냈어요. 뿌듯!",
      null,
    ],
  },
  {
    id: "d5", name: "정다은", avatar: "🍀", part_id: "p3",
    scores:   [65,    70,    68,    null, 72],
    messages: [
      "디자인 시안 3개 완성. _팀 반응이 궁금해요._",
      "**피드백 반영** 완료! 방향이 잡히니 수월해요.",
      "오늘은 약간 막히는 게 있었어요. 내일 다시 볼게요.",
      null,
      "주간 마무리 잘 됐어요. **다음 스프린트도 기대돼요!**",
    ],
  },
  {
    id: "d6", name: "한준서", avatar: "🌊", part_id: "p3",
    scores:   [null, 42,    38,    45,    40],
    messages: [
      null,
      "오늘따라 아이디어가 안 떠올라요. _슬럼프인가..._",
      "**작업 막힘** 연속. 방향을 잃은 느낌이에요.",
      "팀장님이랑 얘기 후 조금 방향이 잡혔어요.",
      "아직 힘들지만 버티는 중. _이번 주도 수고했어요._",
    ],
  },
  {
    id: "d7", name: "윤서연", avatar: "🔥", part_id: "p1",
    scores:   [78,    80,    76,    83,    77],
    messages: [
      "꾸준히 잘 가고 있어요. **오늘 스탠드업 분위기 최고!**",
      "집중 잘 됐고 진행 속도도 맘에 들어요 😊",
      "살짝 여유로운 하루. _리뷰 남겨주신 분들 감사해요!_",
      "**목요일 파이팅!** 이번 주 가장 잘 된 날이에요.",
      "한 주를 잘 마무리했어요. 주말이 기다려져요 🌅",
    ],
  },
];

export const DEMO_PARTS = [
  { id: "p1", name: "프론트엔드" },
  { id: "p2", name: "백엔드" },
  { id: "p3", name: "디자인" },
];

// ─── Dashboard / Niko 용 멤버 데이터 생성 ────────────────────────────────────
// 데모는 날짜에 독립적으로 항상 이번 주 월~금 + 전주 데이터가 채워져야 함.
// weekDays(실제 날짜)에 RAW_MEMBERS 점수를 1:1 매핑하고, logs도 함께 생성해
// 월 평균·전주 대비 등 모든 통계가 항상 표시되도록 한다.
export function getDemoMembers(weekOffset = 0) {
  const today = new Date();
  const baseMonday = getWeekStart(today);
  baseMonday.setDate(baseMonday.getDate() + weekOffset * 7);
  const weekDays = getWeekDays(baseMonday);

  // 전주 날짜
  const prevMonday = new Date(baseMonday);
  prevMonday.setDate(prevMonday.getDate() - 7);
  const prevWeekDays = getWeekDays(prevMonday);

  // 오늘이 주중이면 그 인덱스, 주말이면 금요일(4)을 오늘로 취급
  const todayIso = isoDate(today);
  const rawTodayIndex = weekDays.findIndex((d) => isoDate(d) === todayIso);
  const todayIndex = weekOffset === 0
    ? (rawTodayIndex >= 0 ? rawTodayIndex : 4) // 주말엔 금요일 기준
    : -1;

  return RAW_MEMBERS.map((m) => {
    // 이번 주 week 배열 — 오늘 인덱스까지만 채움 (미래는 null)
    const week = weekDays.map((_, i) => {
      const score = m.scores[i] ?? null;
      if (score === null) return { status: null as WeatherStatus | null, score: null as number | null, message: null as string | null };
      // weekOffset=0 이면 오늘 이후는 null (미래 데이터 없음)
      if (weekOffset === 0 && i > todayIndex) return { status: null as WeatherStatus | null, score: null as number | null, message: null as string | null };
      return { status: scoreToStatus(score), score, message: (m.messages[i] ?? null) as string | null };
    });

    // 전주 점수 — 이번 주 점수에서 ±5~10 변동으로 자연스럽게 생성
    const prevScoreOffset = [4, -6, 5, -3, 7, -5, 3];
    const prevWeekLogs: MoodLogRow[] = prevWeekDays.map((day, i) => {
      const base = m.scores[i] ?? 60;
      const score = Math.max(10, Math.min(99, base + (prevScoreOffset[parseInt(m.id.slice(1)) + i] ?? 0)));
      return { user_id: m.id, score, message: null, logged_at: new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), 1)).toISOString() };
    });

    // 이번 주 logs
    const thisWeekLogs: MoodLogRow[] = weekDays.reduce<MoodLogRow[]>((acc, day, i) => {
      const score = week[i]?.score;
      if (score === null || score === undefined) return acc;
      acc.push({ user_id: m.id, score, message: null, logged_at: new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), 1)).toISOString() });
      return acc;
    }, []);

    const todayScore = todayIndex >= 0 ? (week[todayIndex]?.score ?? null) : null;

    return {
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      part_id: m.part_id,
      score: weekOffset === 0 ? todayScore : null,
      status: todayScore !== null && weekOffset === 0 ? scoreToStatus(todayScore) : null,
      message: weekOffset === 0 && todayScore !== null ? "데모 데이터입니다." : "오늘 체크인이 아직 없어요.",
      week,
      todayScore: weekOffset === 0 ? todayScore : null,
      logs: [...prevWeekLogs, ...thisWeekLogs],
    };
  });
}

// ─── 데모용 고정 월간 logs 생성 ───────────────────────────────────────────────
// 날짜에 독립적으로 항상 의미 있는 월 평균이 나오도록 이번 달 1~28일에 고정 점수를 심음
type MoodLogRow = { user_id: string; score: number; message: string | null; logged_at: string };

function fixedMonthLogs(memberId: string, scores: number[]): MoodLogRow[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  return scores.map((score, i) => {
    const day = i + 1;
    const date = new Date(Date.UTC(year, month, day, 1, 0, 0));
    return { user_id: memberId, score, message: null, logged_at: date.toISOString() };
  });
}

// 멤버별 이번 달 고정 점수 (28개, 1일~28일)
const DEMO_MONTH_SCORES: Record<string, number[]> = {
  d1: [80,82,78,85,83,79,88,81,76,84,87,80,83,75,79,82,86,78,80,84,81,77,85,83,79,82,88,84],
  d2: [58,62,55,60,63,57,61,59,64,56,60,62,58,63,61,57,59,62,60,58,63,61,57,60,62,59,61,63],
  d3: [32,28,35,30,25,33,29,31,27,34,26,30,28,35,32,29,27,31,33,26,30,28,34,32,29,27,31,28],
  d4: [88,92,85,90,93,87,91,89,94,86,90,92,88,85,93,91,87,89,92,86,90,88,85,93,91,87,89,92],
  d5: [68,72,65,70,73,67,71,69,66,74,68,72,65,70,73,67,71,69,74,66,70,72,68,65,73,71,67,69],
  d6: [44,40,47,43,38,45,41,39,46,42,40,44,47,43,38,45,41,42,39,46,43,40,44,47,42,38,45,41],
  d7: [79,77,81,80,76,78,82,75,79,77,80,78,76,81,79,77,83,75,80,78,76,82,79,77,80,78,75,81],
};

export function getDemoMonthLogs(): MoodLogRow[] {
  return Object.entries(DEMO_MONTH_SCORES).flatMap(([id, scores]) =>
    fixedMonthLogs(id, scores)
  );
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
  name: "김상우",
  avatar_emoji: "🌟",
  mood_logs: DEMO_MOOD_LOGS,
};
