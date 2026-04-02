"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { STANDARD_SPRING } from "../constants/springs";
import {
  ClimaButton,
  ClimaInput,
  GlassCard,
  PlayfulGeometry,
} from "../components/ui";

export default function LoginPageClient({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [emailInput, setEmailInput] = useState("");
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace(redirectTo);
    });
  }, [redirectTo, router]);

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
      setSigningIn(false);
    } else {
      router.replace(redirectTo);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center overflow-hidden relative px-6"
      style={{ background: "var(--hero-gradient)" }}
    >
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
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6 text-3xl"
            style={{ background: "var(--button-primary-gradient)", boxShadow: "var(--button-primary-shadow)", color: "var(--on-primary)" }}
          >
            ☀️
          </div>

          <h1
            className="font-black text-3xl tracking-tight mb-2"
            style={{ fontFamily: "'Space Grotesk', 'Public Sans', sans-serif", color: "var(--primary)" }}
          >
            Clima
          </h1>
          <p className="text-sm font-medium mb-10" style={{ color: "var(--on-surface-variant)" }}>
            로그인 후 이용할 수 있어요
          </p>

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
            {pwError && (
              <p className="text-xs font-bold -mt-2" style={{ color: "var(--error)" }}>{pwError}</p>
            )}
            <ClimaButton
              onClick={signIn}
              variant="primary"
              className="w-full py-4 text-base"
              disabled={signingIn}
            >
              {signingIn ? "로그인 중…" : "로그인 →"}
            </ClimaButton>
          </div>

          <p className="mt-8 text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-soft)" }}>
            Region: Horizon-01 &nbsp;·&nbsp; v4.2.0
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
