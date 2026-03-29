import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Clima | Check how the team feels today.",
  description: "Interactive team mental health dashboard with weather metaphors.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="no-scrollbar">
        <main className="relative min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
