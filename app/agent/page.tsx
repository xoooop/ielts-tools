"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getDecryptedKey, hasApiKey } from "@/lib/crypto";
import { generateId } from "@/lib/utils";
import { Send, Sparkles, Wand2, Languages, Calendar, BookOpen, Key } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import type { ChatMessage, AgentMode } from "@/types";
import { extractPlanFromText, savePlanSummary } from "@/components/layout/ai-sprite";
import AdBanner from "@/components/layout/ad-banner";

const MODES: { key: AgentMode; label: string; icon: React.ElementType; desc: string; placeholder: string; color: string }[] = [
  { key: "chat", label: "雅思问答", icon: Sparkles, desc: "备考策略 · 评分标准 · 常见问题", placeholder: "问任何雅思相关问题...", color: "indigo" },
  { key: "translate", label: "翻译", icon: Languages, desc: "中英互译 · 学术风格 · 词汇详解", placeholder: "输入要翻译的单词、句子或段落...", color: "emerald" },
  { key: "expand-sentence", label: "句式扩写", icon: Wand2, desc: "简单句 → 10种技法复杂句", placeholder: "输入一个英文简单句，如：Technology has changed education.", color: "purple" },
  { key: "grammar-explain", label: "语法讲解", icon: BookOpen, desc: "结构公式 · 真题例句 · 常见错误", placeholder: "输入语法点，如：定语从句、虚拟语气、倒装句...", color: "blue" },
  { key: "plan", label: "学习规划", icon: Calendar, desc: "每日时间表 · 四科均衡", placeholder: "告诉我你今天能学多久、目标分数、薄弱环节...", color: "amber" },
];

const colorMap: Record<string, string> = {
  indigo: "border-indigo-500 bg-indigo-500/5 text-indigo-400",
  emerald: "border-emerald-500 bg-emerald-500/5 text-emerald-400",
  purple: "border-purple-500 bg-purple-500/5 text-purple-400",
  rose: "border-rose-500 bg-rose-500/5 text-rose-400",
  blue: "border-blue-500 bg-blue-500/5 text-blue-400",
  amber: "border-amber-500 bg-amber-500/5 text-amber-400",
};

function getStorageKey(mode: AgentMode) { return `ielts_agent_history_${mode}`; }
function loadHistory(mode: AgentMode): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try { const raw = localStorage.getItem(getStorageKey(mode)); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveHistory(mode: AgentMode, messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(getStorageKey(mode), JSON.stringify(messages)); } catch {}
}

export default function AgentPage() {
  const [mode, setMode] = useState<AgentMode>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const apiKeyMissing = mounted && !hasApiKey();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => { setMessages(loadHistory(mode)); setStreamingText(""); }, [mode]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingText]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const apiKey = getDecryptedKey();
    if (!apiKey) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userMsg: ChatMessage = { id: generateId(), role: "user", content: text, timestamp: Date.now(), mode };
    const withUser = [...messages, userMsg];
    setMessages(withUser);
    saveHistory(mode, withUser);
    setInput("");
    setLoading(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/agent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: withUser, mode, apiKey }),
        signal: controller.signal,
      });
      if (!res.ok) { const e = await res.json().catch(() => ({ error: "请求失败" })); throw new Error(e.error); }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const dec = new TextDecoder(); let full = "";
      while (true) { const { done, value } = await reader.read(); if (done) break;
        for (const line of dec.decode(value, { stream: true }).split("\n")) {
          if (line.startsWith("data: ")) { const d = line.slice(6); if (d === "[DONE]") continue;
            try { const p = JSON.parse(d); if (p.text) { full += p.text; setStreamingText(full); } } catch {}
          }
        }
      }
      const am: ChatMessage = { id: generateId(), role: "assistant", content: full, timestamp: Date.now(), mode };
      setMessages(prev => [...prev, am]);
      saveHistory(mode, [...withUser, am]);
      setStreamingText("");
      // Extract study plan for the sprite if in plan mode
      if (mode === "plan") {
        const summary = extractPlanFromText(full);
        if (summary) { savePlanSummary(summary); window.dispatchEvent(new Event("plan-updated")); }
      }
    } catch (e: any) {
      if (e.name === "AbortError") return;
      const em: ChatMessage = { id: generateId(), role: "assistant", content: `> ${e.message || "请求失败"}`, timestamp: Date.now(), mode };
      setMessages(prev => [...prev, em]);
      saveHistory(mode, [...withUser, em]);
      setStreamingText("");
    } finally { setLoading(false); abortRef.current = null; }
  }, [input, loading, messages, mode]);

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  if (apiKeyMissing) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-5">
          <Key className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-xl font-semibold mb-2">AI 雅思助手</h1>
        <p className="text-[var(--text-muted)] text-sm mb-8">请先配置 DeepSeek API 密钥</p>
        <Link href="/settings" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-500 text-white font-medium text-sm hover:bg-indigo-600 transition-colors">前往设置</Link>
      </div>
    );
  }

  const currentMode = MODES.find(m => m.key === mode)!;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">AI 雅思助手</h1>
        <p className="text-sm text-[var(--text-muted)]">选择模式，开始对话。每个模式独立记忆上下文。</p>
      </div>

      {/* Mode cards — grid layout instead of cramped chips */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {MODES.map(m => {
          const Icon = m.icon;
          const active = mode === m.key;
          return (
            <button key={m.key} onClick={() => { if (!loading) setMode(m.key); }} disabled={loading}
              className={`text-left p-4 rounded-2xl border-2 transition-all ${
                active ? `border-${m.color}-500 bg-${m.color}-500/5 shadow-sm` : "border-[var(--border-color)] bg-[var(--surface)] hover:border-[var(--text-muted)]"
              } ${loading ? "opacity-50" : ""}`}>
              <div className={`w-10 h-10 rounded-xl ${active ? `bg-${m.color}-500/10` : "bg-[var(--surface-alt)]"} flex items-center justify-center mb-2`}>
                <Icon className={`w-5 h-5 ${active ? `text-${m.color}-400` : "text-[var(--text-muted)]"}`} />
              </div>
              <h3 className="font-semibold text-sm">{m.label}</h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-tight">{m.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Ad */}
      <AdBanner slot="agent-top" />

      {/* Current mode indicator */}
      <div className={`flex items-center gap-3 p-3 rounded-xl border mb-6 ${colorMap[currentMode.color] || colorMap.indigo}`}>
        <currentMode.icon className="w-5 h-5" />
        <div>
          <p className="text-sm font-semibold">{currentMode.label} 模式</p>
          <p className="text-xs opacity-70">{currentMode.desc}</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-color)] mb-4" style={{ minHeight: "400px", maxHeight: "60vh" }}>
        <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {messages.length === 0 && !streamingText && (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
              <currentMode.icon className="w-12 h-12 mb-3 opacity-25" />
              <p className="text-sm text-center">{currentMode.placeholder}</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                msg.role === "user" ? "bg-indigo-500 text-white rounded-br-md" : "bg-[var(--surface-alt)] text-[var(--foreground)] rounded-bl-md"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose-custom"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                ) : <p className="whitespace-pre-wrap">{msg.content}</p>}
              </div>
            </div>
          ))}
          {streamingText && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-bl-md px-5 py-3 bg-[var(--surface-alt)]">
                <div className="prose-custom"><ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown></div>
                <span className="inline-block w-1.5 h-4 bg-indigo-400 ml-0.5 animate-pulse rounded-sm" />
              </div>
            </div>
          )}
          {loading && !streamingText && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md px-5 py-3 bg-[var(--surface-alt)]">
                <div className="flex gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" /><span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" /><span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" /></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder={currentMode.placeholder} rows={2}
          disabled={loading}
          className="flex-1 resize-none rounded-xl px-4 py-3 text-sm bg-[var(--surface)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50" />
        <button onClick={handleSend} disabled={!input.trim() || loading}
          className="shrink-0 w-12 h-12 rounded-xl bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-600 disabled:opacity-40 transition-colors">
          <Send className="w-5 h-5" />
        </button>
      </div>
      <p className="text-center text-[11px] text-[var(--text-muted)] mt-3">{currentMode.label}模式 · 由 DeepSeek 驱动 · 对话记忆保留</p>
    </div>
  );
}
