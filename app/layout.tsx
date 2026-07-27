import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import Navbar from "@/components/layout/navbar";
import AISprite from "@/components/layout/ai-sprite";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IELTS Tools - 智能备考工具",
  description: "AI驱动的雅思学习平台，免费使用",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[var(--border-color)] py-4 text-center text-xs text-[var(--text-muted)]">
          IELTS Tools · AI驱动的免费备考工具 · <a href="/disclaimer" className="hover:underline">免责声明</a>
        </footer>
        <Toaster position="top-center" richColors />
        <AISprite />
      </body>
    </html>
  );
}
