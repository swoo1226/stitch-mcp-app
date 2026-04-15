"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, DEFAULT_TEAM_ID } from "../../lib/supabase";
import { getAdminSession, isSuperAdmin, type AdminSession } from "../../lib/admin-auth";
import { scoreToStatus, statusToKo } from "../../lib/mood";
import { STANDARD_SPRING } from "../constants/springs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import AdminBottomNav from "../components/AdminBottomNav";
import AdminSectionHeader from "../components/AdminSectionHeader";
import { BottomSheet, BottomSheetOverlay } from "../components/BottomSheet";
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
  MarkdownRenderer,
  UserAvatar,
} from "../components/ui";
import { WEATHER_ICON_MAP } from "../components/WeatherIcons";
import { displayName as getDisplayName } from "../../lib/user";


const WEATHER_METAPHORS = [
  { score: 10, label: "Stormy", ko: "뇌우" },
  { score: 30, label: "Rainy", ko: "비" },
  { score: 50, label: "Cloudy", ko: "흐림" },
  { score: 70, label: "PartlyCloudy", ko: "구름조금" },
  { score: 90, label: "Sunny", ko: "맑음" },
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
  nickname: string | null;
  email: string | null;
  jira_account_id: string | null;
  avatar_emoji: string;
  access_token: string;
  team_id: string | null;
  part_id: string | null;
  parts: Part | null;
  mood_logs: MoodLog[];
}

interface JiraTicketPreview {
  key: string;
  summary: string;
  status: string;
  priority: string | null;
  updated: string | null;
  browseUrl: string;
}

interface JiraTicketSnapshot {
  userId: string;
  openTicketCount: number;
  tickets: JiraTicketPreview[];
  syncedAt: string | null;
}

interface CombinedRiskTarget {
  userId: string;
  name: string;
  teamName: string;
  partName: string | null;
  todayScore: number;
  recentDelta: number | null;
  openTicketCount: number;
  blockerCount: number;
  tickets: JiraTicketPreview[];
  level: "critical" | "warning";
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

function ExternalLinkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size }} fill="none" stroke="currentColor" strokeWidth="1.8">
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

function ThoughtTooltip({
  anchorRect,
  content,
}: {
  anchorRect: DOMRect;
  content: string;
}) {
  const tooltipWidth = Math.min(280, window.innerWidth - 24);
  const maxHeight = Math.min(240, window.innerHeight - 48);
  const left = Math.max(12, Math.min(anchorRect.left, window.innerWidth - tooltipWidth - 12));
  const showAbove = anchorRect.bottom + 12 + maxHeight > window.innerHeight - 12;
  const top = showAbove
    ? Math.max(12, anchorRect.top - maxHeight - 16)
    : Math.min(window.innerHeight - maxHeight - 12, anchorRect.bottom + 12);
  const arrowLeft = Math.max(20, Math.min(anchorRect.left + anchorRect.width / 2 - left, tooltipWidth - 20));

  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: showAbove ? 6 : -6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: showAbove ? 4 : -4, scale: 0.97 }}
      transition={STANDARD_SPRING}
      className="fixed z-[120] rounded-[1.5rem] px-4 py-3"
      style={{
        top,
        left,
        width: tooltipWidth,
        maxHeight,
        background: "var(--surface-elevated)",
        backdropFilter: "var(--glass-blur-low)",
        WebkitBackdropFilter: "var(--glass-blur-low)",
        boxShadow: "var(--glass-shadow)",
      }}
    >
      <div
        className={`absolute h-4 w-4 rotate-45 rounded-[0.35rem] ${showAbove ? "-bottom-2" : "-top-2"}`}
        style={{
          left: arrowLeft - 8,
          background: "var(--surface-elevated)",
        }}
      />
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--primary)" }}>
        한마디
      </p>
      <div className="overflow-y-auto pr-1" style={{ maxHeight: maxHeight - 40 }}>
        <MarkdownRenderer content={content} color="var(--on-surface)" />
      </div>
    </motion.div>,
    document.body,
  );
}


interface Team {
  id: string;
  name: string;
  jira_project_keys: string[] | null;
}

export default function AdminPageClient({
  role,
  initialTab = "members",
  initialData,
}: {
  role?: string;
  initialTab?: "members" | "teams";
  initialData?: {
    members: Member[];
    teams: Team[];
    parts: Part[];
    session: AdminSession | null;
  };
}) {
  const [authed, setAuthed] = useState(!!initialData?.session);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(initialData?.session ?? null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  // 탭: "members" | "teams"
  const activeTab = initialTab;

  // ── 삭제 재확인
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── 기록 초기화 재확인
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);

  // ── 링크 복사 피드백
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLinkKey, setCopiedLinkKey] = useState<string | null>(null);
  const [activeThoughtId, setActiveThoughtId] = useState<string | null>(null);
  const [activeThoughtRect, setActiveThoughtRect] = useState<DOMRect | null>(null);

  // ── 모바일 바텀시트 상태
  const [detailMember, setDetailMember] = useState<Member | null>(null);
  const [managementSheet, setManagementSheet] = useState<"none" | "add" | "invite" | "jira">("none");

  const thoughtPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thoughtLongPressTriggeredRef = useRef(false);
  const jiraSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const carouselDrag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const router = useRouter();
  const [isPWA, setIsPWA] = useState(false);
  useEffect(() => {
    setIsPWA(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

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

  function openThought(id: string, rect: DOMRect) {
    setActiveThoughtId(id);
    setActiveThoughtRect(rect);
  }

  function closeThought() {
    setActiveThoughtId(null);
    setActiveThoughtRect(null);
  }

  function beginThoughtPress(id: string, rect: DOMRect) {
    clearThoughtPressTimer();
    thoughtLongPressTriggeredRef.current = false;
    thoughtPressTimerRef.current = setTimeout(() => {
      thoughtLongPressTriggeredRef.current = true;
      openThought(id, rect);
    }, 380);
  }

  function endThoughtPress() {
    clearThoughtPressTimer();
  }

  function toggleThought(id: string, rect: DOMRect) {
    if (thoughtLongPressTriggeredRef.current) {
      thoughtLongPressTriggeredRef.current = false;
      return;
    }
    if (activeThoughtId === id) {
      closeThought();
      return;
    }
    openThought(id, rect);
  }

  useEffect(() => {
    if (!activeThoughtId) return;
    function dismiss() {
      closeThought();
    }
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", dismiss, true);
    return () => {
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("scroll", dismiss, true);
    };
  }, [activeThoughtId]);

  // ── 팀원 관리 상태
  const [members, setMembers] = useState<Member[]>(initialData?.members ?? []);
  const [parts, setParts] = useState<Part[]>(initialData?.parts ?? []);
  const [teams, setTeams] = useState<Team[]>(initialData?.teams ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [jiraSnapshots, setJiraSnapshots] = useState<Record<string, JiraTicketSnapshot>>({});
  const [jiraLoading, setJiraLoading] = useState(false);
  const [jiraError, setJiraError] = useState<string | null>(null);
  const [jiraLastSource, setJiraLastSource] = useState<string | null>(null);
  const jiraLastRefreshRef = useRef<number>(0);
  const JIRA_RATE_LIMIT_MS = 30_000;
  const [riskTargets, setRiskTargets] = useState<CombinedRiskTarget[]>([]);
  const [riskPanelOpen, setRiskPanelOpen] = useState(false);
  const [loadingRiskTargets, setLoadingRiskTargets] = useState(false);
  const [sendingTeamsAlert, setSendingTeamsAlert] = useState(false);
  const [teamsAlertMessage, setTeamsAlertMessage] = useState<string | null>(null);
  const [memberAddOpen, setMemberAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newTeamId, setNewTeamId] = useState<string>("");
  const [newPartId, setNewPartId] = useState<string>("");
  const [adding, setAdding] = useState(false);

  // ── Jira 팀원 가져오기
  const [jiraUsers, setJiraUsers] = useState<{ accountId: string; displayName: string; emailAddress: string | null }[]>([]);
  const [jiraUsersLoading, setJiraUsersLoading] = useState(false);
  const [jiraUsersError, setJiraUsersError] = useState<string | null>(null);
  const [jiraSelected, setJiraSelected] = useState<Set<string>>(new Set());
  const [jiraImporting, setJiraImporting] = useState(false);
  const [jiraOpen, setJiraOpen] = useState(false);
  const [jiraQuery, setJiraQuery] = useState("");

  // ── 기분 기록 모달
  const [moodTarget, setMoodTarget] = useState<string | null>(null);
  const [moodScore, setMoodScore] = useState(60);
  const [moodMessage, setMoodMessage] = useState("");
  const [moodMode, setMoodMode] = useState<"tile" | "range">("tile");
  const [submitting, setSubmitting] = useState(false);
  const [moodError, setMoodError] = useState<string | null>(null);
  const [moodDuplicate, setMoodDuplicate] = useState(false);

  // ── 팀 CRUD 상태
  const [teamManageOpen, setTeamManageOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [addingTeam, setAddingTeam] = useState(false);
  const [jiraKeyInputs, setJiraKeyInputs] = useState<Record<string, string>>({}); // teamId → 입력 중인 키
  const [savingJiraKeys, setSavingJiraKeys] = useState<Record<string, boolean>>({}); // teamId → 저장 중

  // ── 파트 CRUD 상태
  const [partManageOpen, setPartManageOpen] = useState(false);
  const [newPartName, setNewPartName] = useState("");
  const [newPartTeamId, setNewPartTeamId] = useState<string>("");
  const [addingPart, setAddingPart] = useState(false);

  // ── 팀장 초대 (super_admin 전용)
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteWorkEmail, setInviteWorkEmail] = useState("");
  const [inviteTeamId, setInviteTeamId] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ ok: boolean; message: string } | null>(null);

  // ── 팀원 초대 (team_admin + super_admin)
  const [memberInviteEmail, setMemberInviteEmail] = useState("");
  const [memberInviteName, setMemberInviteName] = useState("");
  const [memberInviteTeamId, setMemberInviteTeamId] = useState("");
  const [memberInvitePartId, setMemberInvitePartId] = useState("");
  const [memberInviting, setMemberInviting] = useState(false);
  const [memberInviteResult, setMemberInviteResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileViewport(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthed(true);
        setAccessToken(session.access_token);
        getAdminSession().then(setAdminSession);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
      setAccessToken(session?.access_token ?? null);
      if (session) {
        getAdminSession().then(setAdminSession);
      } else {
        setAdminSession(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authed) {
      fetchAll();
    }
  }, [authed]);

  // team_admin인 경우 팀 선택을 자동 고정
  useEffect(() => {
    if (adminSession && !isSuperAdmin(adminSession) && adminSession.managedTeamId) {
      setNewTeamId(adminSession.managedTeamId);
      setMemberInviteTeamId(adminSession.managedTeamId);
    }
  }, [adminSession]);

  useEffect(() => {
    if (!authed || activeTab !== "members") return;
    fetchJiraSnapshots(false);
  }, [authed, activeTab, members]);

  async function fetchAll() {
    await Promise.all([fetchTeams(), fetchParts(), fetchMembers()]);
  }

  async function fetchTeams() {
    const { data } = await supabase.from("teams").select("id, name, jira_project_keys").order("name");
    setTeams((data as Team[]) ?? []);
  }

  async function fetchParts() {
    const { data } = await supabase.from("parts").select("id, name, team_id").order("name");
    setParts((data as Part[]) ?? []);
  }

  async function fetchMembers() {
    setLoading(true);
    const session = adminSession ?? await getAdminSession();
    let query = supabase
      .from("users")
      .select(`id, name, nickname, email, jira_account_id, avatar_emoji, access_token, part_id, team_id, parts (id, name), mood_logs (score, message, logged_at)`)
      .order("logged_at", { referencedTable: "mood_logs", ascending: false });
    if (session && !isSuperAdmin(session) && session.managedTeamId) {
      query = query.eq("team_id", session.managedTeamId);
    }
    const { data } = await query;
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

  function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
    return {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...extra,
    };
  }

  async function fetchJiraSnapshots(forceRefresh = false) {
    if (forceRefresh) {
      const now = Date.now();
      if (now - jiraLastRefreshRef.current < JIRA_RATE_LIMIT_MS) {
        const remaining = Math.ceil((JIRA_RATE_LIMIT_MS - (now - jiraLastRefreshRef.current)) / 1000);
        setJiraError(`너무 자주 요청하고 있어요. ${remaining}초 후에 다시 시도해주세요.`);
        return;
      }
      jiraLastRefreshRef.current = now;
    }
    setJiraLoading(true);
    setJiraError(null);
    try {
      // 현재 멤버가 속한 팀들의 Jira 프로젝트 키 수집
      const teamIdSet = new Set(members.map((m) => m.team_id).filter(Boolean));
      const projectKeys = Array.from(
        new Set(
          teams
            .filter((t) => teamIdSet.has(t.id))
            .flatMap((t) => t.jira_project_keys ?? []),
        ),
      );

      const url = forceRefresh
        ? "/api/admin/jira/open-tickets?refresh=1"
        : "/api/admin/jira/open-tickets";
      const response = await fetch(url, {
        method: "POST",
        cache: "no-store",
        headers: authHeaders(),
        body: JSON.stringify({
          members: members.map((member) => ({
            userId: member.id,
            name: member.name,
            teamId: member.team_id ?? null,
            jiraAccountId: member.jira_account_id ?? null,
          })),
          projectKeys: projectKeys.length > 0 ? projectKeys : null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Jira 티켓 정보를 불러오지 못했어요.");
      }

      const nextSnapshots = Object.fromEntries(
        ((payload.snapshots ?? []) as JiraTicketSnapshot[]).map((snapshot) => [snapshot.userId, snapshot]),
      );
      setJiraSnapshots(nextSnapshots);
      setJiraLastSource(payload.source ?? null);
    } catch (error) {
      setJiraError(error instanceof Error ? error.message : "Jira 티켓 정보를 불러오지 못했어요.");
    } finally {
      setJiraLoading(false);
    }
  }

  async function fetchCombinedRiskTargets() {
    setLoadingRiskTargets(true);
    setTeamsAlertMessage(null);
    try {
      const response = await fetch("/api/admin/alerts/combined-risk", {
        method: "POST",
        cache: "no-store",
        headers: authHeaders(),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Teams 알림 전송에 실패했어요.");
      }

      setRiskTargets((payload.targets ?? []) as CombinedRiskTarget[]);
      setRiskPanelOpen(true);

      if (!payload.sent && payload.reason === "no_targets") {
        setTeamsAlertMessage("현재 규칙에 걸리는 팀원이 없어 알림을 보내지 않았어요.");
      } else if (!payload.sent && payload.reason === "no_eligible_users") {
        setTeamsAlertMessage("Jira 계정이 연결된 팀원이 없어 알림을 보내지 않았어요.");
      } else if (!payload.sent) {
        setTeamsAlertMessage("현재 규칙 기준 결과를 불러왔어요.");
      }
    } catch (error) {
      setTeamsAlertMessage(error instanceof Error ? error.message : "주의 필요 팀원을 불러오지 못했어요.");
    } finally {
      setLoadingRiskTargets(false);
    }
  }

  async function sendCombinedRiskAlert() {
    setSendingTeamsAlert(true);
    setTeamsAlertMessage(null);
    try {
      const response = await fetch("/api/admin/alerts/combined-risk?send=1", {
        method: "POST",
        cache: "no-store",
        headers: authHeaders(),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Teams 알림 전송에 실패했어요.");
      }

      setRiskTargets((payload.targets ?? []) as CombinedRiskTarget[]);
      if (!payload.sent) {
        if (payload.reason === "no_targets") {
          setTeamsAlertMessage("현재 규칙에 걸리는 팀원이 없어 알림을 보내지 않았어요.");
        } else if (payload.reason === "no_eligible_users") {
          setTeamsAlertMessage("Jira 계정이 연결된 팀원이 없어 알림을 보내지 않았어요.");
        } else {
          setTeamsAlertMessage("알림을 보내지 않았어요.");
        }
        return;
      }

      setTeamsAlertMessage(`Teams 채널에 combined risk 알림을 전송했어요. 대상 ${payload.targetCount}명.`);
    } catch (error) {
      setTeamsAlertMessage(error instanceof Error ? error.message : "Teams 알림 전송에 실패했어요.");
    } finally {
      setSendingTeamsAlert(false);
    }
  }

  async function addMember() {
    if (!newName.trim() || !newEmail.trim() || adding) return;
    setAdding(true);
    const effectiveTeamId = (!isSuperAdmin(adminSession) && adminSession?.managedTeamId)
      ? adminSession.managedTeamId
      : (newTeamId || DEFAULT_TEAM_ID);
    await supabase.from("users").insert({
      team_id: effectiveTeamId,
      name: newName.trim(),
      email: newEmail.trim(),
      part_id: newPartId || null,
    });
    setNewName("");
    setNewEmail("");
    setNewTeamId("");
    setNewPartId("");
    await fetchMembers();
    setAdding(false);
  }

  async function searchJiraUsers(q: string) {
    if (!q.trim()) { setJiraUsers([]); return; }
    setJiraUsersLoading(true);
    setJiraUsersError(null);
    try {
      const res = await fetch(`/api/admin/jira/users?q=${encodeURIComponent(q)}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Jira 연결 실패");
      const existingEmails = new Set(members.map((m) => m.email?.toLowerCase()).filter(Boolean));
      setJiraUsers((data.users ?? []).filter((u: { emailAddress: string | null }) => !existingEmails.has(u.emailAddress?.toLowerCase() ?? "")));
    } catch (e) {
      setJiraUsersError(e instanceof Error ? e.message : "알 수 없는 오류");
    }
    setJiraUsersLoading(false);
  }

  async function importJiraSelected() {
    if (jiraSelected.size === 0 || jiraImporting) return;
    setJiraImporting(true);
    const effectiveTeamId = (!isSuperAdmin(adminSession) && adminSession?.managedTeamId)
      ? adminSession.managedTeamId
      : (newTeamId || DEFAULT_TEAM_ID);
    const toImport = jiraUsers.filter((u) => jiraSelected.has(u.accountId));
    await Promise.all(
      toImport.map((u) =>
        supabase.from("users").insert({
          team_id: effectiveTeamId,
          name: u.displayName,
          email: u.emailAddress,
          jira_account_id: u.accountId,
          part_id: newPartId || null,
        })
      )
    );
    setJiraSelected(new Set());
    setJiraOpen(false);
    await fetchMembers();
    setJiraImporting(false);
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
    const endOfDay = `${todayKST}T23:59:59+09:00`;
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

  async function addJiraKey(teamId: string) {
    const key = (jiraKeyInputs[teamId] ?? "").trim().toUpperCase();
    if (!key) return;
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;
    const currentKeys = team.jira_project_keys ?? [];
    if (currentKeys.includes(key)) {
      setJiraKeyInputs((prev) => ({ ...prev, [teamId]: "" }));
      return;
    }
    setSavingJiraKeys((prev) => ({ ...prev, [teamId]: true }));
    const nextKeys = [...currentKeys, key];
    await supabase.from("teams").update({ jira_project_keys: nextKeys }).eq("id", teamId);
    setJiraKeyInputs((prev) => ({ ...prev, [teamId]: "" }));
    await fetchTeams();
    setSavingJiraKeys((prev) => ({ ...prev, [teamId]: false }));
  }

  async function removeJiraKey(teamId: string, key: string) {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;
    const nextKeys = (team.jira_project_keys ?? []).filter((k) => k !== key);
    await supabase.from("teams").update({ jira_project_keys: nextKeys }).eq("id", teamId);
    await fetchTeams();
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

  async function inviteMember() {
    if (!memberInviteEmail.trim() || !memberInviteName.trim() || !memberInviteTeamId || memberInviting) return;
    setMemberInviting(true);
    setMemberInviteResult(null);
    const res = await fetch("/api/admin/invite-member", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        email: memberInviteEmail.trim(),
        name: memberInviteName.trim(),
        teamId: memberInviteTeamId,
        partId: memberInvitePartId || null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMemberInviteResult({ ok: true, message: `${memberInviteName.trim()}님에게 초대 이메일을 발송했습니다.` });
      setMemberInviteEmail("");
      setMemberInviteName("");
      setMemberInviteTeamId("");
      setMemberInvitePartId("");
      await fetchMembers();
    } else {
      setMemberInviteResult({ ok: false, message: data.error ?? "초대 발송 실패" });
    }
    setMemberInviting(false);
  }

  async function inviteTeamAdmin() {
    if (!inviteEmail.trim() || !inviteTeamId || inviting) return;
    setInviting(true);
    setInviteResult(null);
    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        email: inviteEmail.trim(),
        workEmail: inviteWorkEmail.trim() || null,
        teamId: inviteTeamId,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setInviteResult({ ok: true, message: `${inviteEmail.trim()}에게 초대 이메일을 발송했습니다.` });
      setInviteEmail("");
      setInviteWorkEmail("");
      setInviteTeamId("");
    } else {
      setInviteResult({ ok: false, message: data.error ?? "초대 발송 실패" });
    }
    setInviting(false);
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
              Clima 관리자
            </h1>
            <p className="text-sm font-medium mb-10" style={{ color: "var(--on-surface-variant)" }}>
              팀 날씨 시스템 관리
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
                {signingIn ? "로그인 중…" : "로그인 →"}
              </ClimaButton>
            </div>

            {/* 하단 메타 */}
            <p className="mt-8 text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-soft)" }}>
              구역: Horizon-01 &nbsp;·&nbsp; v4.2.0
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

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--surface)" }}>
      <AdminSectionHeader
        current="admin"
        role={role === "super_admin" ? "super_admin" : "team_admin"}
        activeAdminTab={activeTab}
        showLogout
        onLogout={signOut}
      />

      {/* 캔버스 */}
      <div className="flex flex-col min-h-screen overflow-y-auto overflow-x-hidden">
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...STANDARD_SPRING, delay: 0.05 }}
          className="pt-20 px-4 pb-28 md:pb-12 md:px-8 flex flex-col gap-6 md:gap-8 w-full max-w-2xl md:max-w-none mx-auto"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-black tracking-tight md:text-base" style={{ color: "var(--primary)" }}>
              {activeTab === "members" ? "팀원 관리" : "팀 · 파트 관리"}
            </div>
            {activeTab === "members" && (
              <div className="flex items-center gap-2" />
            )}
          </div>
          {teamsAlertMessage && (
            <div
              className="rounded-[1.5rem] px-4 py-3 text-sm font-semibold"
              style={{
                background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                color: teamsAlertMessage.includes("실패") || teamsAlertMessage.includes("Missing") || teamsAlertMessage.includes("failed")
                  ? "var(--tertiary)"
                  : "var(--on-surface)",
              }}
            >
              {teamsAlertMessage}
            </div>
          )}
          {riskPanelOpen && (
            <GlassCard className="p-5 md:p-6" intensity="low">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black tracking-tight" style={{ color: "var(--primary)" }}>
                    주의 필요 팀원
                  </p>
                  <p className="mt-1 text-sm font-medium" style={{ color: "var(--on-surface-variant)" }}>
                    오늘 점수 50점 이하이면서 미완료 5건 이상 또는 blocker 1건 이상인 팀원입니다.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ClimaButton
                    variant="secondary"
                    onClick={sendCombinedRiskAlert}
                    disabled={sendingTeamsAlert || riskTargets.length === 0}
                    className="px-4 py-2.5 text-xs font-black"
                  >
                    {sendingTeamsAlert ? "Teams 전송 중..." : "Teams로 전송"}
                  </ClimaButton>
                  <button
                    type="button"
                    onClick={() => setRiskPanelOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}
                    title="닫기"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {riskTargets.length === 0 ? (
                  <div
                    className="rounded-[1.5rem] px-4 py-4 text-sm font-semibold"
                    style={{ background: "var(--surface-overlay)", color: "var(--on-surface-variant)" }}
                  >
                    현재 규칙에 걸리는 팀원이 없습니다.
                  </div>
                ) : (
                  riskTargets.map((target) => (
                    <div
                      key={target.userId}
                      className="rounded-[1.5rem] px-4 py-4"
                      style={{
                        background: target.level === "critical"
                          ? "color-mix(in srgb, var(--tertiary) 12%, transparent)"
                          : "color-mix(in srgb, var(--surface-container) 78%, transparent)",
                      }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="rounded-full px-2.5 py-1 text-[11px] font-black tracking-[0.08em]"
                              style={{
                                background: target.level === "critical"
                                  ? "color-mix(in srgb, var(--tertiary) 18%, transparent)"
                                  : "color-mix(in srgb, var(--primary) 12%, transparent)",
                                color: target.level === "critical" ? "var(--tertiary)" : "var(--primary)",
                              }}
                            >
                              {target.level === "critical" ? "CRITICAL" : "WARNING"}
                            </span>
                            <p className="text-sm font-black tracking-tight" style={{ color: "var(--on-surface)" }}>
                              {target.name}
                            </p>
                          </div>
                          <p className="mt-2 text-sm font-medium" style={{ color: "var(--on-surface-variant)" }}>
                            {target.teamName}{target.partName ? ` · ${target.partName}` : ""}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold" style={{ color: "var(--on-surface)" }}>
                          <div>오늘 점수 {target.todayScore}pt</div>
                          <div>미완료 {target.openTicketCount}건</div>
                          <div>
                            최근 3일 {target.recentDelta == null ? "데이터 없음" : `${target.recentDelta > 0 ? "+" : ""}${target.recentDelta}pt`}
                          </div>
                          <div>Blocker {target.blockerCount}건</div>
                        </div>
                      </div>
                      {target.tickets.length > 0 && (
                        <div className="mt-3 flex flex-col gap-2">
                          {target.tickets.map((ticket) => (
                            <a
                              key={ticket.key}
                              href={ticket.browseUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-[1.5rem] px-3 py-2 text-xs font-semibold transition-colors"
                              style={{ background: "var(--surface-elevated)", color: "var(--on-surface)" }}
                            >
                              {ticket.key} · {ticket.summary}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          )}

          {activeTab === "members" && (<>
            {/* 1. 요약 Bento Grid */}
            <section
              className="flex flex-wrap items-center gap-2 rounded-[1.5rem] px-3 py-2.5 md:px-4"
              style={{ background: "var(--surface-overlay)", boxShadow: "var(--button-subtle-shadow)" }}
            >
              <div
                className="rounded-full px-3 py-1.5 text-xs font-black tracking-tight"
                style={{ background: "var(--surface-container-low)", color: "var(--on-surface)" }}
              >
                전체 팀원 {loading ? "—" : members.length}
              </div>
              <div
                className="rounded-full px-3 py-1.5 text-xs font-black tracking-tight"
                style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}
              >
                오늘 체크인 {loading ? "—" : `${checkedInToday} / ${members.length}`}
              </div>
              <div
                className="min-w-0 flex-1 px-1 text-xs font-bold tracking-tight"
                style={{
                  color: !loading && members.length > 0 && checkedInToday < members.length
                    ? "var(--error)"
                    : "var(--on-surface-variant)",
                }}
              >
                {loading
                  ? "데이터를 불러오는 중..."
                  : members.length === 0
                    ? "아직 팀원이 없어요."
                    : checkedInToday === members.length
                      ? "모든 팀원이 오늘 체크인했어요."
                      : `${members.length - checkedInToday}명이 아직 오늘 기록을 남기지 않았어요.`
                }
              </div>
            </section>

            {/* 2. 팀원 목록 */}
            <GlassCard className="p-6 md:p-8" intensity="low">
              <div className="flex items-center justify-between mb-4">
                <SectionHeader icon={<UsersIcon />} title="팀원 목록" />
                {!loading && members.length > 0 && (
                  <Badge variant="primary" className="shrink-0">총 {members.length}명</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mb-4">
                {jiraError && (
                  <Badge variant="tertiary">Jira 조회 오류</Badge>
                )}
                <button
                  type="button"
                  onClick={() => fetchJiraSnapshots(true)}
                  disabled={jiraLoading}
                  className="flex items-center gap-1.5 rounded-full px-2.5 h-7 transition-colors hover:bg-surface-low disabled:opacity-40"
                  style={{ color: "var(--text-soft)", background: "var(--surface-overlay)" }}
                  title="Jira 티켓 동기화"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-3.5 w-3.5 shrink-0 ${jiraLoading ? "animate-spin [animation-direction:reverse]" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ color: "var(--primary)" }}
                  >
                    <path d="M1 4v6h6M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[10px] font-bold leading-none">
                    {(() => {
                      const firstSynced = Object.values(jiraSnapshots).find((s) => s.syncedAt)?.syncedAt;
                      const timeLabel = firstSynced
                        ? new Date(firstSynced).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
                        : null;
                      return timeLabel ? `Jira · ${timeLabel}` : "Jira 동기화";
                    })()}
                  </span>
                </button>
              </div>
              {loading ? (
                <p className="text-sm font-bold py-4" style={{ color: "var(--text-soft)" }}>불러오는 중...</p>
              ) : members.length === 0 ? (
                <p className="text-sm font-bold py-4" style={{ color: "var(--text-soft)" }}>팀원이 없어요.</p>
              ) : (
                <>
                  <div
                    ref={carouselRef}
                    className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1"
                    style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", msOverflowStyle: "none", scrollbarWidth: "none", cursor: carouselDrag.current.active ? "grabbing" : "grab" }}
                    onMouseDown={(e) => {
                      if (!carouselRef.current) return;
                      carouselDrag.current = { active: true, moved: false, startX: e.pageX - carouselRef.current.offsetLeft, scrollLeft: carouselRef.current.scrollLeft };
                      carouselRef.current.style.cursor = "grabbing";
                      carouselRef.current.style.scrollSnapType = "none";
                      carouselRef.current.style.userSelect = "none";
                    }}
                    onMouseLeave={() => {
                      if (!carouselRef.current || !carouselDrag.current.active) return;
                      carouselDrag.current.active = false;
                      carouselRef.current.style.cursor = "grab";
                      carouselRef.current.style.scrollSnapType = "x mandatory";
                      carouselRef.current.style.userSelect = "";
                    }}
                    onMouseUp={() => {
                      if (!carouselRef.current) return;
                      carouselDrag.current.active = false;
                      carouselRef.current.style.cursor = "grab";
                      carouselRef.current.style.scrollSnapType = "x mandatory";
                      carouselRef.current.style.userSelect = "";
                    }}
                    onMouseMove={(e) => {
                      if (!carouselDrag.current.active || !carouselRef.current) return;
                      const x = e.pageX - carouselRef.current.offsetLeft;
                      const walk = x - carouselDrag.current.startX;
                      if (Math.abs(walk) > 4) {
                        e.preventDefault();
                        carouselDrag.current.moved = true;
                        carouselRef.current.scrollLeft = carouselDrag.current.scrollLeft - walk * 1.5;
                      }
                    }}
                    onClick={(e) => {
                      if (carouselDrag.current.moved) {
                        e.stopPropagation();
                        carouselDrag.current.moved = false;
                      }
                    }}
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

                      // 모바일 요약 카드
                      if (isMobileViewport) {
                        return (
                          <motion.div
                            key={m.id}
                            layout
                            onClick={() => setDetailMember(m)}
                            className="relative flex flex-col gap-3 rounded-[1.75rem] p-4 shrink-0 active:scale-[0.98] transition-all"
                            style={{
                              width: 140,
                              scrollSnapAlign: "start",
                              background: "var(--surface-overlay)",
                              backdropFilter: "var(--glass-blur-low)",
                              WebkitBackdropFilter: "var(--glass-blur-low)",
                              boxShadow: "var(--glass-shadow)",
                            }}
                          >
                            <div
                              className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center mx-auto"
                              style={{ background: score !== null ? "var(--highlight-soft)" : "var(--surface-container)" }}
                            >
                              {score !== null ? (
                                (() => {
                                  const Icon = WEATHER_ICON_MAP[scoreToStatus(score)];
                                  return <Icon size={24} />;
                                })()
                              ) : (
                                <UserAvatar
                                  name={getDisplayName(m)}
                                  avatarEmoji={m.avatar_emoji}
                                  size={48}
                                  fallbackTextClassName="text-base font-black"
                                />
                              )}
                            </div>
                            <div className="text-center overflow-hidden">
                              <p className="font-bold text-sm tracking-tight truncate">{getDisplayName(m)}</p>
                              <p className="mt-0.5 text-[10px] font-black tracking-tight" style={{ color: score !== null ? "var(--primary)" : "var(--text-soft)" }}>
                                {score !== null ? statusToKo(status) : "기록 없음"}
                              </p>
                            </div>
                            {hasThought && (
                              <div className="flex justify-center">
                                <span className="flex h-5 items-center gap-1 rounded-full px-2 text-[9px] font-black tracking-tight" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}>
                                  <ThoughtBubbleIcon />
                                  한마디
                                </span>
                              </div>
                            )}
                          </motion.div>
                        );
                      }

                      return (
                        <motion.div
                          key={m.id}
                          layout
                          className="relative flex min-h-[27rem] flex-col gap-4 rounded-[2rem] p-5 shrink-0 group"
                          onMouseLeave={() => {
                            if (activeThoughtId === m.id) closeThought();
                          }}
                          style={{
                            width: 280,
                            maxWidth: "calc(100vw - 3rem)",
                            scrollSnapAlign: "start",
                            background: "var(--surface-overlay)",
                            backdropFilter: "var(--glass-blur-low)",
                            WebkitBackdropFilter: "var(--glass-blur-low)",
                            boxShadow: "var(--glass-shadow)",
                            zIndex: activeThoughtId === m.id ? 50 : 1,
                          }}
                        >
                          {/* 통합: 아이콘 + 이름/파트 + 날씨상태 */}
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-[1.5rem] flex items-center justify-center shrink-0"
                              style={{ background: score !== null ? "var(--highlight-soft)" : "var(--surface-container)" }}
                            >
                              {score !== null ? (
                                (() => {
                                  const Icon = WEATHER_ICON_MAP[scoreToStatus(score)];
                                  return <Icon size={26} />;
                                })()
                              ) : (
                                <UserAvatar
                                  name={getDisplayName(m)}
                                  avatarEmoji={m.avatar_emoji}
                                  size={48}
                                  fallbackTextClassName="text-lg font-black"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-base tracking-tight leading-tight truncate">{getDisplayName(m)}</p>
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
                                    onMouseEnter={(e) => openThought(m.id, e.currentTarget.getBoundingClientRect())}
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
                                      onTouchStart={(e) => beginThoughtPress(m.id, e.currentTarget.getBoundingClientRect())}
                                      onTouchEnd={endThoughtPress}
                                      onTouchCancel={endThoughtPress}
                                      onClick={(e) => toggleThought(m.id, e.currentTarget.getBoundingClientRect())}
                                      title="메시지 미리보기"
                                    >
                                      <ThoughtBubbleIcon />
                                      한마디
                                    </motion.button>
                                    <AnimatePresence>
                                      {activeThoughtId === m.id && activeThoughtRect && (
                                        <ThoughtTooltip
                                          anchorRect={activeThoughtRect}
                                          content={thought || ""}
                                        />
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

                          <div
                            className="flex flex-1 flex-col rounded-[1.5rem] px-4 py-3"
                            style={{ background: "color-mix(in srgb, var(--surface-container) 72%, transparent)" }}
                          >
                            {(() => {
                              const snapshot = jiraSnapshots[m.id];
                              const syncedLabel = snapshot?.syncedAt
                                ? new Date(snapshot.syncedAt).toLocaleTimeString("ko-KR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                                : null;

                              if (jiraLoading && !snapshot) {
                                return (
                                  <p className="text-xs font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                                    Jira 미완료 티켓을 불러오는 중...
                                  </p>
                                );
                              }

                              if (jiraError && !snapshot) {
                                return (
                                  <p className="text-xs font-semibold" style={{ color: "var(--tertiary)" }}>
                                    {jiraError}
                                  </p>
                                );
                              }

                              if (!snapshot) {
                                return (
                                  <p className="text-xs font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                                    Jira 계정 정보가 아직 연결되지 않았어요.
                                  </p>
                                );
                              }

                              return (
                                <div className="flex h-full flex-col gap-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--primary)" }}>
                                        Jira
                                      </p>
                                      <p className="text-sm font-bold tracking-tight" style={{ color: "var(--on-surface)" }}>
                                        미완료 {snapshot.openTicketCount}건
                                      </p>
                                    </div>
                                    <p className="text-[11px] font-semibold whitespace-nowrap" style={{ color: "var(--on-surface-variant)" }}>
                                      {syncedLabel ? `${syncedLabel} 갱신` : "방금 갱신"}
                                    </p>
                                  </div>

                                  {snapshot.tickets.length === 0 ? (
                                    <p className="text-xs font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                                      현재 진행 중인 티켓이 없어요.
                                    </p>
                                  ) : (
                                    <div className="flex min-h-0 flex-1 flex-col gap-2">
                                      {snapshot.tickets.map((ticket) => (
                                        <a
                                          key={ticket.key}
                                          href={ticket.browseUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-start justify-between gap-3 rounded-[1.5rem] px-3 py-2 transition-colors"
                                          style={{ background: "color-mix(in srgb, var(--surface-elevated) 68%, transparent)" }}
                                        >
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-black tracking-[0.08em]" style={{ color: "var(--primary)" }}>
                                              {ticket.key}
                                            </p>
                                            <p
                                              className="mt-0.5 text-xs font-semibold leading-5"
                                              style={{
                                                color: "var(--on-surface)",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                              }}
                                            >
                                              {ticket.summary}
                                            </p>
                                          </div>
                                          <div className="shrink-0 text-right">
                                            <p className="text-[11px] font-bold" style={{ color: "var(--on-surface-variant)" }}>
                                              {ticket.status}
                                            </p>
                                            <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "var(--surface-container)" }}>
                                              <ExternalLinkIcon size={14} />
                                            </span>
                                          </div>
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {/* 하단: 액션 */}
                          <div className="mt-auto flex justify-between pt-1">
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
                                  background: confirmResetId === m.id ? "color-mix(in srgb, var(--tertiary) 22%, transparent)" : latest && isToday ? "color-mix(in srgb, var(--tertiary) 14%, transparent)" : "var(--button-subtle-bg)",
                                  color: latest && isToday ? "color-mix(in srgb, var(--tertiary) 78%, var(--on-surface))" : "var(--text-soft)",
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
                                    className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 rounded-[1.5rem] shadow-lg z-20"
                                    style={{ background: "var(--surface-container-highest)", boxShadow: "var(--glass-shadow)" }}
                                  >
                                    <button type="button" onClick={() => { resetTodayMood(m.id); setConfirmResetId(null); }}
                                      className="flex w-10 h-10 items-center justify-center rounded-[1.25rem] text-xs font-black"
                                      style={{ background: "color-mix(in srgb, var(--tertiary) 16%, transparent)", color: "color-mix(in srgb, var(--tertiary) 78%, var(--on-surface))" }}>✓</button>
                                    <button type="button" onClick={() => setConfirmResetId(null)}
                                      className="flex w-10 h-10 items-center justify-center rounded-[1.25rem] text-sm"
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
                                    className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 rounded-[1.5rem] shadow-lg z-20"
                                    style={{ background: "var(--surface-container-highest)", boxShadow: "var(--glass-shadow)" }}
                                  >
                                    <button type="button" onClick={() => { deleteMember(m.id); setConfirmDeleteId(null); }}
                                      className="flex w-10 h-10 items-center justify-center rounded-[1.25rem] text-xs font-black"
                                      style={{ background: "var(--error-container)", color: "var(--error)" }}>✓</button>
                                    <button type="button" onClick={() => setConfirmDeleteId(null)}
                                      className="flex w-10 h-10 items-center justify-center rounded-[1.25rem] text-sm"
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
                </>
              )}
            </GlassCard>

            {/* 3. 팀원 추가 */}
            <GlassCard className="hidden md:block p-4 md:p-5" intensity="low">
              <button
                type="button"
                onClick={() => setMemberAddOpen((open) => !open)}
                className="flex w-full items-center justify-between gap-4 rounded-[1.5rem] px-4 py-3 text-left transition-all"
                style={{ background: "var(--surface-overlay)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[1.5rem]"
                    style={{ background: "var(--highlight-soft)", color: "var(--primary)" }}
                  >
                    <PlusIcon />
                  </div>
                  <div>
                    <p className="text-sm font-black tracking-tight" style={{ color: "var(--on-surface)" }}>
                      팀원 추가
                    </p>
                    <p className="text-xs font-medium" style={{ color: "var(--on-surface-variant)" }}>
                      필요할 때만 열어 새 팀원을 등록합니다
                    </p>
                  </div>
                </div>
                <motion.svg
                  animate={{ rotate: memberAddOpen ? 45 : 0 }}
                  transition={STANDARD_SPRING}
                  viewBox="0 0 24 24"
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: "var(--primary)" }}
                >
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </motion.svg>
              </button>

              <AnimatePresence initial={false}>
                {memberAddOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={STANDARD_SPRING}
                    className="overflow-hidden"
                  >
                    {/* Jira에서 가져오기 */}
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => { setJiraOpen((o) => !o); setJiraUsers([]); setJiraQuery(""); setJiraSelected(new Set()); }}
                        className="flex items-center gap-2 rounded-[1.5rem] px-4 py-2.5 text-sm font-bold transition-all"
                        style={{ background: "var(--highlight-soft)", color: "var(--primary)" }}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                          <path d="M11.75 2a9.75 9.75 0 1 0 0 19.5A9.75 9.75 0 0 0 11.75 2zm.5 5.25v4.5h4.5v1.5h-4.5v4.5h-1.5v-4.5h-4.5v-1.5h4.5v-4.5h1.5z" />
                        </svg>
                        Jira에서 팀원 검색
                      </button>

                      {jiraOpen && (
                        <div className="mt-3 rounded-[1.5rem] p-4" style={{ background: "var(--surface-container)" }}>
                          <ClimaInput
                            id="jira-user-search"
                            type="text"
                            placeholder="이름 또는 이메일로 검색"
                            value={jiraQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const q = e.target.value;
                              setJiraQuery(q);
                              if (jiraSearchTimerRef.current) clearTimeout(jiraSearchTimerRef.current);
                              jiraSearchTimerRef.current = setTimeout(() => searchJiraUsers(q), 350);
                            }}
                            className="font-bold w-full mb-3"
                          />
                          {jiraUsersLoading && <p className="text-sm font-medium py-2" style={{ color: "var(--text-soft)" }}>검색 중...</p>}
                          {jiraUsersError && <p className="text-sm font-medium py-2" style={{ color: "var(--error, #e53e3e)" }}>{jiraUsersError}</p>}
                          {!jiraUsersLoading && jiraQuery && jiraUsers.length === 0 && (
                            <p className="text-sm font-medium py-2" style={{ color: "var(--text-soft)" }}>검색 결과가 없습니다.</p>
                          )}
                          {jiraUsers.length > 0 && (
                            <>
                              <div className="flex flex-col gap-1 max-h-60 overflow-y-auto mb-3">
                                {jiraUsers.map((u) => (
                                  <label key={u.accountId} className="flex items-center gap-3 rounded-[1.5rem] px-3 py-2.5 cursor-pointer transition-all" style={{ background: jiraSelected.has(u.accountId) ? "var(--highlight-soft)" : "transparent" }}>
                                    <input
                                      type="checkbox"
                                      checked={jiraSelected.has(u.accountId)}
                                      onChange={(e) => {
                                        setJiraSelected((prev) => {
                                          const next = new Set(prev);
                                          e.target.checked ? next.add(u.accountId) : next.delete(u.accountId);
                                          return next;
                                        });
                                      }}
                                      className="h-4 w-4 accent-[var(--primary)]"
                                    />
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold truncate" style={{ color: "var(--on-surface)" }}>{u.displayName}</p>
                                      {u.emailAddress && <p className="text-xs truncate" style={{ color: "var(--text-soft)" }}>{u.emailAddress}</p>}
                                    </div>
                                  </label>
                                ))}
                              </div>
                              <ClimaButton
                                variant="primary"
                                onClick={importJiraSelected}
                                className="py-2.5 text-sm"
                                style={{ paddingInline: "1.5rem" }}
                                disabled={jiraSelected.size === 0}
                              >
                                {jiraImporting ? "추가 중..." : `선택한 ${jiraSelected.size}명 추가`}
                              </ClimaButton>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 flex-wrap pt-3">
                      <ClimaInput
                        id="add-member-name"
                        type="text"
                        placeholder="멤버 이름"
                        value={newName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addMember()}
                        className="font-bold flex-1 min-w-[140px]"
                      />
                      <ClimaInput
                        id="add-member-email"
                        type="email"
                        placeholder="이메일"
                        value={newEmail}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addMember()}
                        className="font-bold flex-1 min-w-[180px]"
                      />
                      <PortalSelect
                        value={newTeamId}
                        onChange={(v) => { setNewTeamId(v); setNewPartId(""); }}
                        placeholder="팀 선택 (선택)"
                        options={adminSession && !isSuperAdmin(adminSession) && adminSession.managedTeamId
                          ? teams.filter(t => t.id === adminSession.managedTeamId).map(t => ({ value: t.id, label: t.name }))
                          : teams.map(t => ({ value: t.id, label: t.name }))}
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
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>

            {/* 4. 팀원 초대 (이메일 발송) */}
            <GlassCard className="hidden md:block p-4 md:p-5" intensity="low">
              <SectionHeader
                icon={<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                title="팀원 초대"
                subtitle="이메일로 초대장을 발송합니다. 초대된 팀원은 로그인 후 본인 현황을 볼 수 있습니다."
                className="mb-4"
              />
              <p
                className="text-xs font-medium mb-4 rounded-[1.5rem] px-4 py-3"
                style={{ background: "color-mix(in srgb, var(--primary) 8%, transparent)", color: "var(--on-surface-variant)" }}
              >
                위 &lsquo;팀원 추가&rsquo;는 관리자가 직접 등록하는 방식이고, 이 &lsquo;팀원 초대&rsquo;는 이메일로 초대장을 보내 본인이 가입하는 방식입니다. Jira 연동이 필요하면 위 팀원 추가에서 &lsquo;Jira에서 팀원 검색&rsquo;을 이용하세요.
              </p>
              <div className="flex gap-3 flex-wrap">
                <ClimaInput
                  type="text"
                  placeholder="닉네임 (영어 이름)"
                  value={memberInviteName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemberInviteName(e.target.value)}
                  className="font-bold flex-1 min-w-[140px]"
                />
                <ClimaInput
                  type="email"
                  placeholder="이메일"
                  value={memberInviteEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemberInviteEmail(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && inviteMember()}
                  className="font-bold flex-1 min-w-[200px]"
                />
                <PortalSelect
                  value={memberInviteTeamId}
                  onChange={setMemberInviteTeamId}
                  placeholder="팀 선택"
                  options={adminSession && !isSuperAdmin(adminSession) && adminSession.managedTeamId
                    ? teams.filter(t => t.id === adminSession.managedTeamId).map(t => ({ value: t.id, label: t.name }))
                    : teams.map(t => ({ value: t.id, label: t.name }))}
                  className="flex-1"
                />
                <PortalSelect
                  value={memberInvitePartId}
                  onChange={setMemberInvitePartId}
                  placeholder="파트 선택 (선택)"
                  options={parts.filter(p => !memberInviteTeamId || p.team_id === memberInviteTeamId || !p.team_id).map(p => ({ value: p.id, label: p.name }))}
                  className="flex-1"
                />
                <ClimaButton
                  variant="primary"
                  onClick={inviteMember}
                  className="py-3 text-sm shrink-0"
                  style={{ paddingInline: "1.5rem" }}
                  disabled={!memberInviteEmail.trim() || !memberInviteName.trim() || !memberInviteTeamId}
                >
                  {memberInviting ? "초대 중..." : "초대 발송"}
                </ClimaButton>
              </div>
              {memberInviteResult && (
                <p className="mt-3 text-sm font-medium" style={{ color: memberInviteResult.ok ? "var(--primary)" : "var(--error, #e53e3e)" }}>
                  {memberInviteResult.message}
                </p>
              )}
            </GlassCard>

            {/* ── team_admin 전용: 내 팀 설정 (팀원 탭 하단 통합) ── */}
            {adminSession && !isSuperAdmin(adminSession) && adminSession.managedTeamId && (() => {
              const myTeam = teams.find(t => t.id === adminSession.managedTeamId);
              const myParts = parts.filter(p => p.team_id === adminSession.managedTeamId);
              if (!myTeam) return null;
              const origin = typeof window !== "undefined" ? window.location.origin : "";
              const param = `?team=${myTeam.id}`;
              const dashUrl = `${origin}/dashboard${param}`;
              const nikoUrl = `${origin}/niko${param}`;
              return (
                <div className="flex flex-col gap-6 pt-2">
                  <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: "var(--primary)" }}>내 팀 설정</p>

                  {/* Jira + 파트 */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Jira 프로젝트 키 */}
                    <GlassCard className="p-4 md:p-5" intensity="low">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[1.5rem]" style={{ background: "var(--highlight-soft)", color: "var(--primary)" }}>
                          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 12h8M12 8v8" strokeLinecap="round" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-black tracking-tight" style={{ color: "var(--on-surface)" }}>Jira 프로젝트 키</p>
                          <p className="text-xs font-medium" style={{ color: "var(--on-surface-variant)" }}>{myTeam.name}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(myTeam.jira_project_keys ?? []).length === 0 && (
                          <span className="text-xs" style={{ color: "var(--text-soft)" }}>없음</span>
                        )}
                        {(myTeam.jira_project_keys ?? []).map((key) => (
                          <span key={key} className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--highlight-soft)", color: "var(--primary)" }}>
                            {key}
                            <button type="button" onClick={() => removeJiraKey(myTeam.id, key)} className="leading-none hover:opacity-60 transition-opacity" aria-label={`${key} 제거`}>×</button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <ClimaInput
                          type="text"
                          placeholder="프로젝트 키 (예: IXI-A)"
                          value={jiraKeyInputs[myTeam.id] ?? ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJiraKeyInputs((prev) => ({ ...prev, [myTeam.id]: e.target.value }))}
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addJiraKey(myTeam.id)}
                          className="text-sm flex-1"
                        />
                        <ClimaButton variant="secondary" onClick={() => addJiraKey(myTeam.id)} className="py-2 text-xs shrink-0" style={{ paddingInline: "1rem" }}>
                          {savingJiraKeys[myTeam.id] ? "..." : "추가"}
                        </ClimaButton>
                      </div>
                    </GlassCard>

                    {/* 파트 관리 */}
                    <GlassCard className="p-4 md:p-5" intensity="low">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[1.5rem]" style={{ background: "var(--highlight-soft)", color: "var(--primary)" }}>
                          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-black tracking-tight" style={{ color: "var(--on-surface)" }}>파트 관리</p>
                          <p className="text-xs font-medium" style={{ color: "var(--on-surface-variant)" }}>{myTeam.name}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mb-4">
                        <ClimaInput
                          type="text"
                          placeholder="파트 이름"
                          value={newPartName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setNewPartName(e.target.value); setNewPartTeamId(myTeam.id); }}
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { setNewPartTeamId(myTeam.id); if (e.key === "Enter") addPart(); }}
                          className="font-bold flex-1"
                        />
                        <ClimaButton variant="secondary" onClick={() => { setNewPartTeamId(myTeam.id); addPart(); }} className="py-2 text-xs shrink-0" style={{ paddingInline: "1rem" }}>
                          {addingPart ? "..." : "추가"}
                        </ClimaButton>
                      </div>
                      {myParts.length === 0 ? (
                        <p className="text-sm font-bold py-2" style={{ color: "var(--text-soft)" }}>등록된 파트가 없어요.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {myParts.map(p => (
                            <div key={p.id} className="flex items-center gap-3 rounded-[1.25rem] px-4 py-3" style={{ background: "var(--surface-container-low)" }}>
                              <p className="font-bold text-sm flex-1 tracking-tight">{p.name}</p>
                              {confirmDeleteId === p.id ? (
                                <div className="flex items-center gap-2 shrink-0">
                                  <button type="button" onClick={() => { deletePart(p.id); setConfirmDeleteId(null); }} className="text-xs font-black px-3 py-1 rounded-full" style={{ background: "var(--error-container)", color: "var(--error)" }}>확인</button>
                                  <button type="button" onClick={() => setConfirmDeleteId(null)} className="text-xs font-bold" style={{ color: "var(--text-soft)" }}>취소</button>
                                </div>
                              ) : (
                                <button type="button" onClick={() => setConfirmDeleteId(p.id)} className="text-xs font-bold shrink-0 hover:opacity-60" style={{ color: "var(--text-soft)" }}>삭제</button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </GlassCard>
                  </div>

                  {/* 대시보드·니코 링크 */}
                  <GlassCard className="p-4 md:p-6" intensity="low">
                    <SectionHeader icon={<LinkIcon />} title="접속 링크" subtitle="대시보드·니코니코 링크를 복사해서 공유하세요" className="mb-4" />
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--primary)" }}>대시보드</span>
                        <div className="flex items-center gap-1.5 p-1 rounded-full" style={{ background: "var(--surface-overlay)", boxShadow: "var(--button-subtle-shadow)" }}>
                          <motion.button type="button" title="대시보드 링크 복사" onClick={() => copyWithFeedback(dashUrl, `${myTeam.id}-dash`, "link")}
                            animate={copiedLinkKey === `${myTeam.id}-dash` ? { scale: [1, 1.15, 1], backgroundColor: "var(--highlight-soft)" } : { scale: 1, backgroundColor: "var(--surface-container-low)" }}
                            className="w-11 h-11 flex items-center justify-center rounded-full shrink-0 transition-all"
                            style={{ color: copiedLinkKey === `${myTeam.id}-dash` ? "var(--primary)" : "var(--text-soft)" }}>
                            <AnimatePresence mode="wait">
                              {copiedLinkKey === `${myTeam.id}-dash`
                                ? <motion.svg key="check" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></motion.svg>
                                : <motion.div key="link" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}><LinkIcon /></motion.div>}
                            </AnimatePresence>
                          </motion.button>
                          {isPWA
                            ? <button type="button" onClick={() => router.push(dashUrl)} className="w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90" style={{ background: "var(--surface-container-low)", color: "var(--text-soft)" }}><ExternalLinkIcon /></button>
                            : <Link href={dashUrl} target="_blank" className="w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90" style={{ background: "var(--surface-container-low)", color: "var(--text-soft)" }}><ExternalLinkIcon /></Link>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--primary)" }}>니코</span>
                        <div className="flex items-center gap-1.5 p-1 rounded-full" style={{ background: "var(--surface-overlay)", boxShadow: "var(--button-subtle-shadow)" }}>
                          <motion.button type="button" title="니코니코 링크 복사" onClick={() => copyWithFeedback(nikoUrl, `${myTeam.id}-niko`, "link")}
                            animate={copiedLinkKey === `${myTeam.id}-niko` ? { scale: [1, 1.15, 1], backgroundColor: "var(--highlight-soft)" } : { scale: 1, backgroundColor: "var(--surface-container-low)" }}
                            className="w-11 h-11 flex items-center justify-center rounded-full shrink-0 transition-all"
                            style={{ color: copiedLinkKey === `${myTeam.id}-niko` ? "var(--tertiary)" : "var(--text-soft)" }}>
                            <AnimatePresence mode="wait">
                              {copiedLinkKey === `${myTeam.id}-niko`
                                ? <motion.svg key="check" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></motion.svg>
                                : <motion.div key="link" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}><LinkIcon /></motion.div>}
                            </AnimatePresence>
                          </motion.button>
                          {isPWA
                            ? <button type="button" onClick={() => router.push(nikoUrl)} className="w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90" style={{ background: "var(--surface-container-low)", color: "var(--text-soft)" }}><ExternalLinkIcon /></button>
                            : <Link href={nikoUrl} target="_blank" className="w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90" style={{ background: "var(--surface-container-low)", color: "var(--text-soft)" }}><ExternalLinkIcon /></Link>}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              );
            })()}

            {/* 모바일 관리 액션 */}
            {isMobileViewport && activeTab === "members" && (
              <div className="flex flex-col gap-3 py-2">
                <div className="flex gap-2">
                  <ClimaButton
                    variant="secondary"
                    onClick={() => setManagementSheet("add")}
                    className="flex-1 h-14 rounded-[1.5rem] text-sm font-black"
                  >
                    팀원 신규 등록
                  </ClimaButton>
                  <ClimaButton
                    variant="secondary"
                    onClick={() => setManagementSheet("invite")}
                    className="flex-1 h-14 rounded-[1.5rem] text-sm font-black"
                  >
                    초대장 발송
                  </ClimaButton>
                </div>
              </div>
            )}

          </>)}

          {activeTab === "teams" && (<>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Teams CRUD */}
              <GlassCard className="p-4 md:p-5" intensity="low">
                <button
                  type="button"
                  onClick={() => setTeamManageOpen((open) => !open)}
                  className="flex w-full items-center justify-between gap-4 rounded-[1.5rem] px-4 py-3 text-left transition-all"
                  style={{ background: "var(--surface-overlay)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-[1.5rem]"
                      style={{ background: "var(--highlight-soft)", color: "var(--primary)" }}
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight" style={{ color: "var(--on-surface)" }}>
                        팀 관리
                      </p>
                      <p className="text-xs font-medium" style={{ color: "var(--on-surface-variant)" }}>
                        필요할 때만 열어 팀을 추가하거나 삭제합니다
                      </p>
                    </div>
                  </div>
                  <motion.svg
                    animate={{ rotate: teamManageOpen ? 45 : 0 }}
                    transition={STANDARD_SPRING}
                    viewBox="0 0 24 24"
                    className="h-5 w-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ color: "var(--primary)" }}
                  >
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </motion.svg>
                </button>
                <AnimatePresence initial={false}>
                  {teamManageOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={STANDARD_SPRING}
                      className="overflow-hidden"
                    >
                      <div className="pt-4">
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
                                className="rounded-[1.5rem] px-5 py-4"
                                style={{ background: "var(--surface-container-low)" }}
                              >
                                <div className="flex items-center gap-4">
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
                                {/* Jira 프로젝트 키 */}
                                <div className="mt-3 pl-[3.25rem]">
                                  <p className="text-xs font-bold mb-1.5" style={{ color: "var(--text-soft)" }}>Jira 프로젝트</p>
                                  <div className="flex flex-wrap gap-1.5 mb-2">
                                    {(t.jira_project_keys ?? []).length === 0 && (
                                      <span className="text-xs" style={{ color: "var(--text-soft)" }}>없음</span>
                                    )}
                                    {(t.jira_project_keys ?? []).map((key) => (
                                      <span
                                        key={key}
                                        className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                                        style={{ background: "var(--highlight-soft)", color: "var(--primary)" }}
                                      >
                                        {key}
                                        <button
                                          type="button"
                                          onClick={() => removeJiraKey(t.id, key)}
                                          className="leading-none hover:opacity-60 transition-opacity"
                                          aria-label={`${key} 제거`}
                                        >
                                          ×
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <ClimaInput
                                      type="text"
                                      placeholder="프로젝트 키 (예: IXI-A)"
                                      value={jiraKeyInputs[t.id] ?? ""}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setJiraKeyInputs((prev) => ({ ...prev, [t.id]: e.target.value }))
                                      }
                                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addJiraKey(t.id)}
                                      className="text-sm flex-1"
                                    />
                                    <ClimaButton
                                      variant="secondary"
                                      onClick={() => addJiraKey(t.id)}
                                      className="py-2 text-xs shrink-0"
                                      style={{ paddingInline: "1rem" }}
                                    >
                                      {savingJiraKeys[t.id] ? "..." : "추가"}
                                    </ClimaButton>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>

              {/* Parts CRUD */}
              <GlassCard className="p-4 md:p-5" intensity="low">
                <button
                  type="button"
                  onClick={() => setPartManageOpen((open) => !open)}
                  className="flex w-full items-center justify-between gap-4 rounded-[1.5rem] px-4 py-3 text-left transition-all"
                  style={{ background: "var(--surface-overlay)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-[1.5rem]"
                      style={{ background: "var(--highlight-soft)", color: "var(--primary)" }}
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight" style={{ color: "var(--on-surface)" }}>
                        파트 관리
                      </p>
                      <p className="text-xs font-medium" style={{ color: "var(--on-surface-variant)" }}>
                        필요할 때만 열어 파트를 추가하거나 삭제합니다
                      </p>
                    </div>
                  </div>
                  <motion.svg
                    animate={{ rotate: partManageOpen ? 45 : 0 }}
                    transition={STANDARD_SPRING}
                    viewBox="0 0 24 24"
                    className="h-5 w-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ color: "var(--primary)" }}
                  >
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </motion.svg>
                </button>
                <AnimatePresence initial={false}>
                  {partManageOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={STANDARD_SPRING}
                      className="overflow-hidden"
                    >
                      <div className="pt-4">
                        <div className="flex gap-3 flex-wrap mb-6">
                          <ClimaInput
                            type="text"
                            placeholder="파트 이름"
                            value={newPartName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPartName(e.target.value)}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addPart()}
                            className="font-bold flex-1 min-w-[140px]"
                          />
                          <PortalSelect
                            value={newPartTeamId}
                            onChange={setNewPartTeamId}
                            placeholder="팀 선택 (선택)"
                            options={teams.map(t => ({ value: t.id, label: t.name }))}
                            className="flex-1 min-w-[140px]"
                          />
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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

                    return (
                      <div
                        key={t.id}
                        className="rounded-[1.5rem] px-4 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                        style={{ background: "var(--surface-container-low)" }}
                      >
                        <div className="min-w-0">
                          <p className="font-black text-base tracking-tight leading-tight">{t.name}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 md:justify-end">
                          {/* Dashboard Access */}
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--primary)" }}>대시보드</span>
                            <div className="flex items-center gap-1.5 p-1 rounded-full" style={{ background: "var(--surface-overlay)", boxShadow: "var(--button-subtle-shadow)" }}>
                              <motion.button
                                type="button"
                                title="대시보드 링크 복사"
                                onClick={() => copyWithFeedback(dashUrl, `${t.id}-dash`, "link")}
                                animate={copiedLinkKey === `${t.id}-dash`
                                  ? { scale: [1, 1.15, 1], backgroundColor: "var(--highlight-soft)" }
                                  : { scale: 1, backgroundColor: "var(--surface-container-low)" }
                                }
                                className="w-11 h-11 flex items-center justify-center rounded-full shrink-0 transition-all"
                                style={{ color: copiedLinkKey === `${t.id}-dash` ? "var(--primary)" : "var(--text-soft)" }}
                              >
                                <AnimatePresence mode="wait">
                                  {copiedLinkKey === `${t.id}-dash` ? (
                                    <motion.svg key="check" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5"
                                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                    </motion.svg>
                                  ) : (
                                    <motion.div key="link" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                                      <LinkIcon />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.button>
                              {isPWA ? (
                                <button
                                  type="button"
                                  title="대시보드 이동"
                                  onClick={() => router.push(dashUrl)}
                                  className="w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90"
                                  style={{ background: "var(--surface-container-low)", color: "var(--text-soft)" }}
                                >
                                  <ExternalLinkIcon />
                                </button>
                              ) : (
                                <Link
                                  href={dashUrl}
                                  target="_blank"
                                  title="대시보드 새 탭 열기"
                                  className="w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90"
                                  style={{ background: "var(--surface-container-low)", color: "var(--text-soft)" }}
                                >
                                  <ExternalLinkIcon />
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* Niko-Niko Access */}
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--primary)" }}>니코</span>
                            <div className="flex items-center gap-1.5 p-1 rounded-full" style={{ background: "var(--surface-overlay)", boxShadow: "var(--button-subtle-shadow)" }}>
                              <motion.button
                                type="button"
                                title="니코니코 링크 복사"
                                onClick={() => copyWithFeedback(nikoUrl, `${t.id}-niko`, "link")}
                                animate={copiedLinkKey === `${t.id}-niko`
                                  ? { scale: [1, 1.15, 1], backgroundColor: "var(--highlight-soft)" }
                                  : { scale: 1, backgroundColor: "var(--surface-container-low)" }
                                }
                                className="w-11 h-11 flex items-center justify-center rounded-full shrink-0 transition-all"
                                style={{ color: copiedLinkKey === `${t.id}-niko` ? "var(--tertiary)" : "var(--text-soft)" }}
                              >
                                <AnimatePresence mode="wait">
                                  {copiedLinkKey === `${t.id}-niko` ? (
                                    <motion.svg key="check" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5"
                                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                    </motion.svg>
                                  ) : (
                                    <motion.div key="link" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                                      <LinkIcon />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.button>
                              {isPWA ? (
                                <button
                                  type="button"
                                  title="니코 이동"
                                  onClick={() => router.push(nikoUrl)}
                                  className="w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90"
                                  style={{ background: "var(--surface-container-low)", color: "var(--text-soft)" }}
                                >
                                  <ExternalLinkIcon />
                                </button>
                              ) : (
                                <Link
                                  href={nikoUrl}
                                  target="_blank"
                                  title="니코니코 새 탭 열기"
                                  className="w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90"
                                  style={{ background: "var(--surface-container-low)", color: "var(--text-soft)" }}
                                >
                                  <ExternalLinkIcon />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}

            {/* 팀장 초대 (super_admin 전용) */}
            {(adminSession === null || isSuperAdmin(adminSession)) && (
              <GlassCard className="p-4 md:p-5 mt-4" intensity="low">
                <div className="flex items-center gap-2 mb-4">
                  <SectionHeader
                    icon={<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                    title="팀장 초대"
                    subtitle="초대된 팀장은 본인 팀만 관리할 수 있습니다"
                  />
                  <Badge variant="tertiary" className="shrink-0">SUPER ADMIN</Badge>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <ClimaInput
                    type="email"
                    placeholder="초대 이메일 (외부)"
                    value={inviteEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && inviteTeamAdmin()}
                    className="font-bold flex-1 min-w-[200px]"
                  />
                  <ClimaInput
                    type="email"
                    placeholder="사내 이메일 (선택)"
                    value={inviteWorkEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteWorkEmail(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && inviteTeamAdmin()}
                    className="font-bold flex-1 min-w-[200px]"
                  />
                  <PortalSelect
                    value={inviteTeamId}
                    onChange={setInviteTeamId}
                    placeholder="담당 팀 선택"
                    options={teams.map(t => ({ value: t.id, label: t.name }))}
                    className="flex-1"
                  />
                  <ClimaButton
                    variant="primary"
                    onClick={inviteTeamAdmin}
                    className="py-3 text-sm shrink-0"
                    style={{ paddingInline: "1.5rem" }}
                    disabled={!inviteEmail.trim() || !inviteTeamId}
                  >
                    {inviting ? "초대 중..." : "초대 발송"}
                  </ClimaButton>
                </div>
                {inviteResult && (
                  <p className="mt-3 text-sm font-medium" style={{ color: inviteResult.ok ? "var(--primary)" : "var(--error, #e53e3e)" }}>
                    {inviteResult.message}
                  </p>
                )}
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
          const moodContent = (
            <motion.div key="mood-content" className="flex flex-col gap-5 w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentMetaphor.label}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={STANDARD_SPRING}
                  className="mx-auto"
                >
                  <CurrentIcon size={isMobileViewport ? 60 : 72} />
                </motion.div>
              </AnimatePresence>

              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "var(--text-soft)" }}>
                  {targetMember?.name}의 오늘 날씨
                </p>
                <h3 className="text-2xl font-black tracking-tight" style={{ color: "var(--primary)" }}>
                  {currentMetaphor.ko}
                </h3>
              </div>

              <PrimaryTabToggle
                tabs={[
                  { value: "tile" as const, label: "빠른 선택" },
                  { value: "range" as const, label: "직접 입력" },
                ]}
                active={moodMode}
                onChange={setMoodMode}
              />

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

              <ClimaTextarea
                placeholder="한마디 (선택)"
                value={moodMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMoodMessage(e.target.value)}
                className="w-full"
              />

              {moodError && (
                <p className="w-full text-center text-sm font-bold rounded-[1.5rem] px-4 py-3"
                  style={{ background: "color-mix(in srgb, var(--error) 12%, transparent)", color: "var(--error)" }}>
                  {moodError}
                </p>
              )}
              {moodDuplicate && (
                <div className="w-full rounded-[1.5rem] px-4 py-4 flex flex-col gap-3 text-center"
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
          );

          return isMobileViewport ? (
            <motion.div key="mobile-mood-overlay">
              <BottomSheetOverlay onClose={() => setMoodTarget(null)} />
              <BottomSheet onClose={() => setMoodTarget(null)} height="78vh">
                <div className="flex h-full flex-col gap-5 overflow-y-auto px-1 pb-2">
                  {moodContent}
                </div>
              </BottomSheet>
            </motion.div>
          ) : (
            <motion.div key="desktop-mood-overlay">
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
                {moodContent}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── 팀원 상세 바텀시트 ── */}
      <AnimatePresence>
        {detailMember && (
          <motion.div key="member-detail-overlay">
            <BottomSheetOverlay onClose={() => setDetailMember(null)} />
            <BottomSheet onClose={() => setDetailMember(null)} height="88vh">
              <div className="flex h-full flex-col gap-6 overflow-y-auto px-1 pb-6">
                {/* 헤더 */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-[1.5rem] flex items-center justify-center shrink-0"
                      style={{ background: "var(--highlight-soft)" }}
                    >
                      <UserAvatar
                        name={getDisplayName(detailMember)}
                        avatarEmoji={detailMember.avatar_emoji}
                        size={56}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight">{getDisplayName(detailMember)}</h3>
                      <p className="text-sm font-bold mt-0.5" style={{ color: "var(--primary)" }}>
                        {detailMember.parts?.name ?? teams.find(t => t.id === detailMember.team_id)?.name ?? "소속 없음"}
                      </p>
                    </div>
                  </div>
                  <ClimaButton
                    variant="tertiary"
                    onClick={() => setDetailMember(null)}
                    className="shrink-0 p-2"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  </ClimaButton>
                </div>

                {/* 현황 요약 */}
                {(() => {
                  const raw = detailMember.mood_logs?.[0];
                  const isToday = raw?.logged_at
                    ? new Date(raw.logged_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) === todayKST
                    : false;
                  const latest = isToday ? raw : null;

                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-[1.5rem] p-4 flex flex-col gap-1" style={{ background: "var(--surface-overlay)" }}>
                        <p className="text-[10px] font-black tracking-widest uppercase opacity-40">오늘의 점수</p>
                        <p className="text-lg font-black" style={{ color: "var(--primary)" }}>
                          {latest ? `${latest.score}pt` : "—"}
                        </p>
                      </div>
                      <div className="rounded-[1.5rem] p-4 flex flex-col gap-1" style={{ background: "var(--surface-overlay)" }}>
                        <p className="text-[10px] font-black tracking-widest uppercase opacity-40">오늘 날씨</p>
                        <p className="text-lg font-black" style={{ color: "var(--primary)" }}>
                          {latest ? statusToKo(scoreToStatus(latest.score)) : "—"}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Jira 섹션 */}
                <div className="flex flex-col gap-3 rounded-[2rem] p-5" style={{ background: "var(--surface-overlay)" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--primary)" }}>Jira 미완료 티켓</p>
                    <span className="text-[10px] font-bold opacity-40">
                      {(() => {
                        const syncedAt = jiraSnapshots[detailMember.id]?.syncedAt;
                        return syncedAt
                          ? new Date(syncedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
                          : "데이터 없음";
                      })()}
                    </span>
                  </div>
                  {jiraSnapshots[detailMember.id]?.tickets.length === 0 ? (
                    <p className="text-sm font-bold py-2 opacity-50">진행 중인 티켓이 없습니다.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {jiraSnapshots[detailMember.id]?.tickets.map(t => (
                        <a key={t.key} href={t.browseUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 p-3 rounded-[1.25rem] bg-surface-lowest">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black tracking-wider" style={{ color: "var(--primary)" }}>{t.key}</p>
                            <p className="text-xs font-bold truncate">{t.summary}</p>
                          </div>
                          <ExternalLinkIcon size={14} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* 액션 버튼 그룹 */}
                <div className="mt-auto flex justify-between items-center pt-6 px-1">
                  {/* 기분 기록하기 */}
                  <button
                    type="button"
                    onClick={() => {
                      const raw = detailMember.mood_logs?.[0];
                      const isToday = raw?.logged_at
                        ? new Date(raw.logged_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) === todayKST
                        : false;
                      const latest = isToday ? raw : null;

                      setMoodTarget(detailMember.id);
                      setMoodScore(latest?.score ?? 50);
                      setMoodMessage(latest?.message ?? "");
                      setMoodError(null);
                      setMoodDuplicate(false);
                      setDetailMember(null);
                    }}
                    className="flex w-14 h-14 items-center justify-center rounded-full shrink-0 transition-all active:scale-90"
                    style={{ background: "var(--button-primary-gradient)", color: "var(--on-primary)", boxShadow: "var(--button-primary-shadow)" }}
                  >
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                  </button>

                  {/* 기록 링크 복사 */}
                  <motion.button
                    type="button"
                    onClick={() => { copyWithFeedback(`${window.location.origin}/input?token=${detailMember.access_token}`, detailMember.id, "member"); }}
                    animate={copiedId === detailMember.id
                      ? { scale: [1, 1.15, 1], backgroundColor: "var(--highlight-soft)" }
                      : { scale: 1, backgroundColor: "var(--surface-overlay)" }
                    }
                    className="flex w-14 h-14 items-center justify-center rounded-full shrink-0 transition-all active:scale-90"
                    style={{ color: copiedId === detailMember.id ? "var(--primary)" : "var(--text-soft)" }}
                  >
                    <AnimatePresence mode="wait">
                      {copiedId === detailMember.id ? (
                        <motion.svg key="check" viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5"
                          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </motion.svg>
                      ) : (
                        <motion.div key="link" className="w-6 h-6 flex items-center justify-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.2 }}>
                          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" />
                          </svg>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* 개인 현황 페이지 */}
                  <Link
                    href={`/personal?user=${detailMember.id}`}
                    className="flex w-14 h-14 items-center justify-center rounded-full shrink-0 transition-all active:scale-90"
                    style={{ background: "var(--surface-overlay)", color: "var(--text-soft)" }}
                  >
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="8" r="3.5" />
                      <path d="M4.5 20c0-4 3.358-7 7.5-7s7.5 3 7.5 7" strokeLinecap="round" />
                    </svg>
                  </Link>

                  {/* 기록 초기화 */}
                  <button
                    type="button"
                    onClick={() => { resetTodayMood(detailMember.id); setDetailMember(null); }}
                    className="flex w-14 h-14 items-center justify-center rounded-full shrink-0 transition-all active:scale-90"
                    style={{ background: "color-mix(in srgb, var(--tertiary) 12%, transparent)", color: "var(--tertiary)" }}
                  >
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* 삭제 버튼 */}
                  <button
                    type="button"
                    onClick={() => { if (confirm("정말 삭제하시겠습니까?")) deleteMember(detailMember.id); setDetailMember(null); }}
                    className="flex w-14 h-14 items-center justify-center rounded-full shrink-0 transition-all active:scale-90"
                    style={{ background: "var(--error-container)", color: "var(--error)" }}
                  >
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </BottomSheet>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 관리 액션 바텀시트 ── */}
      <AnimatePresence>
        {managementSheet !== "none" && (
          <motion.div key="management-overlay">
            <BottomSheetOverlay onClose={() => setManagementSheet("none")} />
            <BottomSheet onClose={() => setManagementSheet("none")} height={managementSheet === "jira" ? "90vh" : "auto"}>
              <div className="flex flex-col gap-6 px-1 pb-10 max-h-[85vh] overflow-y-auto">
                {managementSheet === "add" && (
                  <div className="flex flex-col gap-6">
                    <header>
                      <h3 className="text-xl font-black tracking-tight">새 팀원 등록</h3>
                      <p className="text-xs font-bold mt-1 opacity-50">새로운 팀원을 직접 시스템에 추가합니다.</p>
                    </header>

                    <ClimaButton
                      variant="secondary"
                      onClick={() => setManagementSheet("jira")}
                      className="py-4 font-black"
                    >
                      Jira에서 팀원 검색하여 추가
                    </ClimaButton>

                    <div className="flex flex-col gap-4">
                      <ClimaInput placeholder="이름" value={newName} onChange={e => setNewName(e.target.value)} />
                      <ClimaInput placeholder="이메일" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                      <PortalSelect
                        value={newTeamId}
                        onChange={(v) => { setNewTeamId(v); setNewPartId(""); }}
                        placeholder="팀 선택 (선택)"
                        options={teams.map(t => ({ value: t.id, label: t.name }))}
                      />
                      <PortalSelect
                        value={newPartId}
                        onChange={setNewPartId}
                        placeholder="파트 선택 (선택)"
                        options={(newTeamId ? parts.filter(p => p.team_id === newTeamId) : parts).map(p => ({ value: p.id, label: p.name }))}
                      />
                    </div>
                    <div className="flex gap-3">
                      <ClimaButton variant="primary" onClick={async () => { await addMember(); setManagementSheet("none"); }} className="flex-1 py-4 font-black">
                        추가하기
                      </ClimaButton>
                      <ClimaButton variant="tertiary" onClick={() => setManagementSheet("none")} className="py-4 font-bold px-6">
                        닫기
                      </ClimaButton>
                    </div>
                  </div>
                )}

                {managementSheet === "invite" && (
                  <div className="flex flex-col gap-6">
                    <header>
                      <h3 className="text-xl font-black tracking-tight">초대장 발송</h3>
                      <p className="text-xs font-bold mt-1 opacity-50">이메일로 초대장을 보내 팀원 스스로 가입하게 합니다.</p>
                    </header>
                    <div className="flex flex-col gap-4">
                      <ClimaInput placeholder="닉네임 (영어이름)" value={memberInviteName} onChange={e => setMemberInviteName(e.target.value)} />
                      <ClimaInput placeholder="이메일" value={memberInviteEmail} onChange={e => setMemberInviteEmail(e.target.value)} />
                      <PortalSelect
                        value={memberInviteTeamId}
                        onChange={setMemberInviteTeamId}
                        placeholder="팀 선택"
                        options={teams.map(t => ({ value: t.id, label: t.name }))}
                      />
                    </div>
                    <div className="flex gap-3">
                      <ClimaButton variant="primary" onClick={async () => { await inviteMember(); }} className="flex-1 py-4 font-black">
                        초대 발송
                      </ClimaButton>
                      <ClimaButton variant="tertiary" onClick={() => setManagementSheet("none")} className="py-4 font-bold px-6">
                        닫기
                      </ClimaButton>
                    </div>
                  </div>
                )}

                {managementSheet === "jira" && (
                  <div className="flex flex-col gap-5">
                    <header className="flex items-center justify-between">
                      <h3 className="text-xl font-black tracking-tight">Jira 검색 추가</h3>
                      <button onClick={() => setManagementSheet("add")} className="text-xs font-bold text-primary">뒤로</button>
                    </header>
                    <ClimaInput
                      placeholder="이름 또는 이메일로 검색"
                      value={jiraQuery}
                      onChange={(e) => {
                        const q = e.target.value;
                        setJiraQuery(q);
                        if (jiraSearchTimerRef.current) clearTimeout(jiraSearchTimerRef.current);
                        jiraSearchTimerRef.current = setTimeout(() => searchJiraUsers(q), 350);
                      }}
                      className="font-bold"
                    />
                    <div className="flex flex-col gap-1 min-h-[200px] overflow-y-auto">
                      {jiraUsersLoading && <p className="text-sm font-bold opacity-40 py-4 text-center">검색 중...</p>}
                      {jiraUsers.map((u) => (
                        <label key={u.accountId} className="flex items-center gap-3 p-4 rounded-[1.5rem] active:bg-surface-elevated transition-colors" style={{ background: jiraSelected.has(u.accountId) ? "var(--highlight-soft)" : "var(--surface-overlay)" }}>
                          <input type="checkbox" checked={jiraSelected.has(u.accountId)} onChange={(e) => {
                            setJiraSelected((prev) => {
                              const next = new Set(prev);
                              e.target.checked ? next.add(u.accountId) : next.delete(u.accountId);
                              return next;
                            });
                          }} className="h-4 w-4 accent-[var(--primary)]" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black truncate">{u.displayName}</p>
                            {u.emailAddress && <p className="text-[10px] font-medium opacity-50 truncate">{u.emailAddress}</p>}
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <ClimaButton onClick={async () => { await importJiraSelected(); setManagementSheet("none"); }} variant="primary" className="flex-1 py-4 font-black" disabled={jiraSelected.size === 0}>
                        {jiraImporting ? "추가 중..." : `선택한 ${jiraSelected.size}명 추가`}
                      </ClimaButton>
                    </div>
                  </div>
                )}
              </div>
            </BottomSheet>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminBottomNav isSuperAdmin={role === "super_admin" || (adminSession !== null && isSuperAdmin(adminSession))} />
    </div>
  );
}
