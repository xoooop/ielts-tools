"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Target, BookOpen, PenLine, Mic, Clock, ChevronRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const PLAN_KEY = "ielts_agent_plan_summary";

export interface PlanSummary {
  words: number; sentences: number; essays: number;
  speakingMinutes: number; listeningMinutes: number; readingCount: number;
  totalHours: number; title: string; updatedAt: number;
}

export function extractPlanFromText(text: string): PlanSummary | null {
  const match = text.match(/📋\s*学习任务提炼[\s\S]*?(?=\n###|\n##|$)/);
  if (!match) return null;
  const section = match[0];
  const getNum = (p: RegExp) => { const m = section.match(p); return m ? parseInt(m[1]) || 0 : 0; };
  return {
    // Match both table format "| 📖 单词 | X 个 |" and old format "单词：X 个"
    words: getNum(/单词[^|\n]*[：:|]\s*(\d+)/),
    sentences: getNum(/句式[^|\n]*[：:|]\s*(\d+)/),
    essays: getNum(/作文[^|\n]*[：:|]\s*(\d+)/),
    speakingMinutes: getNum(/口语[^|\n]*[：:|]\s*(\d+)/),
    listeningMinutes: getNum(/听力[^|\n]*[：:|]\s*(\d+)/),
    readingCount: getNum(/阅读[^|\n]*[：:|]\s*(\d+)/),
    totalHours: 0,
    title: "今日学习计划",
    updatedAt: Date.now(),
  };
}
export function savePlanSummary(s: PlanSummary) { if (typeof window !== "undefined") localStorage.setItem(PLAN_KEY, JSON.stringify(s)); }
export function loadPlanSummary(): PlanSummary | null {
  if (typeof window === "undefined") return null;
  try { const r = localStorage.getItem(PLAN_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}

export default function AISprite() {
  const [isOpen, setIsOpen] = useState(false);
  const [plan, setPlan] = useState<PlanSummary | null>(null);
  const [pos, setPos] = useState(() => {
    if (typeof window !== "undefined") return { x: window.innerWidth - 80, y: window.innerHeight - 160 };
    return { x: 300, y: 500 }; // SSR default
  });
  const [mounted, setMounted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, origX: 0, origY: 0 });
  const hasMoved = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  // Load plan
  useEffect(() => {
    setPlan(loadPlanSummary());
    const check = () => { const p = loadPlanSummary(); if (p) setPlan(p); };
    window.addEventListener("storage", check);
    window.addEventListener("plan-updated", check as any);
    const int = setInterval(check, 5000);
    return () => { window.removeEventListener("storage", check); window.removeEventListener("plan-updated", check as any); clearInterval(int); };
  }, []);

  // Drag handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    hasMoved.current = false;
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y, origX: pos.x, origY: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const nx = e.clientX - dragStart.current.x;
    const ny = e.clientY - dragStart.current.y;
    if (Math.abs(nx - dragStart.current.origX) > 3 || Math.abs(ny - dragStart.current.origY) > 3) hasMoved.current = true;
    setPos({ x: Math.max(0, Math.min(window.innerWidth - 64, nx)), y: Math.max(0, Math.min(window.innerHeight - 64, ny)) });
  }, [dragging]);

  const onPointerUp = useCallback(() => {
    setDragging(false);
    if (!hasMoved.current) setIsOpen(prev => !prev);
  }, []);

  const hasPlan = plan && plan.words + plan.sentences + plan.essays + plan.speakingMinutes > 0;
  const tasks = hasPlan ? [
    { icon: BookOpen, label: "单词", value: `${plan!.words} 个`, color: "text-emerald-400" },
    { icon: PenLine, label: "句式", value: `${plan!.sentences} 句`, color: "text-purple-400" },
    { icon: Target, label: "作文", value: `${plan!.essays} 篇`, color: "text-rose-400" },
    { icon: Mic, label: "口语", value: `${plan!.speakingMinutes} 分钟`, color: "text-amber-400" },
  ].filter(t => !t.value.startsWith("0")) : [];

  if (!mounted) return null;
  return (
    <>
      {/* Draggable floating button */}
      <motion.button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        animate={{ x: pos.x, y: pos.y }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="fixed z-50 w-16 h-16 rounded-2xl shadow-xl cursor-grab active:cursor-grabbing active:shadow-2xl select-none touch-none"
        style={{
          background: "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)",
        }}
      >
        <span className="text-2xl">🦉</span>
        {/* Pulse ring when no plan */}
        {!hasPlan && (
          <span className="absolute inset-0 rounded-2xl animate-ping bg-amber-400/30" />
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{ left: Math.max(8, pos.x - 260), top: pos.y - 20 }}
            className="fixed z-50 w-72 rounded-3xl bg-[var(--surface)] border border-[var(--border-color)] shadow-2xl overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🦉</span>
                <h3 className="font-semibold text-sm">学习小精灵</h3>
              </div>
            </div>

            <div className="p-4">
              {hasPlan ? (
                <>
                  <p className="text-xs text-[var(--text-muted)] mb-3">{plan!.title}</p>
                  <div className="space-y-2 mb-3">
                    {tasks.map((t, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><t.icon className={`w-4 h-4 ${t.color}`} /><span className="text-sm">{t.label}</span></div>
                        <span className="text-sm font-semibold">{t.value}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/agent" onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-1 w-full py-2.5 mt-4 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors">
                    去 AI 助手 <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-[var(--text-muted)] mb-3">还没有今日学习计划哦~</p>
                  <p className="text-xs text-[var(--text-muted)] mb-4">去 AI 助手用「学习规划」模式生成一份吧！</p>
                  <Link href="/agent" onClick={() => setIsOpen(false)}
                    className="inline-flex items-center gap-1 px-6 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors">
                    <Sparkles className="w-4 h-4" /> 去规划
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
