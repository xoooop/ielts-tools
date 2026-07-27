"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, MessageCircle, BookOpen, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "首页" },
  { href: "/agent", label: "AI助手", icon: MessageCircle },
  { href: "/vocabulary", label: "词汇", icon: BookOpen },
  { href: "/speaking", label: "口语" },
  { href: "/writing", label: "写作" },
  { href: "/settings", label: "设置", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-50 bg-[var(--surface)]/80 backdrop-blur-md border-b border-[var(--border-color)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">
            <span className="gradient-text">IELTS</span> Tools
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                pathname === l.href ? "bg-indigo-500/10 text-indigo-400" : "text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-alt)]"
              )}>{l.label}</Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
