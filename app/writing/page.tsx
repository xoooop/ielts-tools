"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { PenLine, Sparkles, Send } from "lucide-react";
import { getDecryptedKey, hasApiKey } from "@/lib/crypto";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function WritingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [taskType, setTaskType] = useState<1 | 2>(2);
  const [topic, setTopic] = useState("");
  const [essay, setEssay] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  if (mounted && !hasApiKey()) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-5">
          <PenLine className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-xl font-semibold mb-2">作文批改</h1>
        <p className="text-[var(--text-muted)] text-sm mb-8">请先配置 AI 密钥以使用作文批改功能</p>
        <Link href="/settings" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-500 text-white font-medium text-sm hover:bg-indigo-600 transition-colors">
          前往设置
        </Link>
      </div>
    );
  }

  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;
  const minWords = taskType === 1 ? 150 : 250;

  const handleSubmit = async () => {
    if (wordCount < 30) {
      toast.error("请至少写 30 个词再提交");
      return;
    }
    if (!topic.trim()) {
      toast.error("请输入作文题目");
      return;
    }
    const apiKey = getDecryptedKey();
    if (!apiKey) {
      toast.error("密钥未配置");
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setResult("");
    setStreamingText("");

    const systemPrompt = `你是一位资深雅思写作考官。请按照雅思官方 Band Descriptors 对以下 Task ${taskType} 作文进行四维评分（Task Response / Coherence & Cohesion / Lexical Resource / Grammatical Range & Accuracy），给出总分预估、每项分数与详细反馈、具体错误修改建议、以及总体改进建议。请用中文回复。`;

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `题目：${topic}\n\n作文（${wordCount} 词）：\n${essay}` },
          ],
          mode: "essay-correct",
          apiKey,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "请求失败" }));
        throw new Error(e.error || "请求失败");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const dec = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value, { stream: true }).split("\n")) {
          if (line.startsWith("data: ")) {
            const d = line.slice(6);
            if (d === "[DONE]") continue;
            try {
              const p = JSON.parse(d);
              if (p.text) {
                full += p.text;
                setStreamingText(full);
              }
            } catch {}
          }
        }
      }
      setResult(full);
      setStreamingText("");
    } catch (e: any) {
      if (e.name === "AbortError") return;
      toast.error(e.message || "批改请求失败");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">作文批改</h1>
        <p className="text-sm text-[var(--text-muted)]">提交雅思作文，获取考官级四维评分与逐句纠错反馈</p>
      </div>

      {/* Task Type Selector */}
      <div className="mb-5">
        <label className="block text-sm font-medium mb-2">题目类型</label>
        <div className="flex gap-2">
          <button
            onClick={() => { setTaskType(1); setResult(""); }}
            className={`flex-1 p-3 rounded-xl text-sm font-medium transition-colors ${
              taskType === 1
                ? "bg-indigo-500 text-white"
                : "bg-[var(--surface)] border border-[var(--border-color)] text-[var(--foreground)] hover:border-[var(--text-muted)]"
            }`}
          >
            Task 1 · 图表描述
          </button>
          <button
            onClick={() => { setTaskType(2); setResult(""); }}
            className={`flex-1 p-3 rounded-xl text-sm font-medium transition-colors ${
              taskType === 2
                ? "bg-indigo-500 text-white"
                : "bg-[var(--surface)] border border-[var(--border-color)] text-[var(--foreground)] hover:border-[var(--text-muted)]"
            }`}
          >
            Task 2 · 议论文
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1.5">
          最少 {minWords} 词 · Task 1 建议 20min / Task 2 建议 40min
        </p>
      </div>

      {/* Topic Input */}
      <div className="mb-5">
        <label htmlFor="topic" className="block text-sm font-medium mb-2">
          作文题目
        </label>
        <textarea
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="粘贴或输入雅思作文题目，如：Some people believe that the increasing use of technology has had a negative impact on face-to-face social interaction. Discuss both views and give your opinion."
          rows={3}
          className="w-full resize-none rounded-xl px-4 py-3 text-sm bg-[var(--surface)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-[var(--text-muted)]"
        />
      </div>

      {/* Essay Input */}
      <div className="mb-2">
        <label htmlFor="essay" className="block text-sm font-medium mb-2">
          你的作文
        </label>
        <textarea
          id="essay"
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="在这里输入或粘贴你的英文作文..."
          rows={16}
          className="w-full resize-none rounded-xl px-4 py-3 text-sm bg-[var(--surface)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono leading-relaxed placeholder:text-[var(--text-muted)]"
        />
      </div>

      {/* Word Count */}
      <div className="flex items-center justify-between mb-5">
        <p className={`text-xs ${wordCount >= minWords ? "text-emerald-400" : "text-[var(--text-muted)]"}`}>
          {wordCount} / {minWords} 词
          {wordCount >= minWords && " ✓ 已达标"}
        </p>
        {wordCount < minWords && wordCount > 0 && (
          <p className="text-xs text-[var(--text-muted)]">还差 {minWords - wordCount} 词</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !essay.trim() || !topic.trim()}
        className="w-full py-3 rounded-xl bg-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-indigo-600 disabled:opacity-40 transition-colors"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            批改中...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            提交批改
          </>
        )}
      </button>

      {/* Streaming / Result */}
      {(streamingText || result) && (
        <div className="mt-6 p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border-color)]">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold">批改结果</h3>
          </div>
          <div className="prose-custom text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {streamingText || result}
            </ReactMarkdown>
          </div>
          {streamingText && (
            <span className="inline-block w-1.5 h-4 bg-indigo-400 ml-0.5 animate-pulse rounded-sm align-middle" />
          )}
        </div>
      )}
    </div>
  );
}
