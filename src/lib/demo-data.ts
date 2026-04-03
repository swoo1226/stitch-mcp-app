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
export function getDemoMembers(weekOffset = 0) {
  const today = new Date();
  const baseMonday = getWeekStart(today);
  baseMonday.setDate(baseMonday.getDate() + weekOffset * 7);
  const weekDays = getWeekDays(baseMonday);
  const todayIso = isoDate(today);
  const todayIndex = weekDays.findIndex((d) => isoDate(d) === todayIso);

  return RAW_MEMBERS.map((m) => {
    const week = m.scores.map((score, i) => {
      if (score === null) return { status: null as WeatherStatus | null, score: null as number | null, message: null as string | null };
      return { status: scoreToStatus(score), score, message: (m.messages[i] ?? null) as string | null };
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
