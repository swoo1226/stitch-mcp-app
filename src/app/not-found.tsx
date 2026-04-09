import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-6"
      style={{
        background:
          "var(--hero-gradient)",
      }}
    >
      <section
        className="w-full max-w-xl rounded-[2rem] px-8 py-10 text-center shadow-ambient"
        style={{ background: "var(--surface-overlay)", backdropFilter: "var(--glass-blur)" }}
      >
        <p className="text-[11px] font-black uppercase tracking-[0.32em]" style={{ color: "var(--text-muted)" }}>
          404
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-tight" style={{ color: "var(--on-surface)" }}>
          필요한 대상을 찾을 수 없어요
        </h1>
        <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-soft)" }}>
          팀 ID 또는 팀원 ID가 없어서 이 페이지를 열 수 없습니다. 올바른 링크로 다시 접근해 주세요.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center rounded-full px-5 py-3 text-sm font-bold transition-opacity hover:opacity-85"
            style={{
              background: "var(--button-primary-gradient)",
              color: "var(--on-primary)",
              boxShadow: "var(--button-primary-shadow)",
            }}
          >
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
