"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Keyboard, Clock, Sparkles, Plus, Play, Square, Timer } from "lucide-react";
import { getDecryptedKey, hasApiKey } from "@/lib/crypto";
import { toast } from "sonner";

// ── Topic types ───────────────────────────────────────
interface Topic {
  part: 1 | 2 | 3;
  title: string;
  prompt: string;
  isCustom?: boolean;
  prepTime?: number;
}

const PRESET_TOPICS: Topic[] = [
  // Part 1 — Introduction & Interview
  { part: 1, title: "Your Hometown", prompt: "Where is your hometown? What do you like about it? Has it changed over the years?" },
  { part: 1, title: "Work or Study", prompt: "Do you work or are you a student? What do you enjoy about your work or studies?" },
  { part: 1, title: "Daily Routine", prompt: "Describe your typical day. When do you get up? What do you do in the morning and evening?" },
  { part: 1, title: "Hobbies & Interests", prompt: "What hobbies do you have? How often do you do them? Why do you enjoy them?" },
  // Part 2 — Long Turn
  { part: 2, title: "A Memorable Journey", prompt: "Describe a memorable journey you have taken.\n\nYou should say:\n— Where you went\n— Who you went with\n— What you did there\n— And explain why it was memorable.", prepTime: 60 },
  { part: 2, title: "A Skill to Learn", prompt: "Describe a new skill you would like to learn.\n\nYou should say:\n— What the skill is\n— How you would learn it\n— How difficult you think it would be\n— And explain why you want to learn this skill.", prepTime: 60 },
  { part: 2, title: "A Person You Admire", prompt: "Describe a person you admire.\n\nYou should say:\n— Who this person is\n— How you know them\n— What they have achieved\n— And explain why you admire them.", prepTime: 60 },
  { part: 2, title: "An Important Decision", prompt: "Describe an important decision you once made.\n\nYou should say:\n— What the decision was\n— When you made it\n— How you made the decision\n— And explain how you feel about it now.", prepTime: 60 },
  // Part 3 — Discussion
  { part: 3, title: "Technology & Learning", prompt: "How has technology changed the way people learn? Do you think AI will replace teachers in the future? What are the advantages and disadvantages of online learning?" },
  { part: 3, title: "Environment & Responsibility", prompt: "Whose responsibility is environmental protection — governments, businesses, or individuals? What steps can ordinary people take to help the environment?" },
  { part: 3, title: "Education Systems", prompt: "How does the education system in your country compare with others? Should university education be free for everyone? What skills should schools teach that they currently don't?" },
  { part: 3, title: "Impact of Social Media", prompt: "How has social media changed the way people communicate? Do the benefits of social media outweigh its drawbacks? How might social media evolve in the future?" },
];

type InputMode = "mic" | "type";
type PageState = "selecting" | "ready" | "speaking" | "evaluating" | "done";
const TIMER_OPTIONS = [1, 2, 3, 5];

export default function SpeakingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  // ── Core state ──
  const [state, setState] = useState<PageState>("selecting");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("type");
  const [timerMinutes, setTimerMinutes] = useState(2);
  const [timeLeft, setTimeLeft] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [evaluation, setEvaluation] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Mic state ──
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const interimRef = useRef("");

  // ── Timer ref ──
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Custom topic dialog ──
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customPart, setCustomPart] = useState<1 | 2 | 3>(1);
  const [customTitle, setCustomTitle] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  // ── Cleanup timer on unmount ──
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Select topic ──
  const pickTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setTranscript("");
    setEvaluation("");
    setState("ready");
  };

  // ── Custom topic ──
  const confirmCustomTopic = () => {
    if (!customTitle.trim() || !customPrompt.trim()) {
      toast.error("请填写话题名称和题目");
      return;
    }
    pickTopic({ part: customPart, title: customTitle.trim(), prompt: customPrompt.trim(), isCustom: true });
    setShowCustomDialog(false);
    setCustomTitle("");
    setCustomPrompt("");
    setCustomPart(1);
  };

  // ── Timer logic ──
  const startTimer = useCallback(() => {
    const totalSeconds = timerMinutes * 60;
    setTimeLeft(totalSeconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up — auto submit
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timerMinutes]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (state === "speaking" && timeLeft === 0 && !loading) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, state]);

  // ── Mic logic ──
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("您的浏览器不支持语音识别，请使用 Chrome");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + " ";
        } else {
          interimText += result[0].transcript + " ";
        }
      }
      setTranscript(prev => {
        // Replace previous interim with new, keep all finals
        const baseWithoutInterim = interimRef.current ? prev.slice(0, prev.lastIndexOf(interimRef.current.trim())) : prev;
        const base = baseWithoutInterim.endsWith(" ") ? baseWithoutInterim : baseWithoutInterim + (baseWithoutInterim ? " " : "");
        return (base + finalText + interimText).trim();
      });
      interimRef.current = interimText;
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        toast.error("语音识别错误：" + event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still in recording state
      if (isListening) {
        try { recognition.start(); } catch { /* ignore */ }
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      toast.error("无法启动语音识别");
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    interimRef.current = "";
  }, []);

  // ── Start speaking ──
  const handleStart = () => {
    setState("speaking");
    startTimer();
    if (inputMode === "mic") {
      startListening();
    }
  };

  // ── Stop speaking ──
  const handleStop = () => {
    setState("evaluating");
    if (timerRef.current) clearInterval(timerRef.current);
    if (inputMode === "mic") stopListening();
    handleSubmit();
  };

  // ── Submit for AI evaluation ──
  const handleSubmit = async () => {
    if (!transcript.trim()) {
      toast.error("请输入你的口语回答");
      setState("ready");
      return;
    }
    const key = getDecryptedKey();
    if (!key) {
      toast.error("密钥未配置");
      setState("ready");
      return;
    }
    setLoading(true);
    setEvaluation("");
    setState("evaluating");

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `作为IELTS口语考官评估以下回答。\nPart: ${selectedTopic?.part}\n题目：${selectedTopic?.prompt}\n回答：${transcript}\n\n请给出：\n1. Overall Band Score\n2. 各评分项得分：流利度与连贯性、发音、词汇资源、语法范围与准确性\n3. 优点（3条）\n4. 改进建议（3条）\n5. 示范回答（50-80词）\n\n用中文反馈。`,
          }],
          mode: "speaking-coach",
          apiKey: key,
        }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "请求失败" }));
        throw new Error(e.error || "请求失败");
      }

      const ct = res.headers.get("content-type");
      let full = "";

      if (ct?.includes("text/event-stream")) {
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream");
        const dec = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = dec.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ")) {
              const d = line.slice(6);
              if (d === "[DONE]") continue;
              try {
                const text = JSON.parse(d).text || "";
                full += text;
                setEvaluation(full);
              } catch { /* skip malformed chunks */ }
            }
          }
        }
      } else {
        const data = await res.json();
        full = data.content || data.message || JSON.stringify(data);
        setEvaluation(full);
      }

      setState("done");
    } catch (e: any) {
      toast.error(e.message || "评估失败");
      setState("ready");
    } finally {
      setLoading(false);
    }
  };

  // ── Reset to start over ──
  const reset = () => {
    setState("selecting");
    setSelectedTopic(null);
    setTranscript("");
    setEvaluation("");
    setTimeLeft(0);
    stopListening();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // ── Format timer display ──
  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // ── Part badge styles ──
  const partBadge = (part: number) => {
    if (part === 1) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (part === 2) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  };

  // ── Group topics by part ──
  const part1Topics = PRESET_TOPICS.filter(t => t.part === 1);
  const part2Topics = PRESET_TOPICS.filter(t => t.part === 2);
  const part3Topics = PRESET_TOPICS.filter(t => t.part === 3);

  if (mounted && !hasApiKey()) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Mic className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-lg font-bold mb-2">需要配置 API 密钥</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">口语评估需要 AI 驱动，请先设置密钥</p>
        <Link href="/settings" className="inline-block px-6 py-3 rounded-xl bg-indigo-500 text-white font-medium text-sm">去设置</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-1">口语陪练</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        {state === "selecting"
          ? "选择话题 → 输入模式 → 计时回答 → AI 评估"
          : state === "ready"
          ? "调整设置，准备好后点击开始"
          : state === "speaking"
          ? "正在回答中..."
          : state === "evaluating"
          ? "AI 正在评估你的回答..."
          : "评估完成，查看反馈"}
      </p>

      {/* ════ Topic Selection ════ */}
      {state === "selecting" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Part 1 */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
              Part 1 — Introduction &amp; Interview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {part1Topics.map((t, i) => (
                <button key={i} onClick={() => pickTopic(t)}
                  className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-color)] text-left card-hover">
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Part {t.part}</span>
                  <h3 className="font-medium text-sm mt-1.5">{t.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{t.prompt}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Part 2 */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
              Part 2 — Long Turn
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {part2Topics.map((t, i) => (
                <button key={i} onClick={() => pickTopic(t)}
                  className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-color)] text-left card-hover">
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20">Part {t.part}</span>
                  <h3 className="font-medium text-sm mt-1.5">{t.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{t.prompt}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Part 3 */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5" />
              Part 3 — Discussion
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {part3Topics.map((t, i) => (
                <button key={i} onClick={() => pickTopic(t)}
                  className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-color)] text-left card-hover">
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-rose-500/10 text-rose-400 border-rose-500/20">Part {t.part}</span>
                  <h3 className="font-medium text-sm mt-1.5">{t.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{t.prompt}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom topic button */}
          <button onClick={() => setShowCustomDialog(true)}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-[var(--border-color)] text-[var(--text-muted)] hover:border-indigo-500/40 hover:text-indigo-400 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            <span className="font-medium text-sm">自定义话题</span>
          </button>
        </motion.div>
      )}

      {/* ════ Ready to Speak ════ */}
      {state === "ready" && selectedTopic && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Back button */}
          <button onClick={reset} className="text-sm text-indigo-400 mb-4 hover:underline">&larr; 换话题</button>

          {/* Topic card */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border-color)] mb-6">
            <span className={`text-xs px-2.5 py-1 rounded-full border ${partBadge(selectedTopic.part)}`}>
              Part {selectedTopic.part}
            </span>
            <h3 className="font-semibold text-lg mt-3">{selectedTopic.title}</h3>
            <p className="text-sm text-[var(--text-muted)] mt-2 whitespace-pre-wrap leading-relaxed">{selectedTopic.prompt}</p>
            {selectedTopic.isCustom && (
              <span className="text-xs text-indigo-400 mt-2 inline-block">自定义话题</span>
            )}
          </div>

          {/* Input mode toggle */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">输入方式</p>
            <div className="flex gap-2">
              <button onClick={() => setInputMode("mic")}
                className={`flex-1 py-3 rounded-xl border font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  inputMode === "mic"
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                    : "border-[var(--border-color)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
                }`}>
                <Mic className="w-4 h-4" /> 麦克风
              </button>
              <button onClick={() => setInputMode("type")}
                className={`flex-1 py-3 rounded-xl border font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  inputMode === "type"
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                    : "border-[var(--border-color)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
                }`}>
                <Keyboard className="w-4 h-4" /> 打字
              </button>
            </div>
          </div>

          {/* Timer duration */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5" /> 计时时长
            </p>
            <div className="flex gap-2">
              {TIMER_OPTIONS.map(n => (
                <button key={n} onClick={() => setTimerMinutes(n)}
                  className={`flex-1 py-2.5 rounded-xl border font-medium text-sm transition-all ${
                    timerMinutes === n
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                      : "border-[var(--border-color)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
                  }`}>
                  {n} 分钟
                </button>
              ))}
            </div>
          </div>

          {/* Start button */}
          <button onClick={handleStart}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-lg flex items-center justify-center gap-2 card-hover shadow-lg shadow-indigo-500/25">
            <Play className="w-5 h-5" /> 开始回答
          </button>
        </motion.div>
      )}

      {/* ════ Speaking ════ */}
      {(state === "speaking" || state === "evaluating") && selectedTopic && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Timer display */}
          <div className="flex items-center justify-center mb-6">
            <div className={`flex items-center gap-2 px-6 py-3 rounded-full border font-mono text-2xl font-bold ${
              timeLeft <= 10 ? "border-rose-500 bg-rose-500/10 text-rose-400 animate-pulse" : "border-[var(--border-color)] bg-[var(--surface)]"
            }`}>
              <Clock className="w-5 h-5" />
              {formatTimer(timeLeft)}
            </div>
          </div>

          {/* Topic summary (compact) */}
          <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-color)] mb-4">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${partBadge(selectedTopic.part)}`}>
              Part {selectedTopic.part}
            </span>
            <span className="text-sm font-medium ml-2">{selectedTopic.title}</span>
          </div>

          {/* Mic mode: transcript display */}
          {inputMode === "mic" && (
            <div className="mb-4">
              <button onClick={() => isListening ? stopListening() : startListening()}
                className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  isListening
                    ? "bg-rose-500 text-white animate-pulse"
                    : "bg-indigo-500 text-white"
                }`}>
                {isListening ? <><Square className="w-5 h-5" /> 停止录音</> : <><Mic className="w-5 h-5" /> 开始录音</>}
              </button>
              {isListening && (
                <p className="text-xs text-emerald-400 text-center mt-2 animate-pulse">正在聆听...</p>
              )}
              <div className="mt-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-color)] min-h-[120px] max-h-[300px] overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {transcript || <span className="text-[var(--text-muted)] italic">你的语音将在这里实时显示...</span>}
                </p>
              </div>
            </div>
          )}

          {/* Type mode: textarea */}
          {inputMode === "type" && (
            <div className="mb-4">
              <textarea
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder="在这里输入你的英文口语回答..."
                rows={10}
                className="w-full p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-color)] text-sm resize-none focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          )}

          {/* Stop & Evaluate button */}
          {state === "speaking" && (
            <button onClick={handleStop} disabled={!transcript.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-lg flex items-center justify-center gap-2 card-hover shadow-lg shadow-indigo-500/25 disabled:opacity-40">
              <Sparkles className="w-5 h-5" /> 停止并 AI 评分
            </button>
          )}

          {/* Evaluating spinner */}
          {state === "evaluating" && (
            <div className="flex flex-col items-center gap-3 py-8 text-[var(--text-muted)]">
              <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <span className="text-sm">AI 正在评估你的回答...</span>
            </div>
          )}
        </motion.div>
      )}

      {/* ════ Done — Evaluation Result ════ */}
      {state === "done" && evaluation && selectedTopic && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Topic info */}
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-color)] mb-6">
            <span className={`text-xs px-2.5 py-1 rounded-full border ${partBadge(selectedTopic.part)}`}>
              Part {selectedTopic.part}
            </span>
            <h3 className="font-semibold mt-2">{selectedTopic.title}</h3>
          </div>

          {/* Evaluation content */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border-color)] mb-4">
            <div className="prose-custom text-sm whitespace-pre-wrap">{evaluation}</div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={reset}
              className="flex-1 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface)] text-sm font-medium hover:bg-[var(--surface-alt)] transition-colors">
              换一个话题
            </button>
            <button onClick={() => {
              setTranscript("");
              setEvaluation("");
              setState("ready");
            }}
              className="flex-1 py-3 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors">
              再来一次
            </button>
          </div>
        </motion.div>
      )}

      {/* ════ Custom Topic Dialog ════ */}
      <AnimatePresence>
        {showCustomDialog && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowCustomDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border-color)] shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold mb-4">自定义话题</h2>

              {/* Part selector */}
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase block mb-2">Part</label>
              <div className="flex gap-2 mb-4">
                {([1, 2, 3] as const).map(p => (
                  <button key={p} onClick={() => setCustomPart(p)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                      customPart === p
                        ? `border-indigo-500 bg-indigo-500/10 text-indigo-400`
                        : "border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
                    }`}>
                    Part {p}
                  </button>
                ))}
              </div>

              {/* Title */}
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase block mb-2">话题名称</label>
              <input
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="例如：My Favorite Book"
                className="w-full p-3 rounded-xl bg-[var(--surface-alt)] border border-[var(--border-color)] text-sm mb-4 focus:outline-none focus:border-indigo-500/50"
              />

              {/* Prompt */}
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase block mb-2">题目描述</label>
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="输入完整的口语题目..."
                rows={4}
                className="w-full p-3 rounded-xl bg-[var(--surface-alt)] border border-[var(--border-color)] text-sm resize-none mb-6 focus:outline-none focus:border-indigo-500/50"
              />

              {/* Buttons */}
              <div className="flex gap-3">
                <button onClick={() => setShowCustomDialog(false)}
                  className="flex-1 py-3 rounded-xl border border-[var(--border-color)] text-sm font-medium hover:bg-[var(--surface-alt)] transition-colors">
                  取消
                </button>
                <button onClick={confirmCustomTopic}
                  className="flex-1 py-3 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors">
                  确认
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
