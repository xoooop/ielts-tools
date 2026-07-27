"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { BookOpen, Star, ChevronDown, ChevronUp, Check, X, ArrowLeft } from "lucide-react";
import { cn, getPartOfSpeechColor } from "@/lib/utils";
import type { VocabularyWord } from "@/types";
import vocabularyData from "@/data/vocabulary.json";

const words = vocabularyData as VocabularyWord[];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const WORD_BANKS = [
  { key: "all", label: "剑雅高频词", icon: "📚", filter: () => words },
  { key: "listening", label: "听力场景词", icon: "🎧", filter: () => words.filter(w => w.skill === "listening") },
  { key: "writing", label: "写作词汇", icon: "✍️", filter: () => words.filter(w => w.skill === "writing") },
  { key: "speaking", label: "口语词汇", icon: "🎤", filter: () => words.filter(w => w.skill === "speaking") },
  { key: "reading", label: "阅读词汇", icon: "📖", filter: () => words.filter(w => w.skill === "reading") },
];

const DONE_KEY = "ielts_done_words";
function loadDone(): string[] { if (typeof window === "undefined") return []; try { const r = localStorage.getItem(DONE_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }
function saveDone(ids: string[]) { if (typeof window !== "undefined") localStorage.setItem(DONE_KEY, JSON.stringify(ids)); }

export default function VocabularyPage() {
  const [bank, setBank] = useState("all");
  const [screen, setScreen] = useState<"home" | "study" | "report">("home");
  const [doneWords, setDoneWords] = useState<string[]>([]);

  // Home: browse
  const [activeLetter, setActiveLetter] = useState("A");
  const [expandedWord, setExpandedWord] = useState<string | null>(null);

  // Study
  const [roundWords, setRoundWords] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState<"self-assess" | "detail">("self-assess");
  const [dailyCount, setDailyCount] = useState(20);
  const [roundKnown, setRoundKnown] = useState(0);
  const [roundUnknown, setRoundUnknown] = useState<string[]>([]);

  useEffect(() => { setDoneWords(loadDone()); }, []);

  const bankWords = useMemo(() => WORD_BANKS.find(b => b.key === bank)!.filter(), [bank]);
  const doneSet = useMemo(() => new Set(doneWords), [doneWords]);
  const remainingWords = useMemo(() => bankWords.filter(w => !doneSet.has(w.id)), [bankWords, doneSet]);
  const progressPct = bankWords.length > 0 ? Math.round((doneWords.filter(id => bankWords.some(w => w.id === id)).length / bankWords.length) * 100) : 0;
  const bankDoneCount = doneWords.filter(id => bankWords.some(w => w.id === id)).length;

  // Home: letter grouping
  const wordsByLetter = useMemo(() => {
    const map: Record<string, VocabularyWord[]> = {}; ALPHABET.forEach(l => { map[l] = []; });
    bankWords.forEach(w => { const l = w.word.charAt(0).toUpperCase(); if (map[l]) map[l].push(w); else (map["OTHER"] = map["OTHER"] || []).push(w); });
    return map;
  }, [bankWords]);
  const availableLetters = ALPHABET.filter(l => wordsByLetter[l]?.length > 0);
  const currentLetterWords = wordsByLetter[activeLetter] || [];

  // Start study
  const startStudy = useCallback(() => {
    const sorted = [...remainingWords].sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));
    const pool = sorted.slice(0, dailyCount);
    setRoundWords(pool);
    setCurrentIndex(0); setStep("self-assess");
    setRoundKnown(0); setRoundUnknown([]);
    setScreen("study");
  }, [remainingWords, dailyCount]);

  const currentWord = screen === "study" && roundWords.length > 0 ? roundWords[Math.min(currentIndex, roundWords.length - 1)] : null;

  const handleDetailComplete = (level: 0 | 2) => {
    if (!currentWord) return;
    if (level === 2) {
      const newDone = [...doneWords, currentWord.id];
      setDoneWords(newDone); saveDone(newDone);
      setRoundKnown(prev => prev + 1);
    } else {
      setRoundUnknown(prev => [...prev, currentWord.id]);
    }
    if (currentIndex + 1 >= roundWords.length) {
      setScreen("report");
    } else {
      setCurrentIndex(prev => prev + 1); setStep("self-assess");
    }
  };

  const continueUnknown = () => {
    if (roundUnknown.length === 0) { setScreen("home"); return; }
    const unknownWords = (roundUnknown.map(id => bankWords.find(w => w.id === id)!).filter(Boolean) as VocabularyWord[])
      .sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));
    setRoundWords(unknownWords);
    setCurrentIndex(0); setStep("self-assess");
    setRoundKnown(0); setRoundUnknown([]);
    setScreen("study");
  };

  // ═══════════════════ HOME SCREEN ═══════════════════
  if (screen === "home") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-1">词汇</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">选择单词本，浏览或开始学习</p>

        {/* Word bank cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
          {WORD_BANKS.map(b => (
            <button key={b.key} onClick={() => { setBank(b.key); setActiveLetter("A"); }}
              className={cn("p-4 rounded-xl text-center transition-all border-2", bank === b.key ? "border-indigo-500 bg-indigo-500/5 shadow-sm" : "border-[var(--border-color)] bg-[var(--surface)] hover:border-[var(--text-muted)]")}>
              <span className="text-2xl">{b.icon}</span>
              <p className="text-sm font-medium mt-1.5">{b.label}</p>
              <p className="text-xs text-[var(--text-muted)]">{b.filter().length} 词</p>
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border-color)] mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">{WORD_BANKS.find(b => b.key === bank)?.label} 学习进度</span>
            <span className="text-sm text-[var(--text-muted)]">{bankDoneCount}/{bankWords.length}</span>
          </div>
          <div className="h-3 rounded-full bg-[var(--surface-alt)] overflow-hidden mb-3">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">每次</span>
              {[10, 20, 30, 50].map(n => (
                <button key={n} onClick={() => setDailyCount(n)}
                  className={cn("px-2 py-0.5 rounded text-xs", dailyCount === n ? "bg-indigo-500/10 text-indigo-400 font-medium" : "text-[var(--text-muted)] hover:text-[var(--foreground)]")}>{n}</button>
              ))}
              <span className="text-xs text-[var(--text-muted)]">词</span>
            </div>
            <button onClick={startStudy}
              className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              disabled={remainingWords.length === 0}>
              <BookOpen className="w-4 h-4" />{remainingWords.length === 0 ? "已全部学完" : "开始学习"}
            </button>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-2">学习进度保存在浏览器中，换设备或清缓存后进度会丢失</p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-[var(--border-color)]" />
          <span className="text-xs text-[var(--text-muted)] shrink-0">单词浏览</span>
          <div className="flex-1 h-px bg-[var(--border-color)]" />
        </div>

        {/* A-Z tabs */}
        <div className="flex flex-wrap gap-1 mb-4">
          {availableLetters.map(l => (
            <button key={l} onClick={() => setActiveLetter(l)}
              className={cn("w-8 h-8 rounded-lg text-xs font-bold transition-colors", activeLetter === l ? "bg-indigo-500 text-white" : "bg-[var(--surface)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--foreground)]")}>{l}</button>
          ))}
        </div>

        <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">{activeLetter} · {currentLetterWords.length} 词</h3>
        <div className="space-y-1">
          {currentLetterWords.map(w => {
            const isOpen = expandedWord === w.id;
            const isDone = doneSet.has(w.id);
            return (
              <div key={w.id} className={cn("rounded-xl border", isDone ? "border-emerald-500/30 bg-emerald-500/5" : "border-[var(--border-color)] bg-[var(--surface)]")}>
                <div className="flex items-center gap-2 p-3 cursor-pointer" onClick={() => setExpandedWord(isOpen ? null : w.id)}>
                  <span className="font-medium text-sm">{w.word}</span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded shrink-0", getPartOfSpeechColor(w.partOfSpeech))}>{w.partOfSpeech}</span>
                  {isDone && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  <span className="text-xs text-[var(--text-muted)] truncate flex-1">{w.definitionCn?.substring(0, 30)}</span>
                  {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />}
                </div>
                {isOpen && (
                  <div className="px-3 pb-3 border-t border-[var(--border-color)] pt-2 space-y-1.5">
                    {w.phonetic && <p className="text-xs text-[var(--text-muted)] font-mono">{w.phonetic}</p>}
                    <p className="text-sm">{w.definitionCn || w.definition}</p>
                    {w.exampleSentence && <p className="text-xs italic text-[var(--text-muted)]">&ldquo;{w.exampleSentence}&rdquo;</p>}
                    {w.synonyms?.length > 0 && <div className="flex flex-wrap gap-1">{w.synonyms.map(s => <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-alt)]">{s}</span>)}</div>}
                    <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={cn("w-3 h-3", i <= w.difficulty ? "fill-amber-400 text-amber-400" : "text-[var(--border-color)]")} />)}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ═══════════════════ REPORT SCREEN ═══════════════════
  if (screen === "report") {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-500/10 flex items-center justify-center"><Check className="w-8 h-8 text-indigo-400" /></div>
        <h2 className="text-xl font-bold mb-1">本轮完成</h2>
        <p className="text-sm text-[var(--text-muted)] mb-8">{roundWords.length} 个单词</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-3xl font-bold text-emerald-400">{roundKnown}</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">✅ 已掌握</p>
          </div>
          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <p className="text-3xl font-bold text-rose-400">{roundUnknown.length}</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">🔄 需复习</p>
          </div>
        </div>

        <p className="text-xs text-[var(--text-muted)] mb-8">已掌握的不再出现。未掌握的自动进入下一轮复习。</p>

        <div className="flex gap-3">
          <button onClick={() => { setScreen("home"); setStep("self-assess"); }}
            className="flex-1 py-3.5 rounded-2xl bg-[var(--surface-alt)] font-medium text-sm hover:bg-[var(--border-color)] transition-colors">返回首页</button>
          {roundUnknown.length > 0 ? (
            <button onClick={continueUnknown}
              className="flex-1 py-3.5 rounded-2xl bg-indigo-500 text-white font-medium text-sm hover:bg-indigo-600 transition-colors">复习 {roundUnknown.length} 词</button>
          ) : (
            <button onClick={() => setScreen("home")}
              className="flex-1 py-3.5 rounded-2xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors">全部掌握！</button>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════ STUDY SCREEN ═══════════════════
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setScreen("home")} className="flex items-center gap-1 text-sm text-indigo-400 hover:underline">
          <ArrowLeft className="w-4 h-4" />退出
        </button>
        <span className="text-xs text-[var(--text-muted)]">{currentIndex + 1} / {roundWords.length}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--surface-alt)] overflow-hidden mb-8">
        <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / roundWords.length) * 100}%` }} />
      </div>

      {currentWord && (
        <div>
          {/* ── Step 1: Self-assess ── */}
          {step === "self-assess" && (
            <div className="text-center">
              <div className="p-10 rounded-3xl bg-[var(--surface)] border border-[var(--border-color)] mb-8">
                <h2 className="text-5xl font-bold mb-3">{currentWord.word}</h2>
                {currentWord.phonetic && <p className="text-lg text-[var(--text-muted)] font-mono">{currentWord.phonetic}</p>}
                <span className={cn("inline-block mt-4 text-sm px-3 py-1 rounded-full", getPartOfSpeechColor(currentWord.partOfSpeech))}>{currentWord.partOfSpeech}</span>
              </div>
              <p className="text-sm text-[var(--text-muted)] mb-6">你认识这个单词吗？</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleDetailComplete(0)}
                  className="py-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium hover:bg-rose-500/20 transition-colors flex flex-col items-center gap-1.5">
                  <X className="w-6 h-6" /><span>不认识</span></button>
                <button onClick={() => setStep("detail")}
                  className="py-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium hover:bg-emerald-500/20 transition-colors flex flex-col items-center gap-1.5">
                  <Check className="w-6 h-6" /><span>我认识</span></button>
              </div>
            </div>
          )}

          {/* ── Step 2: Detail ── */}
          {step === "detail" && (
            <div>
              <div className="p-6 rounded-3xl bg-[var(--surface)] border border-indigo-500/30 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-3xl font-bold">{currentWord.word}</h2>
                  <span className={cn("text-sm px-3 py-1 rounded-full", getPartOfSpeechColor(currentWord.partOfSpeech))}>{currentWord.partOfSpeech}</span>
                </div>
                {currentWord.phonetic && <p className="text-sm text-[var(--text-muted)] font-mono mb-4">{currentWord.phonetic}</p>}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1 font-medium">释义</p>
                    <p className="text-xl font-semibold">{currentWord.definitionCn || currentWord.definition}</p>
                    {currentWord.definition && currentWord.definitionCn && <p className="text-sm text-[var(--text-muted)] mt-1">{currentWord.definition}</p>}
                  </div>
                  {currentWord.exampleSentence && (
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1 font-medium">例句</p>
                      <div className="p-3 rounded-xl bg-[var(--surface-alt)]"><p className="text-sm italic leading-relaxed">&ldquo;{currentWord.exampleSentence}&rdquo;</p></div>
                    </div>
                  )}
                  {currentWord.synonyms?.length > 0 && (
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1 font-medium">同义词</p>
                      <div className="flex flex-wrap gap-1.5">{currentWord.synonyms.map(s => <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-[var(--surface-alt)]">{s}</span>)}</div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-[var(--text-muted)] text-center mb-6">这个单词你掌握了吗？</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleDetailComplete(0)}
                  className="py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium hover:bg-rose-500/20 transition-colors flex flex-col items-center gap-1">
                  <X className="w-5 h-5" /><span className="text-sm">没掌握</span></button>
                <button onClick={() => handleDetailComplete(2)}
                  className="py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium hover:bg-emerald-500/20 transition-colors flex flex-col items-center gap-1">
                  <Check className="w-5 h-5" /><span className="text-sm">掌握了</span></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
