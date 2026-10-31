import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextRole | Voice-First Career Pivot Coach",
  description:
    "AI career pivot coach powered by real job descriptions, voice intake, and structured career transition workflows.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
