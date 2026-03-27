"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, DEFAULT_TEAM_ID } from "../../lib/supabase";
import { scoreToStatus, statusToEmoji } from "../../lib/mood";
import { STANDARD_SPRING, RESPONSIVE_SPRING } from "../constants/springs";
import Link from "next/link";
import ClimaLogo from "../components/WetherLogo";
import { ClimaButton } from "../components/ui";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

interface MoodLog {
  score: number;
  message: string | null;
  logged_at: string;
}

interface Member {
  id: string;
  name: string;
  avatar_emoji: string;
  access_token: string;
  mood_logs: MoodLog[];
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // 새 팀원 추가 폼
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🙂");
  const [adding, setAdding] = useState(false);

  // mood 입력 대리
  const [moodTarget, setMoodTarget] = useState<string | null>(null); // user id
  const [moodScore, setMoodScore] = useState(50);
  const [moodMessage, setMoodMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authed) fetchMembers();
  }, [authed]);

  async function fetchMembers() {
    setLoading(true);
    const { data } = await supabase
      .from("users")
      .select(`id, name, avatar_emoji, access_token, mood_logs (score, message, logged_at)`)
      .eq("team_id", DEFAULT_TEAM_ID)
      .order("logged_at", { referencedTable: "mood_logs", ascending: false });
    setMembers((data as Member[]) ?? []);
    setLoading(false);
  }

  async function addMember() {
    if (!newName.trim()) return;
    if (adding) return;
    setAdding(true);
    await supabase.from("users").insert({
      team_id: DEFAULT_TEAM_ID,
      name: newName.trim(),
      avatar_emoji: newEmoji,
    });
    setNewName("");
    setNewEmoji("🙂");
    await fetchMembers();
    setAdding(false);
  }

  async function deleteMember(id: string) {
    if (!confirm("정말 삭제할까요?")) return;
    await supabase.from("users").delete().eq("id", id);
    await fetchMembers();
  }

  async function submitMood() {
    if (!moodTarget) return;
    setSubmitting(true);
    await supabase.from("mood_logs").insert({
      user_id: moodTarget,
      score: moodScore,
      message: moodMessage.trim() || null,
    });
    setMoodTarget(null);
    setMoodScore(50);
    setMoodMessage("");
    await fetchMembers();
    setSubmitting(false);
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={STANDARD_SPRING}
          className="card-sanctuary w-full max-w-sm p-10 flex flex-col gap-6"
        >
          <ClimaLogo />
          <h1 className="text-2xl font-black font-[Plus Jakarta Sans] tracking-tight">Admin</h1>
          <input
            type="password"
            placeholder="Password"
            value={pwInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setPwInput(e.target.value); setPwError(false); }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && (pwInput === ADMIN_PASSWORD ? setAuthed(true) : setPwError(true))}
            className="input-sanctuary font-bold"
          />
          {pwError && <p className="text-xs text-red-400 font-bold -mt-2">틀렸어요.</p>}
          <ClimaButton onClick={() => pwInput === ADMIN_PASSWORD ? setAuthed(true) : setPwError(true)} className="w-full py-4">
            Enter
          </ClimaButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface px-4 md:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <ClimaLogo />
            <p className="text-xs font-bold opacity-40 mt-1 tracking-widest uppercase">Admin</p>
          </div>
          <Link href="/" className="text-xs font-bold opacity-40 hover:opacity-70 transition-opacity">← 메인으로</Link>
        </header>

        {/* 팀원 추가 */}
        <section className="card-sanctuary p-8 mb-8">
          <h2 className="text-lg font-black font-[Plus Jakarta Sans] mb-6 tracking-tight">팀원 추가</h2>
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="이름"
              value={newName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addMember()}
              className="input-sanctuary font-bold flex-1 min-w-0"
            />
            <input
              type="text"
              placeholder="이모지"
              value={newEmoji}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmoji(e.target.value)}
              className="input-sanctuary w-20 text-center text-lg"
            />
            <ClimaButton onClick={addMember} className="py-3 text-sm" style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem" }}>
              {adding ? "추가 중..." : "추가"}
            </ClimaButton>
          </div>
        </section>

        {/* 팀원 목록 */}
        <section className="card-sanctuary p-8 mb-8">
          <h2 className="text-lg font-black font-[Plus Jakarta Sans] mb-6 tracking-tight">팀원 목록</h2>
          {loading ? (
            <p className="text-sm opacity-40 font-bold">Loading...</p>
          ) : members.length === 0 ? (
            <p className="text-sm opacity-40 font-bold">팀원이 없어요.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {members.map(m => {
                const latest = m.mood_logs?.[0];
                const score = latest?.score ?? null;
                const status = score !== null ? scoreToStatus(score) : null;
                return (
                  <motion.div
                    key={m.id}
                    layout
                    className="flex items-center gap-4 bg-surface-high rounded-[1.5rem] px-5 py-4"
                  >
                    <span className="text-2xl">{m.avatar_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm tracking-tight">{m.name}</p>
                      <p className="text-xs opacity-40 font-medium truncate">
                        {score !== null ? `${statusToEmoji(status)} ${status} · ${score}점` : "기록 없음"}
                      </p>
                    </div>
                    <ClimaButton
                      onClick={() => { setMoodTarget(m.id); setMoodScore(score ?? 50); setMoodMessage(latest?.message ?? ""); }}
                      variant="secondary"
                      className="text-xs py-2 shrink-0"
                      style={{ paddingLeft: "1rem", paddingRight: "1rem" }}
                    >
                      Mood 입력
                    </ClimaButton>
                    <button
                      onClick={() => deleteMember(m.id)}
                      className="text-xs font-bold opacity-30 hover:opacity-70 transition-opacity shrink-0"
                    >
                      삭제
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* 입력 링크 안내 */}
        <section className="card-sanctuary p-8">
          <h2 className="text-lg font-black font-[Plus Jakarta Sans] mb-2 tracking-tight">팀원 입력 링크</h2>
          <p className="text-xs opacity-40 font-medium mb-6">각 팀원에게 아래 링크를 공유하면 본인이 직접 입력할 수 있어요.</p>
          <div className="flex flex-col gap-3">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 bg-surface-high rounded-[1.5rem] px-5 py-3">
                <span className="text-sm font-bold flex-1">{m.name}</span>
                <code className="text-xs opacity-50 truncate max-w-[200px]">/input?token={m.access_token}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/input?token=${m.access_token}`)}
                  className="text-xs font-bold text-primary hover:opacity-70 transition-opacity shrink-0"
                >
                  복사
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Mood 입력 모달 */}
      <AnimatePresence>
        {moodTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoodTarget(null)}
              className="fixed inset-0 bg-on-surface/10 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={STANDARD_SPRING}
              className="fixed inset-x-4 bottom-8 z-50 bg-white-sanctuary rounded-[2.5rem] p-8 shadow-ambient max-w-md mx-auto"
            >
              <h3 className="text-lg font-black font-[Plus Jakarta Sans] mb-1 tracking-tight">
                {members.find(m => m.id === moodTarget)?.name}
              </h3>
              <p className="text-xs opacity-40 font-medium mb-8">오늘의 Clima 점수를 입력해주세요.</p>

              <div className="mb-2 flex justify-between text-[10px] font-black opacity-40 tracking-widest uppercase">
                <span>Stormy</span>
                <span className="text-primary">{moodScore}점 · {scoreToStatus(moodScore)}</span>
                <span>Radiant</span>
              </div>
              <input
                type="range" min="0" max="100" value={moodScore}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMoodScore(Number(e.target.value))}
                className="w-full mb-6 accent-primary"
              />

              <textarea
                placeholder="한마디 (선택)"
                value={moodMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMoodMessage(e.target.value)}
                rows={2}
                className="input-sanctuary resize-none mb-6"
              />

              <div className="flex gap-3">
                <ClimaButton
                  onClick={submitMood}
                  className="flex-1 py-4 text-sm"
                  style={{ paddingLeft: "1rem", paddingRight: "1rem" }}
                >
                  {submitting ? "저장 중..." : "저장"}
                </ClimaButton>
                <ClimaButton
                  variant="secondary"
                  onClick={() => setMoodTarget(null)}
                  className="py-4 text-sm"
                  style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem" }}
                >
                  취소
                </ClimaButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
