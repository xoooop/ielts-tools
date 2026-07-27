"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, Mic, PenLine, MessageCircle, ArrowRight, Key } from "lucide-react";
import AdBanner from "@/components/layout/ad-banner";

const features = [
  { icon: MessageCircle, title: "AI 雅思助手", desc: "7种专业模式：问答、翻译、句式扩写、作文批改、语法讲解、学习规划。内置成套提示词，开箱即用，无需自己调试 Prompt。", href: "/agent", bg: "bg-indigo-500/10", iconColor: "text-indigo-400" },
  { icon: BookOpen, title: "核心词汇", desc: "4200+ 雅思词汇，闪卡记忆模式，按技能分类单词本，每日学习计划追踪。词汇学习功能永久免费。", href: "/vocabulary", bg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
  { icon: Mic, title: "口语陪练", desc: "12个真实话题 + 自定义话题 · 麦克风/打字双模式 · AI 考官四维评估 · 倒计时模拟真实考场", href: "/speaking", bg: "bg-amber-500/10", iconColor: "text-amber-400" },
  { icon: PenLine, title: "作文批改", desc: "Task 1 & 2 · 自定义题目 · 考官级四维评分 · 逐句纠错 · 范文对照 · 费用直付AI官方", href: "/writing", bg: "bg-rose-500/10", iconColor: "text-rose-400" },
];

export default function HomePage() {
  return (
    <div>
      {/* ── Top slogan bar ── */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center py-2 px-4 text-xs md:text-sm font-medium">
        词汇工具永久免费 ｜ 自备密钥 ｜ 零平台溢价
      </div>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-20 md:py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">IELTS 智能备考工具</h1>
            <p className="text-base md:text-lg text-white/85 mb-8 max-w-3xl mx-auto leading-relaxed">
              词汇学习永久免费。接入你自己的AI密钥，Token费用由AI厂商官方收取，平台无任何加价。
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/agent" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-indigo-600 font-semibold hover:bg-white/90 transition-colors shadow-lg">
                <Sparkles className="w-5 h-5" /> 开始使用
              </Link>
              <Link href="/settings" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors border border-white/20">
                <Key className="w-4 h-4" /> 配置 API 密钥
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="max-w-4xl mx-auto px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-3 gap-4">
          {[{ v: "4200+", l: "核心词汇", sub: "永久免费" }, { v: "7 种", l: "AI 专业模式", sub: "内置提示词" }, { v: "0", l: "平台溢价", sub: "自备密钥" }].map(s => (
            <div key={s.l} className="bg-[var(--surface)] rounded-2xl p-6 text-center shadow-lg border border-[var(--border-color)]">
              <p className="text-2xl md:text-3xl font-bold gradient-text">{s.v}</p>
              <p className="text-sm font-medium mt-1">{s.l}</p>
              <p className="text-xs text-[var(--text-muted)]">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-10">
        <h2 className="text-2xl font-bold text-center mb-3">核心功能</h2>
        <p className="text-sm text-[var(--text-muted)] text-center mb-10">内置雅思专业提示词，开箱即用</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.href} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
              <Link href={f.href} className="block p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border-color)] hover:shadow-lg hover:border-indigo-500/30 transition-all group h-full">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center shrink-0`}>
                    <f.icon className={`w-6 h-6 ${f.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1.5">{f.title}</h3>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-indigo-400 transition-colors shrink-0 mt-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Ad ── */}
      <div className="max-w-4xl mx-auto px-6">
        <AdBanner slot="home-bottom" />
      </div>

      {/* ── CTA ── */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl p-8 text-center border border-indigo-500/20">
          <h2 className="text-xl font-bold mb-2">开始使用</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">自备 API 密钥，在 DeepSeek 官方平台充值，Token 费用直接结算，平台不加价</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/settings" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors">
              <Key className="w-4 h-4" /> 配置 API 密钥
            </Link>
            <Link href="/guide" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border-color)] font-medium text-sm hover:bg-[var(--surface-alt)] transition-colors">
              如何获取密钥？
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
