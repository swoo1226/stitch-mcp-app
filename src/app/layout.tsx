import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "./components/ThemeProvider";
import { getThemeInitScript } from "./components/themeScript";

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
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js')})}` }} />
        <ThemeProvider>
          <main className="relative min-h-screen">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
