import "./globals.css";

export const metadata = {
  title: "Clima | Check how the team feels today.",
  description: "Interactive team mental health dashboard with weather metaphors.",
};

export default function RootLayout({ children }) {
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
