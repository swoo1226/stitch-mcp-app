"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import ClimaLogo from "../../../components/WetherLogo";
import ThemeToggleButton from "../../../components/ThemeToggleButton";
import { MoodTrendChart } from "../../../components/MoodTrendChart";
import {
  SectionLabel,
  WeatherLegend,
  NikoMemberRow,
  NikoSummaryRow,
  NikoGridHeader,
} from "../../../components/ui";

import { STANDARD_SPRING } from "../../../constants/springs";
import { supabase } from "../../../../lib/supabase";
import { scoreToStatus, type WeatherStatus } from "../../../../lib/mood";

// ─── 날짜 유틸 ──────────────────────────────────────────────────────────────
function getMonthDays(year: number, month: number): Date[] {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      days.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function utcToKstDate(utcStr: string): string {
  const d = new Date(utcStr);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const WEATHER_LABELS: Record<string, string> = {
  Sunny: "맑음",
  PartlyCloudy: "구름조금",
  Cloudy: "흐림",
  Rainy: "비",
  Stormy: "뇌우",
};

interface MoodLogRow {
  user_id: string;
  score: number;
  message: string | null;
  logged_at: string;
}

interface MemberRow {
  id: string;
  name: string;
  avatarEmoji: string;
  part_id: string | null;
  logs: MoodLogRow[];
}

export default function PublicReportClient({ shareId }: { shareId: string }) {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetMonth, setTargetMonth] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchPublicReport() {
      try {
        setLoading(true);
        const { data, error: rpcError } = await supabase.rpc("get_public_report", {
          p_share_id: shareId,
        });

        if (rpcError) throw rpcError;

        const reportData = data as {
          team_id: string;
          target_month: string;
          users: any[];
          logs: any[];
        };

        const tMonth = new Date(reportData.target_month);
        setTargetMonth(tMonth);

        const mapped: MemberRow[] = reportData.users.map((u) => ({
          id: u.id,
          name: u.nickname || u.name,
          avatarEmoji: u.avatar_emoji || "👤",
          part_id: u.part_id,
          logs: reportData.logs.filter((l) => l.user_id === u.id),
        }));

        setMembers(mapped);
      } catch (err: any) {
        console.error("Public report fetch error:", err);
        setError(err.message || "리포트를 불러올 수 없거나 만료된 링크입니다.");
      } finally {
        setLoading(false);
      }
    }

    if (shareId) {
      fetchPublicReport();
    }
  }, [shareId]);

  const monthDays = useMemo(() => {
    if (!targetMonth) return [];
    return getMonthDays(targetMonth.getFullYear(), targetMonth.getMonth());
  }, [targetMonth]);

  const todayIso = useMemo(() => isoDate(new Date()), []);
  const colTemplate = `140px repeat(${monthDays.length}, minmax(70px, 1fr))`;

  const monthLabel = targetMonth
    ? `${targetMonth.getFullYear()}년 ${targetMonth.getMonth() + 1}월`
    : "";

  const calendarMembers = useMemo(() => {
    return members.map((m) => ({
      id: m.id,
      name: m.name,
      avatarEmoji: m.avatarEmoji,
      week: monthDays.map((day) => {
        const dayIso = isoDate(day);
        const dayLogs = m.logs.filter((log) => utcToKstDate(log.logged_at) === dayIso);
        if (dayLogs.length === 0) return { status: null, score: null, message: null };
        const latest = dayLogs[dayLogs.length - 1];
        return {
          status: scoreToStatus(latest.score),
          score: latest.score,
          message: latest.message ?? null,
        };
      }),
    }));
  }, [members, monthDays]);

  const averageRow = useMemo(() => {
    return monthDays.map((_, dayIdx) => {
      const dayScores = calendarMembers
        .map((m) => m.week[dayIdx]?.score ?? null)
        .filter((s): s is number => s !== null);
      if (dayScores.length === 0) return { status: null, score: null, message: null };
      const avg = Math.round(dayScores.reduce((a, b) => a + b, 0) / dayScores.length);
      return {
        status: scoreToStatus(avg),
        score: avg,
        message: `${dayScores.length}명 참여`,
      };
    });
  }, [calendarMembers, monthDays]);

  const totalAvg = useMemo(() => {
    const allScores = calendarMembers.flatMap((m) =>
      m.week.map((w) => w.score).filter((s): s is number => s !== null)
    );
    if (allScores.length === 0) return null;
    return Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
  }, [calendarMembers]);

  const stats = useMemo(() => {
    const dayAvgs = averageRow.map((r) => r.score).filter((s): s is number => s !== null);
    if (dayAvgs.length === 0) return null;

    const highest = Math.max(...dayAvgs);
    const lowest = Math.min(...dayAvgs);
    const highestDayIdx = averageRow.findIndex((r) => r.score === highest);

    // 기분 분포
    const counts = { Sunny: 0, PartlyCloudy: 0, Cloudy: 0, Rainy: 0, Stormy: 0 };
    let total = 0;
    calendarMembers.forEach((m) =>
      m.week.forEach((w) => {
        if (w.status) {
          counts[w.status]++;
          total++;
        }
      })
    );

    const distribution = Object.entries(counts)
      .map(([status, count]) => ({
        status: status as WeatherStatus,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.pct - a.pct);

    // 안정성
    const avg = dayAvgs.reduce((a, b) => a + b, 0) / dayAvgs.length;
    const variance = dayAvgs.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / dayAvgs.length;
    const stdDev = Math.sqrt(variance);
    const stability = stdDev < 10 ? "매우 높음" : stdDev < 20 ? "높음" : "변동성 있음";

    return { highest, lowest, highestDay: monthDays[highestDayIdx], distribution, stability };
  }, [averageRow, calendarMembers, monthDays]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <ClimaLogo />
          <p className="mt-6 text-xl font-bold text-on-surface">{error}</p>
          <Link href="/" className="mt-4 inline-block text-primary underline">
            메인으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--hero-gradient)" }}>
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={STANDARD_SPRING}
        className="fixed top-0 left-0 w-full z-50 flex items-center justify-between h-16 px-6 md:px-10"
        style={{
          background: "var(--header-bg)",
          backdropFilter: "var(--glass-blur)",
          boxShadow: "var(--header-shadow)",
        }}
      >
        <div className="flex items-center gap-8">
          <Link href="/" className="flex shrink-0 items-center">
            <ClimaLogo />
            <span className="ml-3 text-sm font-bold opacity-60">퍼블릭 리포트</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggleButton />
        </div>
      </motion.header>

      <div className="pt-24 px-4 md:px-8 max-w-[1600px] mx-auto pb-12">
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...STANDARD_SPRING, delay: 0.05 }}
          className="rounded-[2rem] p-4 md:p-6"
          style={{ background: "var(--panel-tint)" }}
        >
          <section
            className="mb-6 rounded-[2rem] p-6 md:p-8"
            style={{
              background:
                "linear-gradient(90deg, color-mix(in srgb, var(--surface-container-low) 92%, transparent) 0%, color-mix(in srgb, var(--surface) 96%, transparent) 50%, color-mix(in srgb, var(--surface-container-low) 92%, transparent) 100%)",
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-primary mb-2">
                  월간 리포트
                </h1>
                <p className="text-lg font-bold opacity-70" style={{ color: "var(--text-soft)" }}>
                  {loading ? "불러오는 중..." : `${monthLabel} · 팀 인사이트`}
                </p>
              </div>
            </div>

            {!loading && stats && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[1.5rem] bg-surface-low p-5">
                  <SectionLabel color="muted">월간 평균</SectionLabel>
                  <div className="mt-1 text-3xl font-black text-primary">{totalAvg}pt</div>
                  <p className="mt-2 text-xs font-semibold opacity-60">
                    {totalAvg && totalAvg > 60 ? "안정적인 흐름" : "주의 요망"}
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-surface-low p-5">
                  <SectionLabel color="muted">최고의 날</SectionLabel>
                  <div className="mt-1 text-3xl font-black text-primary">{stats.highest}pt</div>
                  <p className="mt-2 text-xs font-semibold opacity-60">
                    {stats.highestDay.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-surface-low p-5">
                  <SectionLabel color="muted">에너지 안정성</SectionLabel>
                  <div className="mt-1 text-3xl font-black text-tertiary">{stats.stability}</div>
                  <p className="mt-2 text-xs font-semibold opacity-60">일자별 점수 변동폭 기준</p>
                </div>
                <div className="rounded-[1.5rem] bg-surface-low p-5">
                  <SectionLabel color="muted">주요 날씨</SectionLabel>
                  <div className="mt-1 text-3xl font-black text-secondary">
                    {stats.distribution[0]?.pct}%
                  </div>
                  <p className="mt-2 text-xs font-semibold opacity-60">
                    {WEATHER_LABELS[stats.distribution[0]?.status] || stats.distribution[0]?.status}이
                    가장 많았어요
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="mb-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-[2rem] bg-[var(--panel-strong)] p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <SectionLabel color="primary">팀 에너지 트렌드</SectionLabel>
                <span className="text-xs font-bold opacity-40">일자별 팀 평균 점수</span>
              </div>
              <div className="h-40 w-full">
                {!loading && (
                  <MoodTrendChart
                    scores={averageRow.map((r) => r.score)}
                    height={160}
                    className="w-full"
                  />
                )}
              </div>
            </div>
            <div className="rounded-[2rem] bg-[var(--panel-strong)] p-6 shadow-sm">
              <SectionLabel color="primary" className="mb-4">
                날씨 분포
              </SectionLabel>
              <div className="space-y-3">
                {!loading &&
                  stats?.distribution.map(({ status, pct }) => (
                    <div key={status} className="flex items-center gap-3">
                      <div className="w-16 text-xs font-bold opacity-60">
                        {WEATHER_LABELS[status] || status}
                      </div>
                      <div className="flex-1 h-2 bg-surface-low rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-primary"
                        />
                      </div>
                      <div className="w-10 text-right text-xs font-black">{pct}%</div>
                    </div>
                  ))}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] bg-[var(--surface-lowest)] border border-[var(--border-subtle)] overflow-hidden shadow-xl">
            <div className="overflow-x-auto scrollbar-hide overscroll-contain">
              <div style={{ minWidth: monthDays.length * 70 + 140 }}>
                <NikoGridHeader
                  days={monthDays.map((d) => ({ label: DAY_LABELS[d.getDay()], date: d }))}
                  todayIso={todayIso}
                  colTemplate={colTemplate}
                />
                <div className="flex flex-col gap-2 p-2">
                  <NikoSummaryRow
                    week={averageRow}
                    todayIndex={monthDays.findIndex((d) => isoDate(d) === todayIso)}
                    colTemplate={colTemplate}
                    loading={loading}
                    label="팀 전체 평균"
                    subtitle="일자별 평균"
                  />
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <NikoMemberRow
                          key={i}
                          name=""
                          week={[]}
                          todayIndex={-1}
                          colTemplate={colTemplate}
                          loading
                        />
                      ))
                    : calendarMembers.map((member) => (
                        <NikoMemberRow
                          key={member.id}
                          avatarEmoji={member.avatarEmoji}
                          name={member.name}
                          week={member.week}
                          todayIndex={monthDays.findIndex((d) => isoDate(d) === todayIso)}
                          colTemplate={colTemplate}
                        />
                      ))}
                </div>
              </div>
            </div>
          </section>

          <WeatherLegend className="mt-8 px-4" />
        </motion.main>
      </div>
    </div>
  );
}
