import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "./components/ThemeProvider";
import { getThemeInitScript } from "./components/themeScript";
import UpdateToast from "./components/UpdateToast";
import SplashScreen from "./components/SplashScreen";

export const metadata: Metadata = {
  title: "Clima | Check how the team feels today.",
  description: "Interactive team mental health dashboard with weather metaphors.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Clima",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1a8a8c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="no-scrollbar">
        <script dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
            if (!isStandalone) {
              document.documentElement.classList.add('not-pwa');
            }
          })();
        ` }} />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'})})}` }} />
        <ThemeProvider>
          {/* 정적 스플래시 구조 (SSR 단계에서 즉시 노출) */}
          <div id="pwa-splash-static" className="pwa-only h-screen w-screen fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-surface" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex flex-col items-center">
              <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>Clima</div>
              <div className="mt-2 text-base text-on-surface-variant font-medium" style={{ fontFamily: "'Manrope', sans-serif" }}>팀의 날씨를 읽다</div>
            </div>
            <div className="mt-10 flex gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary opacity-60 animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="h-1.5 w-1.5 rounded-full bg-primary opacity-60 animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="h-1.5 w-1.5 rounded-full bg-primary opacity-60 animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>

          <SplashScreen />
          <main className="relative min-h-screen">
            {children}
          </main>
          <UpdateToast />
        </ThemeProvider>
      </body>
    </html>
  );
}
