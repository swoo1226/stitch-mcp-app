import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(circle at top right, rgba(197,242,237,0.42) 0%, rgba(235,250,236,0.96) 38%, rgba(228,245,229,1) 100%)",
      }}
    >
      <section
        className="w-full max-w-xl rounded-[2rem] px-8 py-10 text-center shadow-[0_24px_60px_rgba(37,50,40,0.08)]"
        style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)" }}
      >
        <p className="text-[11px] font-black uppercase tracking-[0.32em]" style={{ color: "rgba(0,102,104,0.72)" }}>
          404
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-tight" style={{ color: "var(--on-surface)" }}>
          필요한 대상을 찾을 수 없어요
        </h1>
        <p className="mt-4 text-sm leading-7" style={{ color: "rgba(37,50,40,0.7)" }}>
          팀 ID 또는 팀원 ID가 없어서 이 페이지를 열 수 없습니다. 올바른 링크로 다시 접근해 주세요.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center rounded-full px-5 py-3 text-sm font-bold transition-opacity hover:opacity-85"
            style={{
              background: "linear-gradient(135deg, #006668, #1a9d9f)",
              color: "#fff",
              boxShadow: "0 14px 30px rgba(0,102,104,0.2)",
            }}
          >
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
