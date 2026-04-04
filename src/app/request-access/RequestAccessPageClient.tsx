"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { type FormEvent, useState, useTransition } from "react";
import ClimaLogo from "../components/WetherLogo";
import ThemeToggleButton from "../components/ThemeToggleButton";
import DynamicBackground from "../components/DynamicBackground";
import { STANDARD_SPRING, RESPONSIVE_SPRING } from "../constants/springs";
import { IconSunny, IconPartlyCloudy } from "../components/WeatherIcons";

type RequestRole = "team_admin" | "member";

type RequestFormState = {
  role: RequestRole;
  name: string;
  email: string;
  organization: string;
  teamName: string;
  message: string;
};

const INITIAL_FORM: RequestFormState = {
  role: "team_admin",
  name: "",
  email: "",
  organization: "",
  teamName: "",
  message: "",
};

const ROLE_OPTIONS: Array<{
  role: RequestRole;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  description: string;
  messagePlaceholder: string;
  messageLabel: string;
  submitLabel: string;
  teamNamePlaceholder: string;
  namePlaceholder: string;
}> = [
    {
      role: "team_admin",
      label: "팀장",
      sublabel: "파일럿 신청",
      icon: <IconSunny size={28} />,
      description: "체크인 흐름과 주간 날씨 추이, 위험 신호를 팀 운영 관점에서 먼저 확인해보세요.",
      messageLabel: "어떤 방식으로 먼저 써보고 싶은지",
      messagePlaceholder: "예: 주간 분위기 변화와 위험 신호를 빠르게 확인하고 싶습니다.",
      submitLabel: "파일럿 신청 보내기",
      teamNamePlaceholder: "예: 플랫폼팀",
      namePlaceholder: "팀장 이름",
    },
    {
      role: "member",
      label: "팀원",
      sublabel: "팀에 제안하기",
      icon: <IconPartlyCloudy size={28} />,
      description: "우리 팀에도 필요하다고 느낀다면, 이유를 남겨보세요. 팀장에게 전달할 흐름을 정리해드립니다.",
      messageLabel: "왜 우리 팀에 제안하고 싶은지",
      messagePlaceholder: "예: 체크인은 하고 있지만 팀 컨디션을 함께 보는 공통 언어가 부족합니다.",
      submitLabel: "제안 보내기",
      teamNamePlaceholder: "예: 디자인 챕터",
      namePlaceholder: "요청자 이름",
    },
  ];

const FIELD_CLASS =
  "h-14 w-full rounded-[1.2rem] px-5 text-base font-medium outline-none transition-shadow focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_14%,transparent)]";
const FIELD_STYLE = {
  background: "var(--surface-lowest)",
  color: "var(--on-surface)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 0 0 1px rgba(37,50,40,0.06)",
};

export default function RequestAccessPageClient() {
  const [form, setForm] = useState<RequestFormState>(INITIAL_FORM);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = ROLE_OPTIONS.find((o) => o.role === form.role) ?? ROLE_OPTIONS[0];

  function updateField<K extends keyof RequestFormState>(key: K, value: RequestFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function applyRole(role: RequestRole) {
    setForm((prev) => ({ ...prev, role }));
    setResult(null);
  }

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/access-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          setResult({ ok: false, message: payload?.error ?? "요청을 접수하지 못했습니다. 잠시 후 다시 시도해주세요." });
          return;
        }
        setResult({
          ok: true,
          message: form.role === "team_admin"
            ? "파일럿 신청을 접수했습니다. 운영 흐름에 맞춰 연락드릴게요."
            : "제안을 접수했습니다. 팀에 맞는 흐름으로 정리해드릴게요.",
        });
        setForm((prev) => ({ ...INITIAL_FORM, role: prev.role }));
      } catch {
        setResult({ ok: false, message: "네트워크 오류로 요청을 접수하지 못했습니다. 잠시 후 다시 시도해주세요." });
      }
    });
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: "var(--surface)" }}>
      <DynamicBackground score={72} />

      {/* 헤더 */}
      <header
        className="sticky top-0 z-40 flex h-16 items-center justify-between px-5 md:px-10"
        style={{ background: "var(--header-bg)", backdropFilter: "var(--glass-blur)", boxShadow: "var(--header-shadow)" }}
      >
        <Link href="/">
          <ClimaLogo />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden md:inline-flex h-9 items-center rounded-full px-5 text-sm font-bold transition-colors hover:opacity-80"
            style={{ background: "var(--highlight-soft)", color: "var(--primary)" }}
          >
            팀 화면 미리보기
          </Link>
          <ThemeToggleButton />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1100px] px-5 pb-24 pt-12 md:px-10 md:pt-16">
        {/* 상단 헤드라인 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={STANDARD_SPRING}
          className="mb-12 max-w-2xl"
        >
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em]"
            style={{ background: "var(--highlight-soft)", color: "var(--primary)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            액세스 요청
          </div>
          <h1
            className="text-[2.6rem] font-black leading-[1.0] tracking-[-0.05em] md:text-[4rem]"
            style={{ fontFamily: "'Public Sans', sans-serif", color: "var(--on-surface)" }}
          >
            우리 팀도<br />한번 써볼까?
          </h1>
          <p className="mt-5 text-base font-medium leading-relaxed md:text-[1.05rem]" style={{ color: "var(--text-muted)" }}>
            팀장이라면 파일럿을, 팀원이라면 제안을 남겨보세요.<br className="hidden md:block" />
            역할에 맞는 방식으로 시작할 수 있게 준비했습니다.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1fr_440px] lg:items-start">
          {/* 좌측 — 역할 선택 + 신뢰 포인트 */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...STANDARD_SPRING, delay: 0.06 }}
            className="flex flex-col gap-4"
          >
            {ROLE_OPTIONS.map((option, idx) => {
              const active = option.role === form.role;
              return (
                <motion.button
                  key={option.role}
                  type="button"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...STANDARD_SPRING, delay: 0.1 + idx * 0.07 }}
                  onClick={() => applyRole(option.role)}
                  className="rounded-[2rem] p-6 text-left transition-transform hover:-translate-y-0.5 active:scale-[0.99]"
                  style={{
                    background: active ? "var(--panel-strong)" : "var(--surface-overlay)",
                    boxShadow: active ? "var(--shadow-level-3)" : "var(--shadow-level-1)",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.2rem]"
                        style={{ background: active ? "var(--highlight-soft)" : "var(--surface-container)" }}
                      >
                        {option.icon}
                      </div>
                      <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--text-soft)" }}>
                          {option.sublabel}
                        </p>
                        <p className="text-lg font-black tracking-tight" style={{ color: "var(--on-surface)" }}>
                          {option.label}
                        </p>
                      </div>
                    </div>
                    <div
                      className="mt-0.5 shrink-0 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] transition-all"
                      style={{
                        background: active
                          ? "color-mix(in srgb, var(--primary) 12%, transparent)"
                          : "var(--surface-container)",
                        color: active ? "var(--primary)" : "var(--text-soft)",
                      }}
                    >
                      {active ? "선택됨" : "선택하기"}
                    </div>
                  </div>

                  <p className="mt-4 text-sm font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {option.description}
                  </p>
                </motion.button>
              );
            })}

            {/* 신뢰 포인트 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...STANDARD_SPRING, delay: 0.28 }}
              className="grid grid-cols-3 gap-3 mt-2"
            >
              {[
                { label: "소요 시간", value: "1분 내외" },
                { label: "대상", value: "팀장 · 팀원" },
                { label: "후속", value: "파일럿 안내" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.5rem] px-4 py-4"
                  style={{ background: "var(--surface-overlay)", boxShadow: "var(--shadow-level-1)" }}
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em]" style={{ color: "var(--text-soft)" }}>
                    {item.label}
                  </p>
                  <p className="mt-1.5 text-base font-black tracking-tight" style={{ color: "var(--on-surface)" }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* 우측 — 폼 */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...STANDARD_SPRING, delay: 0.14 }}
            className="lg:sticky lg:top-24"
          >
            <div
              className="overflow-hidden rounded-[2.2rem]"
              style={{
                background: "var(--surface-elevated)",
                backdropFilter: "var(--glass-blur-medium)",
                boxShadow: "var(--shadow-level-3)",
              }}
            >
              {/* 폼 헤더 — 역할 탭 */}
              <div className="px-6 pt-6 pb-4 md:px-7 md:pt-7">
                <div
                  className="grid grid-cols-2 gap-1.5 rounded-[1.2rem] p-1.5"
                  style={{ background: "var(--surface-container)" }}
                >
                  {ROLE_OPTIONS.map((option) => {
                    const active = option.role === form.role;
                    return (
                      <button
                        key={option.role}
                        type="button"
                        onClick={() => applyRole(option.role)}
                        className="h-11 rounded-[0.9rem] px-4 text-sm font-bold transition-all"
                        style={{
                          background: active ? "var(--surface-lowest)" : "transparent",
                          color: active ? "var(--primary)" : "var(--text-muted)",
                          boxShadow: active ? "var(--shadow-level-1)" : "none",
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={selected.role}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={RESPONSIVE_SPRING}
                    className="mt-4 text-sm font-medium leading-relaxed"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {selected.description}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* 폼 바디 */}
              <form className="flex flex-col gap-4 px-6 pb-6 md:px-7 md:pb-7" onSubmit={submitRequest}>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-extrabold uppercase tracking-[0.14em]" style={{ color: "var(--text-soft)" }}>이름</span>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className={FIELD_CLASS}
                      style={FIELD_STYLE}
                      placeholder={selected.namePlaceholder}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-extrabold uppercase tracking-[0.14em]" style={{ color: "var(--text-soft)" }}>이메일</span>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className={FIELD_CLASS}
                      style={FIELD_STYLE}
                      placeholder="@gmail.com"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-extrabold uppercase tracking-[0.14em]" style={{ color: "var(--text-soft)" }}>회사 / 조직</span>
                    <input
                      required
                      value={form.organization}
                      onChange={(e) => updateField("organization", e.target.value)}
                      className={FIELD_CLASS}
                      style={FIELD_STYLE}
                      placeholder="예: People Ops"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-extrabold uppercase tracking-[0.14em]" style={{ color: "var(--text-soft)" }}>팀 이름</span>
                    <input
                      required
                      value={form.teamName}
                      onChange={(e) => updateField("teamName", e.target.value)}
                      className={FIELD_CLASS}
                      style={FIELD_STYLE}
                      placeholder={selected.teamNamePlaceholder}
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-extrabold uppercase tracking-[0.14em]" style={{ color: "var(--text-soft)" }}>
                    {selected.messageLabel}
                  </span>
                  <textarea
                    required
                    value={form.message}
                    onChange={(e) => updateField("message", e.target.value)}
                    className="min-h-32 w-full rounded-[1.2rem] px-5 py-4 text-base font-medium outline-none transition-shadow focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_14%,transparent)]"
                    style={{ ...FIELD_STYLE, resize: "vertical" }}
                    placeholder={selected.messagePlaceholder}
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPending}
                  className="mt-1 inline-flex h-14 items-center justify-center rounded-[1.35rem] px-6 text-base font-bold transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: "var(--button-primary-gradient)",
                    color: "var(--on-primary)",
                    boxShadow: "var(--button-primary-shadow)",
                  }}
                >
                  {isPending ? "접수 중..." : selected.submitLabel}
                </button>

                <p className="text-[11px] font-semibold leading-relaxed text-center" style={{ color: "var(--text-soft)" }}>
                  남겨주신 내용은 파일럿 또는 사용 안내 연결에만 사용합니다.
                </p>
              </form>

              {/* 결과 메시지 */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={RESPONSIVE_SPRING}
                    className="mx-6 mb-6 rounded-[1.2rem] px-5 py-4 text-sm font-bold md:mx-7 md:mb-7"
                    style={{
                      background: result.ok
                        ? "color-mix(in srgb, var(--primary) 10%, var(--surface-overlay))"
                        : "color-mix(in srgb, var(--error) 10%, var(--surface-overlay))",
                      color: result.ok ? "var(--primary)" : "var(--error)",
                    }}
                  >
                    {result.message}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
