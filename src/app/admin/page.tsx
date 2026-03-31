"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, DEFAULT_TEAM_ID } from "../../lib/supabase";
import { scoreToStatus, statusToEmoji, statusToKo } from "../../lib/mood";
import { STANDARD_SPRING } from "../constants/springs";
import Link from "next/link";
import ClimaLogo from "../components/WetherLogo";
import ThemeToggleButton from "../components/ThemeToggleButton";
import {
  ClimaButton,
  ClimaInput,
  ClimaTextarea,
  GlassCard,
  SectionHeader,
  Badge,
  PlayfulGeometry,
  WeatherTile,
  PrimaryTabToggle,
  PortalSelect,
} from "../components/ui";
import { WEATHER_ICON_MAP } from "../components/WeatherIcons";


const WEATHER_METAPHORS = [
  { score: 0, label: "Stormy", ko: "번개" },
  { score: 21, label: "Rainy", ko: "비" },
  { score: 41, label: "Foggy", ko: "안개" },
  { score: 61, label: "Sunny", ko: "맑음" },
  { score: 81, label: "Radiant", ko: "쨍함" },
] as const;

function currentMetaphorFromScore(score: number) {
  const status = scoreToStatus(score);
  return WEATHER_METAPHORS.find((metaphor) => metaphor.label === status) ?? WEATHER_METAPHORS[0];
}

interface MoodLog {
  score: number;
  message: string | null;
  logged_at: string;
}

interface Part {
  id: string;
  name: string;
  team_id: string | null;
}

interface Member {
  id: string;
  name: string;
  avatar_emoji: string;
  access_token: string;
  team_id: string | null;
  part_id: string | null;
  parts: Part | null;
  mood_logs: MoodLog[];
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75M21 20a6 6 0 0 0-9-5.2" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 14 19 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" strokeLinecap="round" />
    </svg>
  );
}

function ThoughtBubbleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8.5 16.5c-2.9 0-5-1.8-5-4.4 0-2.7 2.3-4.8 5.2-4.8.8-2 2.9-3.3 5.5-3.3 3.6 0 6.3 2.4 6.3 5.7 0 3.1-2.5 5.8-6.2 5.8h-1.8l-3 2.4v-2.4H8.5Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7.3" cy="19.1" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="4.8" cy="21" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}


interface Team {
  id: string;
  name: string;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  // 모바일 사이드바 드로어
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 탭: "members" | "teams"
  const [activeTab, setActiveTab] = useState<"members" | "teams">("members");

  // ── 삭제 재확인
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── 기록 초기화 재확인
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);

  // ── 링크 복사 피드백
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLinkKey, setCopiedLinkKey] = useState<string | null>(null);
  const [activeThoughtId, setActiveThoughtId] = useState<string | null>(null);
  const thoughtPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thoughtLongPressTriggeredRef = useRef(false);

  function copyWithFeedback(text: string, key: string, type: "member" | "link") {
    navigator.clipboard.writeText(text);
    if (type === "member") {
      setCopiedId(key);
      setTimeout(() => setCopiedId(null), 1800);
    } else {
      setCopiedLinkKey(key);
      setTimeout(() => setCopiedLinkKey(null), 1800);
    }
  }

  function clearThoughtPressTimer() {
    if (thoughtPressTimerRef.current) {
      clearTimeout(thoughtPressTimerRef.current);
      thoughtPressTimerRef.current = null;
    }
  }

  function beginThoughtPress(id: string) {
    clearThoughtPressTimer();
    thoughtLongPressTriggeredRef.current = false;
    thoughtPressTimerRef.current = setTimeout(() => {
      thoughtLongPressTriggeredRef.current = true;
      setActiveThoughtId(id);
    }, 380);
  }

  function endThoughtPress() {
    clearThoughtPressTimer();
  }

  function toggleThought(id: string) {
    if (thoughtLongPressTriggeredRef.current) {
      thoughtLongPressTriggeredRef.current = false;
      return;
    }
    setActiveThoughtId((current) => current === id ? null : id);
  }

  // ── 팀원 관리 상태
  const [members, setMembers] = useState<Member[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newTeamId, setNewTeamId] = useState<string>("");
  const [newPartId, setNewPartId] = useState<string>("");
  const [adding, setAdding] = useState(false);

  // ── 기분 기록 모달
  const [moodTarget, setMoodTarget] = useState<string | null>(null);
  const [moodScore, setMoodScore] = useState(60);
  const [moodMessage, setMoodMessage] = useState("");
  const [moodMode, setMoodMode] = useState<"tile" | "range">("tile");
  const [submitting, setSubmitting] = useState(false);
  const [moodError, setMoodError] = useState<string | null>(null);
  const [moodDuplicate, setMoodDuplicate] = useState(false);

  // ── 팀 CRUD 상태
  const [newTeamName, setNewTeamName] = useState("");
  const [addingTeam, setAddingTeam] = useState(false);

  // ── 파트 CRUD 상태
  const [newPartName, setNewPartName] = useState("");
  const [newPartTeamId, setNewPartTeamId] = useState<string>("");
  const [addingPart, setAddingPart] = useState(false);

  useEffect(() => {
    // 기존 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setAuthed(true);
    });
    // 세션 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authed) {
      fetchAll();
    }
  }, [authed]);

  async function fetchAll() {
    await Promise.all([fetchTeams(), fetchParts(), fetchMembers()]);
  }

  async function fetchTeams() {
    const { data } = await supabase.from("teams").select("id, name").order("name");
    setTeams((data as Team[]) ?? []);
  }

  async function fetchParts() {
    const { data } = await supabase.from("parts").select("id, name, team_id").order("name");
    setParts((data as Part[]) ?? []);
  }

  async function fetchMembers() {
    setLoading(true);
    const { data } = await supabase
      .from("users")
      .select(`id, name, avatar_emoji, access_token, part_id, team_id, parts (id, name), mood_logs (score, message, logged_at)`)
      .order("logged_at", { referencedTable: "mood_logs", ascending: false });
    // mood_logs를 배열로 정규화하고, 최신 1개만 사용
    const normalized = (data ?? []).map((u: unknown) => {
      const user = u as Record<string, unknown>;
      let logs = user.mood_logs;
      if (!Array.isArray(logs)) logs = logs ? [logs] : [];
      return { ...user, mood_logs: (logs as MoodLog[]).slice(0, 1) };
    });
    setMembers(normalized as unknown as Member[]);
    setLoading(false);
  }

  async function addMember() {
    if (!newName.trim() || adding) return;
    setAdding(true);
    await supabase.from("users").insert({
      team_id: newTeamId || DEFAULT_TEAM_ID,
      name: newName.trim(),
      part_id: newPartId || null,
    });
    setNewName("");
    setNewTeamId("");
    setNewPartId("");
    await fetchMembers();
    setAdding(false);
  }

  // ── Optimistic update 헬퍼 ──────────────────────────────────────────────────
  function patchMember(id: string, patch: Partial<Member>) {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  }

  async function deleteMember(id: string) {
    setMembers(prev => prev.filter(m => m.id !== id));
    await supabase.from("users").delete().eq("id", id);
  }

  async function resetTodayMood(userId: string) {
    patchMember(userId, { mood_logs: [] });
    const todayKST = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
    const startOfDay = `${todayKST}T00:00:00+09:00`;
    const endOfDay   = `${todayKST}T23:59:59+09:00`;
    const { error } = await supabase
      .from("mood_logs")
      .delete()
      .eq("user_id", userId)
      .gte("logged_at", startOfDay)
      .lte("logged_at", endOfDay);
    if (error) await fetchMembers(); // 실패 시 서버 상태로 복구
  }

  async function submitMood() {
    if (!moodTarget) return;
    setSubmitting(true);
    setMoodError(null);
    setMoodDuplicate(false);
    const loggedAt = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).replace(" ", "T") + "+09:00";
    const { error } = await supabase.from("mood_logs").insert({
      user_id: moodTarget,
      score: moodScore,
      message: moodMessage.trim() || null,
      logged_at: loggedAt,
    });
    if (error) {
      if (error.code === "23505") {
        setMoodDuplicate(true);
      } else {
        setMoodError("저장 중 오류가 발생했어요.");
      }
      setSubmitting(false);
      return;
    }
    const newLog: MoodLog = { score: moodScore, message: moodMessage.trim() || null, logged_at: loggedAt };
    patchMember(moodTarget, { mood_logs: [newLog] });
    setMoodTarget(null);
    setMoodScore(50);
    setMoodMessage("");
    setMoodDuplicate(false);
    setSubmitting(false);
  }

  async function overwriteMood() {
    if (!moodTarget) return;
    setSubmitting(true);
    setMoodError(null);
    const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const todayIso = `${nowKst.getUTCFullYear()}-${String(nowKst.getUTCMonth() + 1).padStart(2, "0")}-${String(nowKst.getUTCDate()).padStart(2, "0")}`;
    const { data: existing, error: fetchError } = await supabase
      .from("mood_logs")
      .select("id")
      .eq("user_id", moodTarget)
      .eq("logged_date", todayIso)
      .limit(1)
      .single();
    if (fetchError || !existing) {
      setMoodError("기존 기록을 찾지 못했어요.");
      setSubmitting(false);
      return;
    }
    const { error } = await supabase
      .from("mood_logs")
      .update({ score: moodScore, message: moodMessage.trim() || null })
      .eq("id", existing.id);
    if (error) {
      setMoodError("덮어쓰기 중 오류가 발생했어요.");
      setSubmitting(false);
      return;
    }
    const loggedAt = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).replace(" ", "T") + "+09:00";
    const newLog: MoodLog = { score: moodScore, message: moodMessage.trim() || null, logged_at: loggedAt };
    patchMember(moodTarget, { mood_logs: [newLog] });
    setMoodTarget(null);
    setMoodScore(50);
    setMoodMessage("");
    setMoodDuplicate(false);
    setSubmitting(false);
  }

  async function addTeam() {
    if (!newTeamName.trim() || addingTeam) return;
    setAddingTeam(true);
    await supabase.from("teams").insert({ name: newTeamName.trim() });
    setNewTeamName("");
    await fetchTeams();
    setAddingTeam(false);
  }

  async function deleteTeam(id: string) {
    await supabase.from("teams").delete().eq("id", id);
    await fetchAll();
  }

  async function addPart() {
    if (!newPartName.trim() || addingPart) return;
    setAddingPart(true);
    await supabase.from("parts").insert({
      name: newPartName.trim(),
      team_id: newPartTeamId || null,
    });
    setNewPartName("");
    setNewPartTeamId("");
    await fetchParts();
    setAddingPart(false);
  }

  async function deletePart(id: string) {
    await supabase.from("parts").delete().eq("id", id);
    await fetchAll();
  }

  async function signIn() {
    if (signingIn) return;
    setSigningIn(true);
    setPwError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailInput.trim(),
      password: pwInput,
    });
    if (error) {
      setPwError("이메일 또는 비밀번호가 맞지 않아요.");
    }
    setSigningIn(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  // ── 로그인 화면 ──────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center overflow-hidden relative px-6"
        style={{ background: "var(--hero-gradient)" }}
      >
        {/* 배경 장식 */}
        <PlayfulGeometry variant="circle" color="var(--primary)" className="w-80 h-80 -top-20 -left-20 opacity-[0.06]" />
        <PlayfulGeometry variant="circle" color="var(--primary)" className="w-64 h-64 bottom-10 right-10 opacity-[0.05]" />
        <PlayfulGeometry variant="dots" color="var(--primary)" className="top-1/3 right-1/4 opacity-30" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={STANDARD_SPRING}
          className="relative z-10 w-full max-w-md"
        >
          <GlassCard className="p-10 md:p-12 flex flex-col items-center gap-0" intensity="medium">
            {/* 아이콘 뱃지 */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6 text-3xl"
              style={{ background: "var(--button-primary-gradient)", boxShadow: "var(--button-primary-shadow)", color: "var(--on-primary)" }}
            >
              ☁️
            </div>

            {/* 제목 */}
            <h1
              className="font-black text-3xl tracking-tight mb-2"
              style={{ fontFamily: "'Space Grotesk', 'Public Sans', sans-serif", color: "var(--primary)" }}
            >
              Clima Admin
            </h1>
            <p className="text-sm font-medium mb-10" style={{ color: "var(--on-surface-variant)" }}>
              Atmospheric System Controller
            </p>

            {/* 폼 */}
            <div className="w-full flex flex-col gap-4">
              <ClimaInput
                type="email"
                autoFocus
                placeholder="Email"
                value={emailInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setEmailInput(e.target.value); setPwError(null); }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && signIn()}
                className="font-bold"
              />
              <ClimaInput
                type="password"
                placeholder="Password"
                value={pwInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setPwInput(e.target.value); setPwError(null); }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && signIn()}
                className="font-bold"
              />
              {pwError && <p className="text-xs font-bold -mt-2" style={{ color: "var(--error)" }}>{pwError}</p>}
              <ClimaButton
                onClick={signIn}
                variant="primary"
                className="w-full py-4 text-base"
                disabled={signingIn}
              >
                {signingIn ? "로그인 중…" : "Enter →"}
              </ClimaButton>
            </div>

            {/* 하단 메타 */}
            <p className="mt-8 text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-soft)" }}>
              Region: Horizon-01 &nbsp;·&nbsp; v4.2.0
            </p>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  // ── 관리 대시보드 ─────────────────────────────────────────────────────────────
  const todayKST = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }); // "YYYY-MM-DD"
  const checkedInToday = members.filter(m => {
    const loggedAt = m.mood_logs?.[0]?.logged_at;
    if (!loggedAt) return false;
    const logDateKST = new Date(loggedAt).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
    return logDateKST === todayKST;
  }).length;

  // 사이드바 네비 공통 함수
  function handleNavTab(tab: "members" | "teams") {
    setActiveTab(tab);
    setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen flex overflow-x-hidden" style={{ background: "var(--surface)" }}>

      {/* ── 사이드바 (데스크탑) ── */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col z-40"
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border-subtle)" }}
      >
        {/* 로고 */}
        <div className="pt-8 px-6 mb-8">
          <h1
            className="font-black text-xl tracking-tight"
            style={{ fontFamily: "'Space Grotesk', 'Public Sans', sans-serif", color: "var(--primary)" }}
          >
            Clima Admin
          </h1>
          <p className="text-xs font-medium mt-1" style={{ color: "var(--on-surface-variant)" }}>System Controller</p>
        </div>

        {/* 네비 */}
        <nav className="flex-1 px-4 flex flex-col gap-1">
          <button
            onClick={() => handleNavTab("members")}
            className="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-bold text-left transition-all"
            style={activeTab === "members"
              ? { background: "var(--secondary)", color: "var(--primary)", fontWeight: 800 }
              : { color: "var(--on-surface-variant)" }
            }
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="7" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 3.13a4 4 0 0 1 0 7.75M21 20a6 6 0 0 0-9-5.2" />
            </svg>
            Team Members
          </button>
          <button
            onClick={() => handleNavTab("teams")}
            className="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-bold text-left transition-all"
            style={activeTab === "teams"
              ? { background: "var(--secondary)", color: "var(--primary)", fontWeight: 800 }
              : { color: "var(--on-surface-variant)" }
            }
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Teams &amp; Parts
          </button>
        </nav>

        {/* 하단 */}
        <div className="px-6 pb-8 flex flex-col gap-3">
          <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--text-soft)" }}>Admin Ops</p>
          <Link
            href="/"
            className="text-xs font-bold transition-opacity hover:opacity-70"
            style={{ color: "var(--on-surface-variant)" }}
          >
            ← 메인 가든으로
          </Link>
          <button
            onClick={signOut}
            className="text-xs font-bold text-left transition-opacity hover:opacity-70"
            style={{ color: "var(--error)" }}
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* ── 모바일 사이드바 드로어 ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-50 md:hidden"
              style={{ background: "var(--drawer-scrim)", backdropFilter: "blur(4px)" }}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-72 z-[60] flex flex-col md:hidden"
              style={{ background: "var(--drawer-bg)", backdropFilter: "var(--glass-blur)" }}
            >
              <div className="flex items-center justify-between pt-8 px-6 mb-8">
                <div>
                  <h1 className="font-black text-xl tracking-tight" style={{ fontFamily: "'Space Grotesk', 'Public Sans', sans-serif", color: "var(--primary)" }}>
                    Clima Admin
                  </h1>
                  <p className="text-xs font-medium mt-1" style={{ color: "var(--on-surface-variant)" }}>System Controller</p>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ color: "var(--text-soft)", background: "var(--button-subtle-bg)" }}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 px-4 flex flex-col gap-1">
                <button
                  onClick={() => handleNavTab("members")}
                  className="flex items-center gap-3 px-4 py-4 rounded-[1.5rem] text-base font-bold text-left transition-all"
                  style={activeTab === "members"
                    ? { background: "var(--secondary)", color: "var(--primary)", fontWeight: 800 }
                    : { color: "var(--on-surface-variant)" }
                  }
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="7" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 3.13a4 4 0 0 1 0 7.75M21 20a6 6 0 0 0-9-5.2" />
                  </svg>
                  Team Members
                </button>
                <button
                  onClick={() => handleNavTab("teams")}
                  className="flex items-center gap-3 px-4 py-4 rounded-[1.5rem] text-base font-bold text-left transition-all"
                  style={activeTab === "teams"
                    ? { background: "var(--secondary)", color: "var(--primary)", fontWeight: 800 }
                    : { color: "var(--on-surface-variant)" }
                  }
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" /><polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  Teams &amp; Parts
                </button>
              </nav>
              <div className="px-6 pb-10 flex flex-col gap-3">
                <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--text-soft)" }}>Admin Ops</p>
                <Link
                  href="/"
                  className="text-sm font-bold transition-opacity hover:opacity-70"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  ← 메인 가든으로
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── 메인 영역 ── */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen overflow-y-auto overflow-x-hidden">

        {/* 탑바 */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={STANDARD_SPRING}
          className="fixed z-40 top-0 left-0 right-0 md:left-60 flex items-center justify-between h-16 px-6 md:px-10"
          style={{ background: "var(--header-bg)", backdropFilter: "var(--glass-blur)", boxShadow: "var(--header-shadow)" }}
        >
          {/* 좌측: 로고 (모바일) / 탭 제목 (데스크탑) */}
          <div className="flex items-center gap-3">
            <Link href="/" className="md:hidden flex shrink-0 items-center">
              <ClimaLogo />
            </Link>
            <span
              className="hidden md:block font-black text-xl tracking-tight"
              style={{ fontFamily: "'Space Grotesk', 'Public Sans', sans-serif", color: "var(--primary)" }}
            >
              {activeTab === "members" ? "Team Management" : "Teams & Parts"}
            </span>
          </div>

          {/* 우측: 홈 + 로그아웃 (데스크탑) / 햄버거 (모바일) */}
          <div className="flex items-center gap-2" style={{ color: "var(--header-action-color)" }}>
            <ThemeToggleButton />
            <Link
              href="/"
              className="hidden md:flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low"
              title="메인으로"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </Link>
            <button
              onClick={signOut}
              className="hidden md:flex h-10 items-center justify-center rounded-full px-4 text-sm font-bold transition-colors hover:bg-surface-low"
              style={{ color: "var(--error)" }}
            >
              로그아웃
            </button>
            <button
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low"
              onClick={() => setSidebarOpen(true)}
              aria-label="메뉴 열기"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </motion.header>

        {/* 캔버스 */}
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...STANDARD_SPRING, delay: 0.05 }}
          className="pt-20 px-4 pb-10 md:px-8 md:pb-12 flex flex-col gap-6 md:gap-8 w-full max-w-2xl md:max-w-none mx-auto"
        >
          {activeTab === "members" && (<>
            {/* 1. 요약 Bento Grid */}
            <section className="grid grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
              {/* 총 팀원 */}
              <GlassCard className="p-6 flex flex-col justify-between min-h-[140px]" intensity="low">
                <div
                  className="w-10 h-10 rounded-[1rem] flex items-center justify-center mb-4"
                  style={{ background: "var(--highlight-soft)", color: "var(--primary)" }}
                >
                  <UsersIcon />
                </div>
                <div>
                  <p className="text-4xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
                    {loading ? "—" : members.length}
                  </p>
                  <p className="text-sm font-medium mt-1" style={{ color: "var(--on-surface-variant)" }}>Total Members</p>
                </div>
              </GlassCard>

              {/* 오늘 체크인 */}
              <GlassCard className="p-6 flex flex-col justify-between min-h-[140px]" intensity="low">
                <div
                  className="w-10 h-10 rounded-[1rem] flex items-center justify-center mb-4"
                  style={{ background: "var(--highlight-soft)", color: "var(--primary)" }}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-4xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--primary)" }}>
                    {loading ? "—" : checkedInToday}
                  </p>
                  <p className="text-sm font-medium mt-1" style={{ color: "var(--on-surface-variant)" }}>Today's Check-ins</p>
                </div>
              </GlassCard>

              {/* Team Atmosphere 텍스트 카드 */}
              <GlassCard className="p-5 col-span-2 flex flex-col gap-2" intensity="low">
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--primary)" }}>Team Atmosphere</p>
                <p className="text-base font-extrabold leading-snug tracking-tight" style={{
                  color: !loading && members.length > 0 && checkedInToday < members.length
                    ? "var(--tertiary)"
                    : "var(--on-surface)"
                }}>
                  {loading
                    ? "데이터를 불러오는 중..."
                    : members.length === 0
                      ? "아직 팀원이 없어요."
                      : checkedInToday === members.length
                        ? "모든 팀원이 오늘 체크인했어요! 🌤️"
                        : `${members.length - checkedInToday}명이 아직 오늘 기록을 남기지 않았어요.`
                  }
                </p>
                {!loading && members.length > 0 && (
                  <p className="text-xs font-medium" style={{ color: "var(--on-surface-variant)" }}>
                    오늘 {checkedInToday} / {members.length}명 체크인
                  </p>
                )}
              </GlassCard>
            </section>

            {/* 2. 팀원 추가 */}
            <GlassCard className="p-6 md:p-8" intensity="low">
              <SectionHeader
                icon={<PlusIcon />}
                title="팀원 추가"
                subtitle="새 팀원을 가든에 식재합니다"
                className="mb-6"
              />
              <div className="flex gap-3 flex-wrap">
                <ClimaInput
                  id="add-member-name"
                  type="text"
                  placeholder="멤버 이름"
                  value={newName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addMember()}
                  className="font-bold flex-1 min-w-[140px]"
                />
                <PortalSelect
                  value={newTeamId}
                  onChange={(v) => { setNewTeamId(v); setNewPartId(""); }}
                  placeholder="팀 선택 (선택)"
                  options={teams.map(t => ({ value: t.id, label: t.name }))}
                  className="flex-1"
                />
                <PortalSelect
                  value={newPartId}
                  onChange={setNewPartId}
                  placeholder="파트 선택 (선택)"
                  options={(newTeamId ? parts.filter(p => p.team_id === newTeamId) : parts).map(p => ({ value: p.id, label: p.name }))}
                  className="flex-1"
                />
                <ClimaButton
                  variant="primary"
                  onClick={addMember}
                  className="py-3 text-sm shrink-0"
                  style={{ paddingInline: "1.5rem" }}
                >
                  {adding ? "추가 중..." : "추가하기"}
                </ClimaButton>
              </div>
            </GlassCard>

            {/* 3. 팀원 목록 */}
            <GlassCard className="p-6 md:p-8" intensity="low">
              <div className="flex items-center justify-between mb-6">
                <SectionHeader icon={<UsersIcon />} title="팀원 목록" />
                {!loading && members.length > 0 && (
                  <Badge variant="primary">총 {members.length}명</Badge>
                )}
              </div>
              {loading ? (
                <p className="text-sm font-bold py-4" style={{ color: "var(--text-soft)" }}>Loading...</p>
              ) : members.length === 0 ? (
                <p className="text-sm font-bold py-4" style={{ color: "var(--text-soft)" }}>팀원이 없어요.</p>
              ) : (
                <div
                  className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1"
                  style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", msOverflowStyle: "none", scrollbarWidth: "none" }}
                >
                  {members.map(m => {
                    const raw = m.mood_logs?.[0];
                    const isToday = raw?.logged_at
                      ? new Date(raw.logged_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) === todayKST
                      : false;
                    const latest = isToday ? raw : undefined;
                    const score = latest?.score ?? null;
                    const status = score !== null ? scoreToStatus(score) : null;
                    const thought = latest?.message?.trim() ?? "";
                    const hasThought = thought.length > 0;
                    const relativeTime = latest?.logged_at
                      ? (() => {
                        const diff = Math.max(0, Date.now() - new Date(latest.logged_at).getTime());
                        const mins = Math.floor(diff / 60000);
                        if (mins < 60) return `${mins}분 전`;
                        const hrs = Math.floor(mins / 60);
                        if (hrs < 24) return `${hrs}시간 전`;
                        return `${Math.floor(hrs / 24)}일 전`;
                      })()
                      : null;
                    return (
                      <motion.div
                        key={m.id}
                        layout
                        className="flex flex-col gap-4 rounded-[2rem] p-5 shrink-0 group"
                        onMouseLeave={() => {
                          if (activeThoughtId === m.id) setActiveThoughtId(null);
                        }}
                        style={{
                          width: 300,
                          maxWidth: "calc(100vw - 3rem)",
                          scrollSnapAlign: "start",
                          background: "var(--surface-overlay)",
                          backdropFilter: "var(--glass-blur-low)",
                          WebkitBackdropFilter: "var(--glass-blur-low)",
                          boxShadow: "var(--glass-shadow)",
                        }}
                      >
                        {/* 통합: 아이콘 + 이름/파트 + 날씨상태 */}
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-[1.2rem] flex items-center justify-center shrink-0"
                            style={{ background: score !== null ? "var(--highlight-soft)" : "var(--surface-container)" }}
                          >
                            {score !== null
                              ? (() => { const Icon = WEATHER_ICON_MAP[scoreToStatus(score)]; return <Icon size={26} />; })()
                              : <span className="text-lg font-black" style={{ color: "var(--text-soft)" }}>{m.name.slice(0, 1)}</span>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-base tracking-tight leading-tight truncate">{m.name}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <p className="text-xs font-medium min-w-0 truncate" style={{ color: "var(--text-soft)" }}>
                                {score !== null
                                  ? <><span className="font-black" style={{ color: "var(--primary)" }}>{statusToKo(status)}</span> · {score}pt</>
                                  : (m.parts?.name ?? teams.find(t => t.id === m.team_id)?.name ?? "기록 없음")
                                }
                              </p>
                              {hasThought && (
                                <div
                                  className="relative shrink-0"
                                  onMouseEnter={() => setActiveThoughtId(m.id)}
                                >
                                  <motion.button
                                    type="button"
                                    className="flex h-8 items-center gap-1 rounded-full px-2.5 text-[11px] font-black tracking-tight"
                                    style={{
                                      background: activeThoughtId === m.id ? "var(--highlight-soft)" : "color-mix(in srgb, var(--primary) 10%, transparent)",
                                      color: "var(--primary)",
                                      boxShadow: activeThoughtId === m.id ? "var(--button-subtle-shadow)" : "none",
                                    }}
                                    animate={activeThoughtId === m.id ? { y: 0, scale: 1 } : { y: [0, -1.5, 0], scale: [1, 1.03, 1] }}
                                    transition={activeThoughtId === m.id
                                      ? { duration: 0.18 }
                                      : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                                    onTouchStart={() => beginThoughtPress(m.id)}
                                    onTouchEnd={endThoughtPress}
                                    onTouchCancel={endThoughtPress}
                                    onClick={() => toggleThought(m.id)}
                                    title="메시지 미리보기"
                                  >
                                    <ThoughtBubbleIcon />
                                    한마디
                                  </motion.button>
                                  <AnimatePresence>
                                    {activeThoughtId === m.id && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                        transition={STANDARD_SPRING}
                                        className="absolute left-0 top-full z-20 mt-2 w-52 rounded-[1.4rem] px-4 py-3"
                                        style={{
                                          background: "var(--surface-elevated)",
                                          backdropFilter: "var(--glass-blur-low)",
                                          WebkitBackdropFilter: "var(--glass-blur-low)",
                                          boxShadow: "var(--glass-shadow)",
                                        }}
                                      >
                                        <div
                                          className="absolute -top-2 left-5 h-4 w-4 rotate-45 rounded-[0.35rem]"
                                          style={{ background: "var(--surface-elevated)" }}
                                        />
                                        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--primary)" }}>
                                          Thought
                                        </p>
                                        <p className="text-xs font-medium leading-relaxed break-words" style={{ color: "var(--on-surface)" }}>
                                          {thought}
                                        </p>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}
                            </div>
                          </div>
                          <PortalSelect
                            compact
                            value={m.part_id ?? ""}
                            onChange={async (partId) => {
                              const matched = parts.find(p => p.id === partId) ?? null;
                              patchMember(m.id, { part_id: partId || null, parts: matched });
                              await supabase.from("users").update({ part_id: partId || null }).eq("id", m.id);
                            }}
                            options={parts.map(p => ({ value: p.id, label: p.name }))}
                          />
                        </div>

                        {/* 하단: 액션 */}
                        <div className="flex justify-between">
                          <button
                            type="button"
                            onClick={() => { setMoodTarget(m.id); setMoodScore(score ?? 50); setMoodMessage(latest?.message ?? ""); setMoodError(null); setMoodDuplicate(false); }}
                            className="flex w-12 h-12 items-center justify-center rounded-full shrink-0 transition-all active:scale-95"
                            style={{ background: "var(--button-primary-gradient)", color: "var(--on-primary)", boxShadow: "var(--button-primary-shadow)" }}
                            title="기록 입력"
                          >
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                            </svg>
                          </button>
                          <motion.button
                            type="button"
                            onClick={() => copyWithFeedback(`${window.location.origin}/input?token=${m.access_token}`, m.id, "member")}
                            animate={copiedId === m.id
                              ? { scale: [1, 1.2, 1], backgroundColor: "var(--highlight-soft)" }
                              : { scale: 1, backgroundColor: "var(--surface-container)" }
                            }
                            transition={{ duration: 0.3 }}
                            className="flex w-12 h-12 items-center justify-center rounded-full shrink-0"
                            style={{ color: copiedId === m.id ? "var(--primary)" : "var(--text-soft)" }}
                            title="입력 링크 복사"
                          >
                            <AnimatePresence mode="wait">
                              {copiedId === m.id ? (
                                <motion.svg key="check" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5"
                                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                </motion.svg>
                              ) : (
                                <motion.div key="link" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                                  <LinkIcon />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.button>
                          <Link
                            href={`/personal?user=${m.id}`}
                            className="flex w-12 h-12 items-center justify-center rounded-full shrink-0 transition-colors active:scale-95"
                            style={{ background: "var(--surface-container)", color: "var(--text-soft)" }}
                            title="개인 페이지 보기"
                          >
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <circle cx="12" cy="8" r="3.5" />
                              <path d="M4.5 20c0-4 3.358-7 7.5-7s7.5 3 7.5 7" strokeLinecap="round" />
                            </svg>
                          </Link>
                          {/* 초기화 버튼 — 확인 팝업은 위로 올라옴 */}
                          <div className="relative w-12 h-12 shrink-0">
                            <button
                              type="button"
                              onClick={() => { if (latest && isToday) setConfirmResetId(confirmResetId === m.id ? null : m.id); }}
                              className="flex w-12 h-12 items-center justify-center rounded-full transition-colors"
                              style={{
                                background: confirmResetId === m.id ? "color-mix(in srgb, #ed8936 22%, transparent)" : latest && isToday ? "color-mix(in srgb, #ed8936 14%, transparent)" : "var(--button-subtle-bg)",
                                color: latest && isToday ? "color-mix(in srgb, #ed8936 78%, var(--on-surface))" : "var(--text-soft)",
                                cursor: latest && isToday ? "pointer" : "default",
                              }}
                              title="오늘 기록 초기화"
                            >
                              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            <AnimatePresence>
                              {confirmResetId === m.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 6, scale: 0.9 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 rounded-2xl shadow-lg z-20"
                                  style={{ background: "var(--surface-container-highest)", boxShadow: "var(--glass-shadow)" }}
                                >
                                  <button type="button" onClick={() => { resetTodayMood(m.id); setConfirmResetId(null); }}
                                    className="flex w-10 h-10 items-center justify-center rounded-xl text-xs font-black"
                                    style={{ background: "color-mix(in srgb, #ed8936 16%, transparent)", color: "color-mix(in srgb, #ed8936 78%, var(--on-surface))" }}>✓</button>
                                  <button type="button" onClick={() => setConfirmResetId(null)}
                                    className="flex w-10 h-10 items-center justify-center rounded-xl text-sm"
                                    style={{ color: "var(--text-soft)", background: "var(--button-subtle-bg)" }}>✕</button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* 삭제 버튼 — 확인 팝업은 위로 올라옴 */}
                          <div className="relative w-12 h-12 shrink-0">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(confirmDeleteId === m.id ? null : m.id)}
                              className="flex w-12 h-12 items-center justify-center rounded-full transition-colors"
                              style={{
                                background: confirmDeleteId === m.id ? "var(--error-container)" : "color-mix(in srgb, var(--error) 12%, transparent)",
                                color: "var(--error)",
                              }}
                              title="삭제"
                            >
                              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" strokeLinecap="round" />
                                <path d="M10 11v6M14 11v6M9 6V4h6v2" strokeLinecap="round" />
                              </svg>
                            </button>
                            <AnimatePresence>
                              {confirmDeleteId === m.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 6, scale: 0.9 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 rounded-2xl shadow-lg z-20"
                                  style={{ background: "var(--surface-container-highest)", boxShadow: "var(--glass-shadow)" }}
                                >
                                  <button type="button" onClick={() => { deleteMember(m.id); setConfirmDeleteId(null); }}
                                    className="flex w-10 h-10 items-center justify-center rounded-xl text-xs font-black"
                                    style={{ background: "var(--error-container)", color: "var(--error)" }}>✓</button>
                                  <button type="button" onClick={() => setConfirmDeleteId(null)}
                                    className="flex w-10 h-10 items-center justify-center rounded-xl text-sm"
                                    style={{ color: "var(--text-soft)", background: "var(--button-subtle-bg)" }}>✕</button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </GlassCard>

          </>)}

          {activeTab === "teams" && (<>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Teams CRUD */}
              <GlassCard className="p-6 md:p-8" intensity="low">
                <SectionHeader
                  icon={<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}
                  title="팀 관리"
                  subtitle="팀을 추가하거나 삭제합니다"
                  className="mb-6"
                />
                <div className="flex gap-3 flex-wrap mb-6">
                  <ClimaInput
                    type="text"
                    placeholder="팀 이름"
                    value={newTeamName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeamName(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addTeam()}
                    className="font-bold flex-1 min-w-[160px]"
                  />
                  <ClimaButton
                    variant="secondary"
                    onClick={addTeam}
                    className="py-3 text-sm"
                    style={{ paddingInline: "1.5rem" }}
                  >
                    {addingTeam ? "추가 중..." : "팀 추가"}
                  </ClimaButton>
                </div>
                {teams.length === 0 ? (
                  <p className="text-sm font-bold py-2" style={{ color: "var(--text-soft)" }}>등록된 팀이 없어요.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {teams.map(t => (
                      <div
                        key={t.id}
                        className="flex items-center gap-4 rounded-[1.5rem] px-5 py-4"
                        style={{ background: "var(--surface-container-low)" }}
                      >
                        <div
                          className="w-9 h-9 rounded-[0.875rem] flex items-center justify-center shrink-0"
                          style={{ background: "var(--highlight-soft)", color: "var(--primary)" }}
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        </div>
                        <p className="font-bold text-base tracking-tight flex-1">{t.name}</p>
                        {confirmDeleteId === t.id ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => { deleteTeam(t.id); setConfirmDeleteId(null); }}
                              className="text-xs font-black px-3 py-1 rounded-full transition-opacity hover:opacity-80"
                              style={{ background: "var(--error-container)", color: "var(--error)" }}
                            >
                              확인
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs font-bold transition-opacity hover:opacity-60"
                              style={{ color: "var(--text-soft)" }}
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(t.id)}
                            className="text-xs font-bold shrink-0 transition-opacity hover:opacity-60"
                            style={{ color: "var(--text-soft)" }}
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

              {/* Parts CRUD */}
              <GlassCard className="p-6 md:p-8" intensity="low">
                <SectionHeader
                  icon={<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>}
                  title="파트 관리"
                  subtitle="팀 내 파트를 추가하거나 삭제합니다"
                  className="mb-6"
                />
                <div className="flex gap-3 flex-wrap mb-6">
                  <ClimaInput
                    type="text"
                    placeholder="파트 이름"
                    value={newPartName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPartName(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addPart()}
                    className="font-bold flex-1 min-w-[140px]"
                  />
                  <select
                    value={newPartTeamId}
                    onChange={(e) => setNewPartTeamId(e.target.value)}
                    className="flex-1 min-w-[140px] rounded-[1.5rem] px-4 py-3 text-sm font-semibold border-none outline-none appearance-none cursor-pointer"
                    style={{
                      background: "var(--surface-container-low)",
                      color: newPartTeamId ? "var(--on-surface)" : "var(--text-soft)",
                    }}
                  >
                    <option value="">팀 선택 (선택)</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <ClimaButton
                    variant="secondary"
                    onClick={addPart}
                    className="py-3 text-sm"
                    style={{ paddingInline: "1.5rem" }}
                  >
                    {addingPart ? "추가 중..." : "파트 추가"}
                  </ClimaButton>
                </div>
                {parts.length === 0 ? (
                  <p className="text-sm font-bold py-2" style={{ color: "var(--text-soft)" }}>등록된 파트가 없어요.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {parts.map(p => {
                      const teamName = teams.find(t => t.id === p.team_id)?.name;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center gap-4 rounded-[1.5rem] px-5 py-4"
                          style={{ background: "var(--surface-container-low)" }}
                        >
                          <div
                            className="w-9 h-9 rounded-[0.875rem] flex items-center justify-center shrink-0"
                            style={{ background: "var(--highlight-soft)", color: "var(--primary)" }}
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-base tracking-tight">{p.name}</p>
                            {teamName && (
                              <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-soft)" }}>{teamName}</p>
                            )}
                          </div>
                          {confirmDeleteId === p.id ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => { deletePart(p.id); setConfirmDeleteId(null); }}
                                className="text-xs font-black px-3 py-1 rounded-full transition-opacity hover:opacity-80"
                                style={{ background: "var(--error-container)", color: "var(--error)" }}
                              >
                                확인
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs font-bold transition-opacity hover:opacity-60"
                                style={{ color: "var(--text-soft)" }}
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(p.id)}
                              className="text-xs font-bold shrink-0 transition-opacity hover:opacity-60"
                              style={{ color: "var(--text-soft)" }}
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            </div>

            {/* 팀별 링크 */}
            {teams.length > 0 && (
              <GlassCard className="p-6 md:p-8" intensity="low">
                <SectionHeader
                  icon={<LinkIcon />}
                  title="팀별 접속 링크"
                  subtitle="팀 대시보드·니코니코 링크를 복사해서 공유하세요"
                  className="mb-6"
                />
                <div className="flex flex-col gap-3">
                  {teams.map(t => {
                    const origin = typeof window !== "undefined" ? window.location.origin : "";
                    const param = `?team=${t.id}`;
                    const dashUrl = `${origin}/dashboard${param}`;
                    const nikoUrl = `${origin}/niko${param}`;

                    const actions = [
                      { key: "dash", label: "Dashboard", href: dashUrl },
                      { key: "niko", label: "Niko-Niko", href: nikoUrl },
                    ];

                    return (
                      <div
                        key={t.id}
                        className="rounded-[1.5rem] px-5 py-4 flex flex-col gap-3"
                        style={{ background: "var(--surface-container-low)" }}
                      >
                        <p className="font-black text-sm tracking-tight" style={{ color: "var(--primary)" }}>{t.name}</p>
                        <div className="grid grid-cols-2 gap-3">
                          {actions.map((action) => (
                            <div
                              key={action.key}
                              className="rounded-[1.2rem] px-3 py-3"
                              style={{ background: "var(--surface-overlay)" }}
                            >
                              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>
                                {action.label}
                              </p>
                              <div className="mt-3 flex items-center justify-between gap-2">
                                <p className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>
                                  팀 전용 링크
                                </p>
                                <div className="flex items-center gap-2 shrink-0">
                                  <motion.button
                                    type="button"
                                    title={`${action.label} 링크 복사`}
                                    onClick={() => copyWithFeedback(action.href, `${t.id}-${action.key}`, "link")}
                                    animate={copiedLinkKey === `${t.id}-${action.key}`
                                      ? { scale: [1, 1.2, 1], backgroundColor: "var(--highlight-soft)" }
                                      : { scale: 1, backgroundColor: "var(--surface-container)" }
                                    }
                                    transition={{ duration: 0.3 }}
                                    className="flex w-12 h-12 items-center justify-center rounded-full shrink-0"
                                    style={{ color: copiedLinkKey === `${t.id}-${action.key}` ? "var(--primary)" : "var(--text-soft)" }}
                                  >
                                    <AnimatePresence mode="wait">
                                      {copiedLinkKey === `${t.id}-${action.key}` ? (
                                        <motion.svg
                                          key="check"
                                          viewBox="0 0 24 24"
                                          className="w-5 h-5"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2.5"
                                          initial={{ scale: 0, opacity: 0 }}
                                          animate={{ scale: 1, opacity: 1 }}
                                          exit={{ scale: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                        >
                                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                        </motion.svg>
                                      ) : (
                                        <motion.div
                                          key="copy"
                                          initial={{ scale: 0, opacity: 0 }}
                                          animate={{ scale: 1, opacity: 1 }}
                                          exit={{ scale: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                        >
                                          <CopyIcon />
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </motion.button>
                                  <Link
                                    href={action.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={`${action.label} 새 탭 열기`}
                                    className="flex w-12 h-12 items-center justify-center rounded-full shrink-0 transition-colors active:scale-95"
                                    style={{ background: "var(--surface-container)", color: "var(--text-soft)" }}
                                  >
                                    <ExternalLinkIcon />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}
          </>)}
        </motion.main>
      </div>

      {/* ── Mood 입력 모달 ── */}
      <AnimatePresence>
        {moodTarget && (() => {
          const targetMember = members.find(m => m.id === moodTarget);
          const currentMetaphor = currentMetaphorFromScore(moodScore);
          const CurrentIcon = WEATHER_ICON_MAP[currentMetaphor.label];
          return (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMoodTarget(null)}
                className="fixed inset-0 z-40"
                style={{ background: "var(--drawer-scrim)", backdropFilter: "blur(8px)" }}
              />
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={STANDARD_SPRING}
                className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 rounded-[2.5rem] p-8 max-w-sm mx-auto flex flex-col items-center gap-5"
                style={{ background: "var(--surface-lowest)", boxShadow: "var(--glass-shadow)" }}
              >
                {/* 날씨 아이콘 */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentMetaphor.label}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={STANDARD_SPRING}
                  >
                    <CurrentIcon size={72} />
                  </motion.div>
                </AnimatePresence>

                {/* 이름 + 상태 */}
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "var(--text-soft)" }}>
                    {targetMember?.name}의 오늘 기후
                  </p>
                  <h3 className="text-2xl font-black tracking-tight" style={{ color: "var(--primary)" }}>
                    {currentMetaphor.ko}
                  </h3>
                </div>

                {/* 모드 토글 */}
                <PrimaryTabToggle
                  tabs={[
                    { value: "tile" as const, label: "Quick" },
                    { value: "range" as const, label: "Precise" },
                  ]}
                  active={moodMode}
                  onChange={setMoodMode}
                />

                {/* 입력 영역 */}
                <AnimatePresence mode="wait">
                  {moodMode === "tile" ? (
                    <motion.div
                      key="tile"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={STANDARD_SPRING}
                      className="w-full"
                    >
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {WEATHER_METAPHORS.slice(0, 3).map((m) => (
                          <WeatherTile
                            key={m.label}
                            Icon={WEATHER_ICON_MAP[m.label]}
                            label={m.ko}
                            isSelected={currentMetaphor.label === m.label}
                            onClick={() => setMoodScore(m.score)}
                          />
                        ))}
                      </div>
                      <div className="flex justify-center gap-2">
                        {WEATHER_METAPHORS.slice(3).map((m) => (
                          <div key={m.label} className="w-[calc(33.333%-0.375rem)]">
                            <WeatherTile
                              Icon={WEATHER_ICON_MAP[m.label]}
                              label={m.ko}
                              isSelected={currentMetaphor.label === m.label}
                              onClick={() => setMoodScore(m.score)}
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="range"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={STANDARD_SPRING}
                      className="w-full flex flex-col gap-3"
                    >
                      <input
                        type="range" min="0" max="100" value={moodScore}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMoodScore(Number(e.target.value))}
                        className="w-full accent-primary"
                      />
                      <div className="flex justify-between text-xs font-black opacity-40">
                        <span>번개</span>
                        <span style={{ color: "var(--primary)", opacity: 1 }}>{moodScore}점</span>
                        <span>쨍함</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 메시지 */}
                <ClimaTextarea
                  placeholder="한마디 (선택)"
                  value={moodMessage}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMoodMessage(e.target.value)}
                  className="w-full"
                />

                {/* 에러 / 중복 피드백 */}
                {moodError && (
                  <p className="w-full text-center text-sm font-bold rounded-2xl px-4 py-3"
                    style={{ background: "color-mix(in srgb, var(--error) 12%, transparent)", color: "var(--error)" }}>
                    {moodError}
                  </p>
                )}
                {moodDuplicate && (
                  <div className="w-full rounded-2xl px-4 py-4 flex flex-col gap-3 text-center"
                    style={{ background: "color-mix(in srgb, #ff9900 12%, transparent)" }}>
                    <p className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>
                      오늘 이미 기록이 있어요.<br />현재 점수로 덮어쓸까요?
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={overwriteMood}
                        disabled={submitting}
                        className="px-5 py-2 rounded-full text-white font-black text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
                        style={{ background: "var(--primary)" }}
                      >
                        {submitting ? "저장 중..." : "덮어쓰기"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMoodDuplicate(false)}
                        className="px-5 py-2 rounded-full font-bold text-sm"
                        style={{ color: "var(--text-soft)", background: "var(--button-subtle-bg)" }}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}

                {/* 버튼 */}
                {!moodDuplicate && (
                  <div className="flex gap-3 w-full">
                    <ClimaButton
                      onClick={submitMood}
                      variant="primary"
                      className="flex-1 py-4 text-sm"
                    >
                      {submitting ? "저장 중..." : "기록하기"}
                    </ClimaButton>
                    <ClimaButton
                      variant="tertiary"
                      onClick={() => setMoodTarget(null)}
                      className="py-4 text-sm"
                      style={{ paddingInline: "1.5rem" }}
                    >
                      취소
                    </ClimaButton>
                  </div>
                )}
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
